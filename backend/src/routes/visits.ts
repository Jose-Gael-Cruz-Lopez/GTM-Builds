import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireStaff, requireAdmin, requireAnyAuth } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { validateToken, invalidateToken, hashToken } from '../lib/tokenEngine'
import { createSupabaseClient, mapSupabaseError, SupabaseError } from '../lib/supabase'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const visitRoutes = new Hono<HonoEnv>()

// ─── POST /visits ─────────────────────────────────────────────────────────────
// Core visit registration. Staff-authenticated.
// Validates the client's QR token and registers the visit.

visitRoutes.post('/', requireStaff(), async (c) => {
  const staffBusinessId = c.get('businessId')

  const body = await c.req.json<{
    token: string
    notes?: string
  }>().catch(() => null)

  if (!body?.token) {
    return c.json(err('VALIDATION_ERROR', 'token is required'), 400)
  }

  const ttl = parseInt(c.env.TOKEN_TTL_SECONDS, 10)
  const db = createSupabaseClient(c.env, 'service')

  // ── Step 1: Validate token ──────────────────────────────────────────────────
  const tokenResult = await validateToken(body.token, c.env.TOKEN_SECRET, ttl, c.env.TOKEN_BLACKLIST)

  if (!tokenResult.valid) {
    const statusMap = {
      TOKEN_EXPIRED: 410,
      TOKEN_ALREADY_USED: 409,
      TOKEN_INVALID: 400,
    } as const
    return c.json(err(tokenResult.code, tokenResult.message), statusMap[tokenResult.code])
  }

  const { uid: clientAuthId, bid: tokenBusinessId } = tokenResult.payload

  // ── Step 2: Cross-business fraud check ────────────────────────────────────
  // Ensure the token was generated for THIS business, not another one.
  if (tokenBusinessId !== staffBusinessId) {
    return c.json(
      err('TOKEN_INVALID', 'Token was not generated for this business'),
      400
    )
  }

  // ── Step 3: Idempotency check ─────────────────────────────────────────────
  const idempotencyKey = await hashToken(body.token)

  const existingVisit = await db.getOne('visits', {
    filters: [{ column: 'idempotency_key', operator: 'eq', value: idempotencyKey }],
  })

  if (existingVisit) {
    // Already registered (network retry scenario) — return the existing visit
    return c.json(
      ok({
        visit: existingVisit,
        rewardUnlocked: existingVisit.reward_unlocked,
        alreadyRegistered: true,
      }),
      200
    )
  }

  // ── Step 4: Look up client ────────────────────────────────────────────────
  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: clientAuthId }],
  })

  if (!client) {
    return c.json(err('NOT_FOUND', 'Client profile not found. Client must register first.'), 404)
  }

  // ── Step 5: Look up or create loyalty relationship ────────────────────────
  let loyalty = await db.getOne('client_business_loyalty', {
    filters: [
      { column: 'client_id', operator: 'eq', value: client.id },
      { column: 'business_id', operator: 'eq', value: staffBusinessId },
    ],
  })

  if (!loyalty) {
    const [created] = await db.post('client_business_loyalty', {
      client_id: client.id,
      business_id: staffBusinessId,
      stamp_count: 0,
      total_visits: 0,
      total_rewards: 0,
      status: 'active',
    })
    loyalty = created!
  }

  // ── Step 6: Get loyalty config ────────────────────────────────────────────
  const loyaltyConfig = await db.getOne('loyalty_configs', {
    filters: [
      { column: 'business_id', operator: 'eq', value: staffBusinessId },
      { column: 'is_active', operator: 'eq', value: true },
    ],
  })

  const stampsRequired = loyaltyConfig?.stamps_required ?? 10
  const newStampCount = loyalty.stamp_count + 1
  const rewardUnlocked = newStampCount >= stampsRequired
  const stampCountAfterReset = rewardUnlocked ? newStampCount - stampsRequired : newStampCount

  // ── Step 7: Insert visit record ───────────────────────────────────────────
  let visit
  try {
    const [created] = await db.post('visits', {
      client_id: client.id,
      business_id: staffBusinessId,
      staff_id: `staff:${staffBusinessId}`, // Generic staff identifier
      token_hash: idempotencyKey,
      reward_unlocked: rewardUnlocked,
      notes: body.notes ?? null,
      idempotency_key: idempotencyKey,
    })
    visit = created!
  } catch (error) {
    if (error instanceof SupabaseError && error.pgCode === '23505') {
      // Race condition: another request inserted the same token simultaneously
      const existing = await db.getOne('visits', {
        filters: [{ column: 'idempotency_key', operator: 'eq', value: idempotencyKey }],
      })
      return c.json(ok({ visit: existing, rewardUnlocked: existing!.reward_unlocked, alreadyRegistered: true }), 200)
    }
    throw error
  }

  // ── Step 8: Update loyalty counters ───────────────────────────────────────
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
      { column: 'business_id', operator: 'eq', value: staffBusinessId },
    ]
  )

  // ── Step 9: Create reward if unlocked ─────────────────────────────────────
  let reward = null
  if (rewardUnlocked) {
    const [createdReward] = await db.post('rewards', {
      client_id: client.id,
      business_id: staffBusinessId,
      visit_id: visit.id,
      description: loyaltyConfig?.reward_description ?? 'Free service',
      redeemed: false,
    })
    reward = createdReward
  }

  // ── Step 10: Invalidate token (prevent reuse) ──────────────────────────────
  await invalidateToken(body.token, c.env.TOKEN_BLACKLIST, ttl)

  // ── Step 11: Invalidate analytics cache for this business ─────────────────
  await c.env.ANALYTICS_CACHE.delete(`stats:summary:${staffBusinessId}`).catch(console.error)

  return c.json(
    ok({
      visit: {
        id: visit.id,
        clientId: client.id,
        clientName: client.full_name,
        businessId: staffBusinessId,
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
      reward: reward
        ? {
            id: reward.id,
            description: reward.description,
          }
        : null,
    }),
    201
  )
})

