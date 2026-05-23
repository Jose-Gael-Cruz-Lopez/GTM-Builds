# Agent Prompt — 06: Clients API

## Context

You are building the **NexoLeal Cloudflare Workers backend** — Wave 2D. Your job is to implement all client management endpoints. This runs in parallel with Auth, Token Engine, and Businesses agents.

Wave 1 has already created the project scaffold, Supabase client, and all types. Read:
- `src/types/env.ts` — Env bindings
- `src/types/api.ts` — `ok()`, `err()`, `parsePagination()`, `PaginatedResponse`
- `src/types/db.ts` — `ClientRow`, `ClientInsert`, `ClientBusinessLoyaltyRow`
- `src/lib/supabase.ts` — `createSupabaseClient()`, `mapSupabaseError()`

The `requireClient()` and `requireAdmin()` middleware are being built by the Auth agent (also Wave 2). Import and use them.

---

## Business Logic: Client Status

A client's relationship with a specific business has one of three statuses, computed from `last_visit_at`:

| Status | Condition | Meaning |
|--------|-----------|---------|
| `active` | Last visit within 30 days | Healthy, returning customer |
| `at_risk` | Last visit 31–60 days ago | Hasn't returned recently |
| `lost` | Last visit 60+ days ago OR never visited | Churned |

The `status` column in `client_business_loyalty` is updated every time a visit is registered (by the Visits agent). For the analytics endpoints, compute counts dynamically.

---

## Endpoints to Implement

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/clients` | Client JWT | Register/link client profile |
| GET | `/clients/me` | Client JWT | Get own profile |
| GET | `/clients/me/loyalty/:businessId` | Client JWT | Get stamp progress at a business |
| GET | `/clients/me/loyalty` | Client JWT | Get all loyalty relationships |
| GET | `/businesses/:businessId/clients` | Admin | Paginated client list |
| GET | `/businesses/:businessId/clients/at-risk` | Admin | At-risk + lost clients |

---

## Step 1 — `src/routes/clients.ts`

Create `/backend/src/routes/clients.ts`:

```typescript
import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err, parsePagination } from '../types/api'
import { requireClient, requireAdmin } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { createSupabaseClient, mapSupabaseError, SupabaseError } from '../lib/supabase'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const clientRoutes = new Hono<HonoEnv>()

// ─── POST /clients ────────────────────────────────────────────────────────────
// Register or update the client's profile. Called after Supabase sign-up.
// Idempotent: if a client with this auth_id already exists, returns the existing record.
// Also creates the client_business_loyalty link if businessId is provided.

clientRoutes.post('/', requireClient(), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    fullName: string
    phone?: string
    email?: string
    businessId?: string    // optionally link to a business on registration
  }>().catch(() => null)

  if (!body?.fullName?.trim()) {
    return c.json(err('VALIDATION_ERROR', 'fullName is required'), 400)
  }

  const db = createSupabaseClient(c.env, 'service')

  try {
    // Check if client already exists
    const existing = await db.getOne('clients', {
      filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
    })

    let client = existing

    if (!client) {
      const [created] = await db.post('clients', {
        auth_id: userId,
        full_name: body.fullName.trim(),
        phone: body.phone ?? null,
        email: body.email ?? null,
      })
      client = created!
    } else {
      // Update profile if fields changed
      const updates: Record<string, unknown> = {}
      if (body.fullName && body.fullName.trim() !== client.full_name) updates.full_name = body.fullName.trim()
      if (body.phone !== undefined && body.phone !== client.phone) updates.phone = body.phone
      if (body.email !== undefined && body.email !== client.email) updates.email = body.email

      if (Object.keys(updates).length > 0) {
        const [updated] = await db.patch('clients', updates, [
          { column: 'auth_id', operator: 'eq', value: userId },
        ])
        client = updated ?? client
      }
    }

    // Create loyalty link if businessId provided
    let loyaltyLink = null
    if (body.businessId) {
      const existingLink = await db.getOne('client_business_loyalty', {
        filters: [
          { column: 'client_id', operator: 'eq', value: client.id },
          { column: 'business_id', operator: 'eq', value: body.businessId },
        ],
      })

      if (!existingLink) {
        const [link] = await db.post('client_business_loyalty', {
          client_id: client.id,
          business_id: body.businessId,
          stamp_count: 0,
          total_visits: 0,
          total_rewards: 0,
          status: 'active',
        })
        loyaltyLink = link
      } else {
        loyaltyLink = existingLink
      }
    }

    return c.json(ok({ client, loyaltyLink }), existing ? 200 : 201)
  } catch (error) {
    if (error instanceof SupabaseError) {
      const mapped = mapSupabaseError(error)
      return c.json(err(mapped.code, mapped.message), mapped.status)
    }
    throw error
  }
})

