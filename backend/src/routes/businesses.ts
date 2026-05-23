import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireAdmin, requireAnyAuth } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { createSupabaseClient, mapSupabaseError, SupabaseError } from '../lib/supabase'
import type { BusinessInsert, BusinessCategory } from '../types/db'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const businessRoutes = new Hono<HonoEnv>()

// ─── POST /businesses ─────────────────────────────────────────────────────────
// Onboard a new business. The authenticated user becomes the owner.
// Also creates the default loyalty config in the same operation.

businessRoutes.post('/', requireAnyAuth(), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    name: string
    category: BusinessCategory
    plan?: 'free' | 'pro'
    stampsRequired?: number
    rewardDescription?: string
  }>().catch(() => null)

  if (!body?.name || !body?.category) {
    return c.json(err('VALIDATION_ERROR', 'name and category are required'), 400)
  }

  const validCategories: BusinessCategory[] = ['barbershop', 'salon', 'vet', 'cafe', 'gym', 'other']
  if (!validCategories.includes(body.category)) {
    return c.json(
      err('VALIDATION_ERROR', `category must be one of: ${validCategories.join(', ')}`),
      400
    )
  }

  const db = createSupabaseClient(c.env, 'service')

  try {
    // Create business
    const [business] = await db.post('businesses', {
      name: body.name,
      category: body.category,
      owner_id: userId,
      is_active: true,
      plan: body.plan ?? 'free',
    } satisfies BusinessInsert)

    if (!business) throw new Error('Business creation returned no rows')

    // Create default loyalty config
    const [loyaltyConfig] = await db.post('loyalty_configs', {
      business_id: business.id,
      stamps_required: body.stampsRequired ?? 10,
      reward_description: body.rewardDescription ?? 'Free service',
      is_active: true,
    })

    return c.json(ok({ business, loyaltyConfig }), 201)
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── GET /businesses/:id ──────────────────────────────────────────────────────
// Get a business profile. Publicly accessible to any authenticated user
// (clients need this to display the business name on their loyalty card).

businessRoutes.get('/:id', requireAnyAuth(), async (c) => {
  const id = c.req.param('id')
  const db = createSupabaseClient(c.env, 'anon')

  const business = await db.getOne('businesses', {
    filters: [
      { column: 'id', operator: 'eq', value: id },
      { column: 'is_active', operator: 'eq', value: true },
    ],
  })

  if (!business) {
    return c.json(err('NOT_FOUND', 'Business not found'), 404)
  }

  return c.json(ok({ business }), 200)
})

// ─── PATCH /businesses/:id ────────────────────────────────────────────────────
// Update business settings. Requires admin auth (owner must match).

businessRoutes.patch('/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    isActive?: boolean
    plan?: 'free' | 'pro'
  }>().catch(() => null)

  if (!body || Object.keys(body).length === 0) {
    return c.json(err('VALIDATION_ERROR', 'At least one field to update is required'), 400)
  }

  const db = createSupabaseClient(c.env, 'service')
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.isActive !== undefined) updates.is_active = body.isActive
  if (body.plan !== undefined) updates.plan = body.plan

  try {
    const [updated] = await db.patch('businesses', updates, [
      { column: 'id', operator: 'eq', value: id },
    ])

    if (!updated) {
      return c.json(err('NOT_FOUND', 'Business not found'), 404)
    }

    return c.json(ok({ business: updated }), 200)
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── GET /businesses/:id/loyalty-config ───────────────────────────────────────
// Get the loyalty program rules for a business.

businessRoutes.get('/:id/loyalty-config', requireAnyAuth(), async (c) => {
  const businessId = c.req.param('id')
  const db = createSupabaseClient(c.env, 'anon')

  const config = await db.getOne('loyalty_configs', {
    filters: [
      { column: 'business_id', operator: 'eq', value: businessId },
      { column: 'is_active', operator: 'eq', value: true },
    ],
  })

  if (!config) {
    return c.json(err('NOT_FOUND', 'Loyalty config not found for this business'), 404)
  }

  return c.json(ok({ loyaltyConfig: config }), 200)
})

// ─── PATCH /businesses/:id/loyalty-config ────────────────────────────────────
// Update loyalty program rules. Requires admin auth.

businessRoutes.patch('/:id/loyalty-config', requireAdmin(), async (c) => {
  const businessId = c.req.param('id')
  const body = await c.req.json<{
    stampsRequired?: number
    rewardDescription?: string
    isActive?: boolean
  }>().catch(() => null)

  if (!body || Object.keys(body).length === 0) {
    return c.json(err('VALIDATION_ERROR', 'At least one field to update is required'), 400)
  }

  if (body.stampsRequired !== undefined && (body.stampsRequired < 1 || body.stampsRequired > 100)) {
    return c.json(err('VALIDATION_ERROR', 'stampsRequired must be between 1 and 100'), 400)
  }

  const db = createSupabaseClient(c.env, 'service')
  const updates: Record<string, unknown> = {}
  if (body.stampsRequired !== undefined) updates.stamps_required = body.stampsRequired
  if (body.rewardDescription !== undefined) updates.reward_description = body.rewardDescription
  if (body.isActive !== undefined) updates.is_active = body.isActive

  try {
    const [updated] = await db.patch('loyalty_configs', updates, [
      { column: 'business_id', operator: 'eq', value: businessId },
    ])

    if (!updated) {
      return c.json(err('NOT_FOUND', 'Loyalty config not found'), 404)
    }

    return c.json(ok({ loyaltyConfig: updated }), 200)
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── POST /businesses/:id/staff-keys ─────────────────────────────────────────
// Generate a new staff API key for a device. Returns the raw key ONCE —
// it is never stored in plaintext. Only the SHA-256 hash is persisted.

businessRoutes.post('/:id/staff-keys', requireAdmin(), async (c) => {
  const businessId = c.req.param('id')
  const body = await c.req.json<{ label: string }>().catch(() => null)

  if (!body?.label?.trim()) {
    return c.json(err('VALIDATION_ERROR', 'label is required (e.g. "Front desk iPad")'), 400)
  }

  // Generate a cryptographically random 32-byte key
  const rawKeyBytes = new Uint8Array(32)
  crypto.getRandomValues(rawKeyBytes)
  const rawKey = `sk_staff_${Array.from(rawKeyBytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`

  // Hash it for storage
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const db = createSupabaseClient(c.env, 'service')

  try {
    const [staffKey] = await db.post('staff_keys', {
      business_id: businessId,
      key_hash: keyHash,
      label: body.label.trim(),
      is_active: true,
    })

    return c.json(
      ok({
        id: staffKey!.id,
        label: staffKey!.label,
        // Raw key returned ONLY once. Client must store it securely.
        rawKey,
        // Staff must use format: "<businessId>:<rawKey>" in X-Staff-Key header
        headerValue: `${businessId}:${rawKey}`,
        createdAt: staffKey!.created_at,
      }),
      201
    )
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── GET /businesses/:id/staff-keys ──────────────────────────────────────────
// List all staff keys for a business (without exposing key hashes).

businessRoutes.get('/:id/staff-keys', requireAdmin(), async (c) => {
  const businessId = c.req.param('id')
  const db = createSupabaseClient(c.env, 'service')

  const keys = await db.get('staff_keys', {
    select: 'id,label,is_active,last_used_at,created_at',
    filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
    order: 'created_at.desc',
  })

  return c.json(ok({ staffKeys: keys }), 200)
})

// ─── DELETE /businesses/:id/staff-keys/:keyId ─────────────────────────────────
// Deactivate (soft-delete) a staff key.

businessRoutes.delete('/:id/staff-keys/:keyId', requireAdmin(), async (c) => {
  const keyId = c.req.param('keyId')
  const businessId = c.req.param('id')
  const db = createSupabaseClient(c.env, 'service')

  try {
    const [updated] = await db.patch(
      'staff_keys',
      { is_active: false },
      [
        { column: 'id', operator: 'eq', value: keyId },
        { column: 'business_id', operator: 'eq', value: businessId },
      ]
    )

    if (!updated) {
      return c.json(err('NOT_FOUND', 'Staff key not found'), 404)
    }

    return c.json(ok({ deactivated: true, keyId }), 200)
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── GET /businesses/:id/stats/summary ───────────────────────────────────────
// Top-level dashboard numbers. Cached in KV for 5 minutes to avoid
// hammering Supabase on every dashboard load.

businessRoutes.get('/:id/stats/summary', requireAdmin(), rateLimit({ keyPrefix: 'stats' }), async (c) => {
  const businessId = c.req.param('id')
  const cacheKey = `stats:summary:${businessId}`

  // Try KV cache first
  const cached = await c.env.ANALYTICS_CACHE.get(cacheKey, 'json') as Record<string, unknown> | null
  if (cached) {
    return c.json(ok({ ...cached, cached: true }), 200)
  }

  const db = createSupabaseClient(c.env, 'service')
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Run queries in parallel
  const [allClients, todayVisits, activeCampaigns] = await Promise.all([
    db.get('client_business_loyalty', {
      filters: [{ column: 'business_id', operator: 'eq', value: businessId }],
    }),
    db.get('visits', {
      filters: [
        { column: 'business_id', operator: 'eq', value: businessId },
        { column: 'created_at', operator: 'gte', value: todayStart.toISOString() },
      ],
    }),
    db.get('campaigns', {
      filters: [
        { column: 'business_id', operator: 'eq', value: businessId },
        { column: 'status', operator: 'eq', value: 'active' },
      ],
    }),
  ])

  const atRiskCount = allClients.filter((c) => c.status === 'at_risk').length
  const lostCount = allClients.filter((c) => c.status === 'lost').length

  const summary = {
    totalClients: allClients.length,
    activeClients: allClients.filter((c) => c.status === 'active').length,
    atRiskClients: atRiskCount,
    lostClients: lostCount,
    visitsToday: todayVisits.length,
    activeCampaigns: activeCampaigns.length,
    generatedAt: new Date().toISOString(),
  }

  // Cache for 5 minutes
  await c.env.ANALYTICS_CACHE.put(cacheKey, JSON.stringify(summary), { expirationTtl: 300 })

  return c.json(ok(summary), 200)
})
