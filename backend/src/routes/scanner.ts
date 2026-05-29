import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireStaff } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { validateConsumerToken, invalidateToken, hashToken } from '../lib/tokenEngine'
import { createSupabaseClient, SupabaseError } from '../lib/supabase'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const scannerRoutes = new Hono<HonoEnv>()

// ─── POST /scanner/scan ───────────────────────────────────────────────────────
// Staff endpoint for the business scanner UI (/business/scanner).
// Accepts the consumer's 90-second QR token, validates its HMAC signature and
// expiry, then registers the visit and updates the loyalty card.
//
// Auth:  X-Staff-Key: <businessId>:<rawKey>
// Body:  { token: string, notes?: string }

scannerRoutes.post('/scan', requireStaff(), rateLimit({ keyPrefix: 'scanner' }), async (c) => {
  const businessId = c.get('businessId')

  const body = await c.req.json<{
    token: string
    notes?: string
  }>().catch(() => null)

  if (!body?.token) {
    return c.json(err('VALIDATION_ERROR', 'token is required'), 400)
  }

  const ttl = parseInt(c.env.TOKEN_TTL_SECONDS, 10)

  // ── Step 1: Validate consumer token (signature + expiry + blacklist) ──────────
  const tokenResult = await validateConsumerToken(
    body.token,
    c.env.TOKEN_SECRET,
    ttl,
    c.env.TOKEN_BLACKLIST
  )

  if (!tokenResult.valid) {
    const statusMap = {
      TOKEN_EXPIRED: 410,
      TOKEN_ALREADY_USED: 409,
      TOKEN_INVALID: 400,
    } as const
    return c.json(err(tokenResult.code, tokenResult.message), statusMap[tokenResult.code])
  }

  const { uid: clientAuthId, name: clientName } = tokenResult.payload

  // ── Step 2: Idempotency — prevent double-scan of same token ──────────────────
  const idempotencyKey = await hashToken(body.token)
  const db = createSupabaseClient(c.env, 'service')

  const existingVisit = await db.getOne('visits', {
    filters: [{ column: 'idempotency_key', operator: 'eq', value: idempotencyKey }],
  })

  if (existingVisit) {
    return c.json(
      ok({ visit: existingVisit, rewardUnlocked: existingVisit.reward_unlocked, alreadyRegistered: true }),
      200
    )
  }

  // ── Step 3: Look up client profile ────────────────────────────────────────────
  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: clientAuthId }],
  })

  if (!client) {
    return c.json(
      err('NOT_FOUND', 'Consumer profile not found. Client must register first.'),
      404
    )
  }

  // ── Step 4: Look up or create loyalty relationship for this business ──────────
  let loyalty = await db.getOne('client_business_loyalty', {
    filters: [
      { column: 'client_id', operator: 'eq', value: client.id },
      { column: 'business_id', operator: 'eq', value: businessId },
    ],
  })

  const isFirstVisit = !loyalty || loyalty.total_visits === 0

  if (!loyalty) {
    const [created] = await db.post('client_business_loyalty', {
      client_id: client.id,
      business_id: businessId,
      stamp_count: 0,
      total_visits: 0,
      total_rewards: 0,
      status: 'active',
    })
    loyalty = created!
  }

  // ── Step 5: Get loyalty config (stamps required, reward description) ───────────
  const loyaltyConfig = await db.getOne('loyalty_configs', {
    filters: [
      { column: 'business_id', operator: 'eq', value: businessId },
      { column: 'is_active', operator: 'eq', value: true },
    ],
  })

  const stampsRequired = loyaltyConfig?.stamps_required ?? 10
  const newStampCount = loyalty.stamp_count + 1
  const rewardUnlocked = newStampCount >= stampsRequired
  const stampCountAfterReset = rewardUnlocked ? newStampCount - stampsRequired : newStampCount

  // ── Step 6: Insert visit record ───────────────────────────────────────────────
  let visit
  try {
    const [created] = await db.post('visits', {
      client_id: client.id,
      business_id: businessId,
      staff_id: `staff:${businessId}`,
      token_hash: idempotencyKey,
      reward_unlocked: rewardUnlocked,
      notes: body.notes ?? null,
      idempotency_key: idempotencyKey,
    })
    visit = created!
  } catch (error) {
    if (error instanceof SupabaseError && error.pgCode === '23505') {
      const existing = await db.getOne('visits', {
        filters: [{ column: 'idempotency_key', operator: 'eq', value: idempotencyKey }],
      })
      return c.json(
        ok({ visit: existing, rewardUnlocked: existing!.reward_unlocked, alreadyRegistered: true }),
        200
      )
    }
    throw error
  }

  // ── Step 7: Update loyalty counters ───────────────────────────────────────────
  const now = new Date().toISOString()

  await db.patch(
    'client_business_loyalty',
    {
      stamp_count: stampCountAfterReset,
      total_visits: loyalty.total_visits + 1,
      total_rewards: rewardUnlocked ? loyalty.total_rewards + 1 : loyalty.total_rewards,
      last_visit_at: now,
      status: 'active',
    },
    [
      { column: 'client_id', operator: 'eq', value: client.id },
      { column: 'business_id', operator: 'eq', value: businessId },
    ]
  )

  // ── Step 8: Referral bonus — credit referrer on referred user's first visit ───
  // When a referred consumer visits this business for the first time, the referrer
  // receives one bonus stamp on their loyalty card for the same business.
  let referralBonusGranted = false
  if (isFirstVisit && client.referred_by_client_id) {
    const referrerLoyalty = await db.getOne('client_business_loyalty', {
      filters: [
        { column: 'client_id', operator: 'eq', value: client.referred_by_client_id },
        { column: 'business_id', operator: 'eq', value: businessId },
      ],
    })

    if (referrerLoyalty) {
      const refNewCount = referrerLoyalty.stamp_count + 1
      const refRewardUnlocked = refNewCount >= stampsRequired
      await db.patch(
        'client_business_loyalty',
        {
          stamp_count: refRewardUnlocked ? refNewCount - stampsRequired : refNewCount,
          total_rewards: refRewardUnlocked
            ? referrerLoyalty.total_rewards + 1
            : referrerLoyalty.total_rewards,
        },
        [
          { column: 'client_id', operator: 'eq', value: client.referred_by_client_id },
          { column: 'business_id', operator: 'eq', value: businessId },
        ]
      )
      referralBonusGranted = true
    }
  }

  // ── Step 9: Create reward record if stamp threshold reached ───────────────────
  let reward = null
  if (rewardUnlocked) {
    const [createdReward] = await db.post('rewards', {
      client_id: client.id,
      business_id: businessId,
      visit_id: visit.id,
      description: loyaltyConfig?.reward_description ?? 'Free service',
      redeemed: false,
    })
    reward = createdReward
  }

  // ── Step 10: Blacklist the token (one-time use enforcement) ───────────────────
  await invalidateToken(body.token, c.env.TOKEN_BLACKLIST, ttl)

  // ── Step 11: Bust analytics cache for this business ───────────────────────────
  await Promise.all([
    c.env.ANALYTICS_CACHE.delete(`stats:summary:${businessId}`),
    c.env.ANALYTICS_CACHE.delete(`assistant:analyze:${businessId}`),
  ]).catch(console.error)

  return c.json(
    ok({
      visit: {
        id: visit.id,
        clientId: client.id,
        clientName,
        businessId,
        createdAt: visit.created_at,
      },
      stamps: {
        previous: loyalty.stamp_count,
        added: 1,
        current: stampCountAfterReset,
        required: stampsRequired,
        remaining: Math.max(0, stampsRequired - stampCountAfterReset),
      },
      rewardUnlocked,
      reward: reward ? { id: reward.id, description: reward.description } : null,
      referralBonusGranted,
    }),
    201
  )
})