// ─── GET /clients/me ──────────────────────────────────────────────────────────
// Get the authenticated client's own profile.

clientRoutes.get('/me', requireClient(), async (c) => {
  const userId = c.get('userId')
  const db = createSupabaseClient(c.env, 'service')

  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
  })

  if (!client) {
    return c.json(err('NOT_FOUND', 'Client profile not found. Call POST /clients first.'), 404)
  }

  return c.json(ok({ client }), 200)
})

// ─── GET /clients/me/loyalty/:businessId ──────────────────────────────────────
// Get stamp progress and loyalty status for a specific business.
// Also returns the business's loyalty config (stamps needed, reward description).

clientRoutes.get('/me/loyalty/:businessId', requireClient(), async (c) => {
  const userId = c.get('userId')
  const businessId = c.req.param('businessId')
  const db = createSupabaseClient(c.env, 'service')

  // Find the client record
  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
  })

  if (!client) {
    return c.json(err('NOT_FOUND', 'Client profile not found'), 404)
  }

  // Get loyalty relationship
  const loyalty = await db.getOne('client_business_loyalty', {
    filters: [
      { column: 'client_id', operator: 'eq', value: client.id },
      { column: 'business_id', operator: 'eq', value: businessId },
    ],
  })

  // Get loyalty config for this business
  const [config, business] = await Promise.all([
    db.getOne('loyalty_configs', {
      filters: [
        { column: 'business_id', operator: 'eq', value: businessId },
        { column: 'is_active', operator: 'eq', value: true },
      ],
    }),
    db.getOne('businesses', {
      filters: [{ column: 'id', operator: 'eq', value: businessId }],
    }),
  ])

  if (!business) {
    return c.json(err('NOT_FOUND', 'Business not found'), 404)
  }

  // If no loyalty link exists yet, create it
  let activeLoyalty = loyalty
  if (!activeLoyalty) {
    const [created] = await db.post('client_business_loyalty', {
      client_id: client.id,
      business_id: businessId,
      stamp_count: 0,
      total_visits: 0,
      total_rewards: 0,
      status: 'active',
    })
    activeLoyalty = created!
  }

  const stampsRequired = config?.stamps_required ?? 10
  const stampsRemaining = Math.max(0, stampsRequired - activeLoyalty.stamp_count)
  const progressPercent = Math.min(100, Math.round((activeLoyalty.stamp_count / stampsRequired) * 100))

  return c.json(
    ok({
      client: { id: client.id, fullName: client.full_name },
      business: { id: business.id, name: business.name, category: business.category },
      loyalty: {
        stampCount: activeLoyalty.stamp_count,
        stampsRequired,
        stampsRemaining,
        progressPercent,
        rewardDescription: config?.reward_description ?? 'Free service',
        totalVisits: activeLoyalty.total_visits,
        totalRewards: activeLoyalty.total_rewards,
        lastVisitAt: activeLoyalty.last_visit_at,
        status: activeLoyalty.status,
      },
    }),
    200
  )
})