// ─── GET /visits/business-visits ──────────────────────────────────────────────
// Admin view of all visits for a business. Supports date range filtering.
// Must be registered before /:visitId so "business-visits" is not parsed as a UUID.

visitRoutes.get('/business-visits', requireAdmin(), rateLimit({ keyPrefix: 'visits-list' }), async (c) => {
  const businessId = c.req.param('businessId') ?? c.req.query('businessId')
  if (!businessId) return c.json(err('VALIDATION_ERROR', 'businessId required'), 400)

  const url = new URL(c.req.url)
  const from = url.searchParams.get('from') // ISO date string
  const to = url.searchParams.get('to')     // ISO date string
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '50', 10))
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)

  const db = createSupabaseClient(c.env, 'service')

  const filters: NonNullable<Parameters<typeof db.get>[1]>['filters'] = [
    { column: 'business_id', operator: 'eq', value: businessId },
  ]

  if (from) filters.push({ column: 'created_at', operator: 'gte', value: from })
  if (to) filters.push({ column: 'created_at', operator: 'lte', value: to })

  const visits = await db.get('visits', {
    filters,
    order: 'created_at.desc',
    limit,
    offset,
  })

  return c.json(ok({ visits, count: visits.length }), 200)
})

// ─── GET /visits/:visitId ─────────────────────────────────────────────────────
// Get a single visit by ID. Accessible by the client who made the visit or admin.

visitRoutes.get('/:visitId', requireAnyAuth(), async (c) => {
  const visitId = c.req.param('visitId')
  const userId = c.get('userId')
  const userRole = c.get('userRole')
  const db = createSupabaseClient(c.env, 'service')

  const visit = await db.getOne('visits', {
    filters: [{ column: 'id', operator: 'eq', value: visitId }],
  })

  if (!visit) {
    return c.json(err('NOT_FOUND', 'Visit not found'), 404)
  }

  // Clients can only see their own visits
  if (userRole === 'client') {
    const client = await db.getOne('clients', {
      filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
    })
    if (!client || client.id !== visit.client_id) {
      return c.json(err('AUTH_FORBIDDEN', 'You can only view your own visits'), 403)
    }
  }

  return c.json(ok({ visit }), 200)
})

// ─── GET /clients/me/visits ───────────────────────────────────────────────────
// Get visit history for the authenticated client.
// Optional query param: ?businessId=<uuid> to filter by business.

visitRoutes.get('/me/visits', requireAnyAuth(), async (c) => {
  const userId = c.get('userId')
  const url = new URL(c.req.url)
  const businessId = url.searchParams.get('businessId')
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20', 10))
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)

  const db = createSupabaseClient(c.env, 'service')

  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
  })

  if (!client) {
    return c.json(err('NOT_FOUND', 'Client profile not found'), 404)
  }

  const filters: NonNullable<Parameters<typeof db.get>[1]>['filters'] = [
    { column: 'client_id', operator: 'eq', value: client.id },
  ]

  if (businessId) {
    filters.push({ column: 'business_id', operator: 'eq', value: businessId })
  }

  const visits = await db.get('visits', {
    filters,
    order: 'created_at.desc',
    limit,
    offset,
  })

  return c.json(ok({ visits, count: visits.length }), 200)
})