// ─── GET /clients/me/loyalty ──────────────────────────────────────────────────
// Get all loyalty relationships for the authenticated client.
// Useful for a "my cards" screen showing all businesses the client has visited.

clientRoutes.get('/me/loyalty', requireClient(), async (c) => {
  const userId = c.get('userId')
  const db = createSupabaseClient(c.env, 'service')

  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
  })

  if (!client) {
    return c.json(err('NOT_FOUND', 'Client profile not found'), 404)
  }

  const loyalties = await db.get('client_business_loyalty', {
    filters: [{ column: 'client_id', operator: 'eq', value: client.id }],
    order: 'last_visit_at.desc.nullslast',
  })

  // Fetch business info for each loyalty record in parallel
  const businessIds = [...new Set(loyalties.map((l) => l.business_id))]
  const [businesses, configs] = await Promise.all([
    Promise.all(
      businessIds.map((bid) =>
        db.getOne('businesses', { filters: [{ column: 'id', operator: 'eq', value: bid }] })
      )
    ),
    Promise.all(
      businessIds.map((bid) =>
        db.getOne('loyalty_configs', {
          filters: [
            { column: 'business_id', operator: 'eq', value: bid },
            { column: 'is_active', operator: 'eq', value: true },
          ],
        })
      )
    ),
  ])

  const businessMap = Object.fromEntries(
    businessIds.map((bid, i) => [bid, businesses[i]])
  )
  const configMap = Object.fromEntries(
    businessIds.map((bid, i) => [bid, configs[i]])
  )

  const cards = loyalties.map((loyalty) => {
    const business = businessMap[loyalty.business_id]
    const config = configMap[loyalty.business_id]
    const stampsRequired = config?.stamps_required ?? 10
    return {
      businessId: loyalty.business_id,
      businessName: business?.name ?? 'Unknown',
      businessCategory: business?.category ?? 'other',
      stampCount: loyalty.stamp_count,
      stampsRequired,
      progressPercent: Math.min(100, Math.round((loyalty.stamp_count / stampsRequired) * 100)),
      rewardDescription: config?.reward_description ?? 'Free service',
      totalVisits: loyalty.total_visits,
      lastVisitAt: loyalty.last_visit_at,
      status: loyalty.status,
    }
  })

  return c.json(ok({ cards }), 200)
})

// ─── GET /businesses/:businessId/clients ──────────────────────────────────────
// Admin endpoint: paginated list of all clients for a business.
// Supports filtering by status: ?status=active|at_risk|lost

clientRoutes.get(
  '/businesses-clients',
  requireAdmin(),
  rateLimit({ keyPrefix: 'clients-list' }),
  async (c) => {
    // Note: this route is mounted at /businesses/:businessId/clients via the businessId param
    // The route param is accessed from the URL
    const businessId = c.req.param('businessId') ?? c.req.query('businessId')
    if (!businessId) return c.json(err('VALIDATION_ERROR', 'businessId required'), 400)

    const url = new URL(c.req.url)
    const { page, limit, offset } = parsePagination(url)
    const statusFilter = url.searchParams.get('status') as 'active' | 'at_risk' | 'lost' | null

    const db = createSupabaseClient(c.env, 'service')

    const filters: Parameters<typeof db.get>[1]['filters'] = [
      { column: 'business_id', operator: 'eq', value: businessId },
    ]

    if (statusFilter) {
      filters.push({ column: 'status', operator: 'eq', value: statusFilter })
    }

    const [loyalties, all] = await Promise.all([
      db.get('client_business_loyalty', {
        filters,
        order: 'last_visit_at.desc.nullslast',
        limit,
        offset,
      }),
      db.get('client_business_loyalty', { filters }),
    ])

    // Hydrate with client profile data
    const clientIds = loyalties.map((l) => l.client_id)
    const clients = clientIds.length > 0
      ? await Promise.all(
          clientIds.map((cid) =>
            db.getOne('clients', { filters: [{ column: 'id', operator: 'eq', value: cid }] })
          )
        )
      : []

    const clientMap = Object.fromEntries(
      clientIds.map((cid, i) => [cid, clients[i]])
    )

    const items = loyalties.map((loyalty) => {
      const clientProfile = clientMap[loyalty.client_id]
      return {
        clientId: loyalty.client_id,
        fullName: clientProfile?.full_name ?? 'Unknown',
        phone: clientProfile?.phone ?? null,
        email: clientProfile?.email ?? null,
        stampCount: loyalty.stamp_count,
        totalVisits: loyalty.total_visits,
        totalRewards: loyalty.total_rewards,
        lastVisitAt: loyalty.last_visit_at,
        status: loyalty.status,
        joinedAt: loyalty.created_at,
      }
    })

    return c.json(
      ok({
        items,
        total: all.length,
        page,
        limit,
        hasNextPage: offset + limit < all.length,
      }),
      200
    )
  }
)

// ─── GET /businesses/:businessId/clients/at-risk ──────────────────────────────
// Returns at-risk + lost clients for a business — pre-filtered for campaign targeting.

clientRoutes.get('/at-risk', requireAdmin(), async (c) => {
  const businessId = c.req.param('businessId') ?? c.req.query('businessId')
  if (!businessId) return c.json(err('VALIDATION_ERROR', 'businessId required'), 400)

  const db = createSupabaseClient(c.env, 'service')

  const atRiskLoyalties = await db.get('client_business_loyalty', {
    filters: [
      { column: 'business_id', operator: 'eq', value: businessId },
      { column: 'status', operator: 'in', value: '(at_risk,lost)' as unknown as string },
    ],
    order: 'last_visit_at.asc.nullslast',
  })

  const clientIds = atRiskLoyalties.map((l) => l.client_id)
  const clients = clientIds.length > 0
    ? await Promise.all(
        clientIds.map((cid) =>
          db.getOne('clients', { filters: [{ column: 'id', operator: 'eq', value: cid }] })
        )
      )
    : []

  const clientMap = Object.fromEntries(clientIds.map((cid, i) => [cid, clients[i]]))

  const result = atRiskLoyalties.map((loyalty) => {
    const profile = clientMap[loyalty.client_id]
    const daysSinceVisit = loyalty.last_visit_at
      ? Math.floor((Date.now() - new Date(loyalty.last_visit_at).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      clientId: loyalty.client_id,
      fullName: profile?.full_name ?? 'Unknown',
      phone: profile?.phone ?? null,
      email: profile?.email ?? null,
      status: loyalty.status,
      lastVisitAt: loyalty.last_visit_at,
      daysSinceVisit,
      totalVisits: loyalty.total_visits,
    }
  })

  return c.json(ok({ atRiskClients: result, count: result.length }), 200)
})
```

---

## Step 2 — Register Routes in `src/index.ts`

The client routes are designed to work both standalone and nested under `/businesses/:businessId`. Mount them in `src/index.ts`:

```typescript
import { clientRoutes } from './routes/clients'
// ...
app.route('/clients', clientRoutes)

// The at-risk and paginated client list endpoints use businessId from the URL.
// Mount a second time under /businesses for nested access:
app.get('/businesses/:businessId/clients', requireAdmin(), /* handler from clientRoutes */)
app.get('/businesses/:businessId/clients/at-risk', requireAdmin(), /* handler from clientRoutes */)
```

**Implementation note**: The cleanest approach is to mount the route file at `/clients` for `/me` routes, and create a separate thin wrapper in `businesses.ts` for admin client-list routes that delegates to the same service functions. You can also extract the database query logic into a `src/lib/clientService.ts` helper that both route files call.

---

## Step 3 — Verify

```bash
cd /backend
npx tsc --noEmit
```

Zero TypeScript errors required.
