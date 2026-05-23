# Agent Prompt — 03: Auth Middleware

## Context

You are building the **NexoLeal Cloudflare Workers backend** — Wave 2A. Your job is to build the complete authentication and rate-limiting middleware layer. This runs in parallel with the Token Engine, Businesses, and Clients agents.

Wave 1 has already created:
- `src/types/env.ts` — Env bindings interface
- `src/types/api.ts` — `err()`, `ok()`, `ErrorCode`, `ContextVariables`
- `src/lib/supabase.ts` — Supabase client

---

## Auth Architecture

NexoLeal has three distinct auth paths:

| Path | Who uses it | Method | Header |
|------|-------------|--------|--------|
| **Client auth** | End customers | Supabase JWT | `Authorization: Bearer <jwt>` |
| **Staff auth** | Business employees | Hashed API key | `X-Staff-Key: <raw-key>` |
| **Admin auth** | Business owners | Supabase JWT + role claim | `Authorization: Bearer <jwt>` |

### JWT Validation Strategy

Supabase issues JWTs signed with HS256 using the project's JWT secret. In Cloudflare Workers, we validate the JWT manually using the Web Crypto API (no external JWT libraries needed).

The JWT secret is derived from `SUPABASE_SERVICE_KEY` — but actually Supabase exposes a dedicated JWT secret in the dashboard. In this implementation, validate by calling Supabase's `/auth/v1/user` endpoint with the token, which also returns the user object. This is simpler and always reflects the live auth state.

### Staff Key Strategy

Staff devices receive a raw API key (e.g. `sk_staff_abc123...`). The backend stores only the SHA-256 hash in the `staff_keys` table and in the `STAFF_API_KEY_HASH` env var (single global key for dev; per-business keys via `staff_keys` table for production).

Validation: SHA-256 hash the incoming key using Web Crypto, then compare to the stored hash.

---

## Step 1 — `src/middleware/auth.ts`

Create `/backend/src/middleware/auth.ts`:

```typescript
import type { MiddlewareHandler, Context } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { err } from '../types/api'
import { createSupabaseClient } from '../lib/supabase'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

// ─── Supabase JWT Validation ──────────────────────────────────────────────────
// Calls Supabase /auth/v1/user to validate the token and get user data.
// This validates the token against Supabase's live auth state.

async function validateSupabaseJWT(
  token: string,
  supabaseUrl: string,
  serviceKey: string
): Promise<{ id: string; email?: string; role?: string; user_metadata?: Record<string, unknown> } | null> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceKey,
      },
    })

    if (!response.ok) return null

    const user = await response.json() as {
      id: string
      email?: string
      role?: string
      user_metadata?: Record<string, unknown>
    }

    return user
  } catch {
    return null
  }
}

// ─── SHA-256 hash helper ──────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── requireClient ────────────────────────────────────────────────────────────
// Use on routes accessible only by authenticated end-customers.
// Sets c.var.userId and c.var.userRole = 'client'.

export function requireClient(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(err('AUTH_MISSING', 'Authorization header with Bearer token required'), 401)
    }

    const token = authHeader.slice(7)
    const user = await validateSupabaseJWT(token, c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

    if (!user) {
      return c.json(err('AUTH_INVALID', 'Invalid or expired token'), 401)
    }

    c.set('userId', user.id)
    c.set('userRole', 'client')
    await next()
  }
}

// ─── requireStaff ─────────────────────────────────────────────────────────────
// Use on routes accessible only by staff members (scanning QR codes).
// Validates X-Staff-Key header against SHA-256 hash.
// Sets c.var.businessId and c.var.userRole = 'staff'.
//
// The header format is: X-Staff-Key: <businessId>:<rawKey>
// This lets one Worker validate keys for multiple businesses.

export function requireStaff(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const staffKey = c.req.header('X-Staff-Key')
    if (!staffKey) {
      return c.json(err('AUTH_MISSING', 'X-Staff-Key header required'), 401)
    }

    // Format: "<businessId>:<rawKey>"
    const colonIndex = staffKey.indexOf(':')
    if (colonIndex === -1) {
      return c.json(err('AUTH_INVALID', 'Invalid X-Staff-Key format. Expected: <businessId>:<key>'), 401)
    }

    const businessId = staffKey.slice(0, colonIndex)
    const rawKey = staffKey.slice(colonIndex + 1)

    if (!businessId || !rawKey) {
      return c.json(err('AUTH_INVALID', 'Invalid X-Staff-Key format'), 401)
    }

    // Validate key against the database (service role to query staff_keys table)
    const db = createSupabaseClient(c.env, 'service')
    const keyHash = await sha256Hex(rawKey)

    const staffKeyRecord = await db.getOne('staff_keys', {
      filters: [
        { column: 'business_id', operator: 'eq', value: businessId },
        { column: 'key_hash', operator: 'eq', value: keyHash },
        { column: 'is_active', operator: 'eq', value: true },
      ],
    })

    if (!staffKeyRecord) {
      return c.json(err('AUTH_INVALID', 'Invalid staff key'), 401)
    }

    // Update last_used_at (fire and forget — don't block the request)
    db.patch(
      'staff_keys',
      { last_used_at: new Date().toISOString() },
      [{ column: 'id', operator: 'eq', value: staffKeyRecord.id }]
    ).catch(console.error)

    c.set('businessId', businessId)
    c.set('userRole', 'staff')
    await next()
  }
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Use on admin dashboard routes. Validates Supabase JWT and checks that the
// authenticated user is the owner of the requested business.
// Sets c.var.userId, c.var.businessId, c.var.userRole = 'admin'.

export function requireAdmin(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(err('AUTH_MISSING', 'Authorization header with Bearer token required'), 401)
    }

    const token = authHeader.slice(7)
    const user = await validateSupabaseJWT(token, c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

    if (!user) {
      return c.json(err('AUTH_INVALID', 'Invalid or expired token'), 401)
    }

    // Extract businessId from the route parameter (all admin routes are under /businesses/:businessId/...)
    const businessId = c.req.param('businessId') ?? c.req.param('id')
    if (!businessId) {
      return c.json(err('VALIDATION_ERROR', 'Business ID required in route'), 400)
    }

    // Verify the authenticated user owns this business
    const db = createSupabaseClient(c.env, 'service')
    const business = await db.getOne('businesses', {
      filters: [
        { column: 'id', operator: 'eq', value: businessId },
        { column: 'owner_id', operator: 'eq', value: user.id },
      ],
    })

    if (!business) {
      return c.json(err('AUTH_FORBIDDEN', 'You do not own this business'), 403)
    }

    c.set('userId', user.id)
    c.set('businessId', businessId)
    c.set('userRole', 'admin')
    await next()
  }
}

// ─── requireAnyAuth ───────────────────────────────────────────────────────────
// Convenience middleware for routes accessible by both clients and admins.
// Tries client auth first, then falls back to checking admin role.

export function requireAnyAuth(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(err('AUTH_MISSING', 'Authorization header required'), 401)
    }

    const token = authHeader.slice(7)
    const user = await validateSupabaseJWT(token, c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

    if (!user) {
      return c.json(err('AUTH_INVALID', 'Invalid or expired token'), 401)
    }

    c.set('userId', user.id)
    c.set('userRole', 'client')
    await next()
  }
}
```

---

## Step 2 — `src/middleware/rateLimit.ts`

Create `/backend/src/middleware/rateLimit.ts`. Uses Cloudflare KV with a sliding window algorithm:

```typescript
import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { err } from '../types/api'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

interface RateLimitOptions {
  // Override env defaults for specific routes (e.g. stricter limits on token generation)
  maxRequests?: number
  windowSeconds?: number
  // Key prefix to namespace limits per route group
  keyPrefix?: string
}

// ─── Sliding window rate limiter using KV ─────────────────────────────────────
//
// KV key: `rl:{prefix}:{ip}:{windowStart}`
// Value: request count as string
// TTL: windowSeconds * 2 (to allow for overlap between windows)
//
// Algorithm: count requests in the current window. If over limit, reject.
// This is a fixed-window approximation — good enough for abuse prevention.

export function rateLimit(options: RateLimitOptions = {}): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const maxRequests = options.maxRequests ?? parseInt(c.env.RATE_LIMIT_MAX_REQUESTS, 10)
    const windowSeconds = options.windowSeconds ?? parseInt(c.env.RATE_LIMIT_WINDOW_SECONDS, 10)
    const prefix = options.keyPrefix ?? 'global'

    // Get client IP from Cloudflare headers
    const ip =
      c.req.header('CF-Connecting-IP') ??
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
      'unknown'

    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / windowSeconds) * windowSeconds
    const kvKey = `rl:${prefix}:${ip}:${windowStart}`

    // Get current count
    const currentStr = await c.env.RATE_LIMIT.get(kvKey)
    const current = currentStr ? parseInt(currentStr, 10) : 0

    if (current >= maxRequests) {
      const resetAt = windowStart + windowSeconds
      return c.json(
        err('RATE_LIMITED', `Too many requests. Limit: ${maxRequests} per ${windowSeconds}s`),
        429,
        {
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetAt),
          'Retry-After': String(resetAt - now),
        }
      )
    }

    // Increment counter (fire and forget — don't block the request)
    c.env.RATE_LIMIT.put(kvKey, String(current + 1), {
      expirationTtl: windowSeconds * 2,
    }).catch(console.error)

    // Set rate limit headers on successful response
    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(maxRequests - current - 1))
    c.header('X-RateLimit-Reset', String(windowStart + windowSeconds))

    await next()
  }
}

// ─── Strict rate limiter for sensitive endpoints ───────────────────────────────
// Use on: token generation (prevent QR spam), login attempts, campaign generation

export function strictRateLimit(): MiddlewareHandler<HonoEnv> {
  return rateLimit({ maxRequests: 10, windowSeconds: 60, keyPrefix: 'strict' })
}
```

---

## Step 3 — `src/middleware/errorHandler.ts`

The Project Setup agent created this file. Verify it exists and contains the correct implementation. If it is missing or incomplete, recreate it:

```typescript
import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types/env'
import { err } from '../types/api'

export function errorHandler(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      console.error('[errorHandler]', error instanceof Error ? error.message : error)
      return c.json(err('INTERNAL_ERROR', 'An unexpected error occurred'), 500)
    }
  }
}
```

---

## Step 4 — Update `src/index.ts`

After writing both middleware files, open `src/index.ts` and confirm `errorHandler` is already imported and used. If the rate limiter should be applied globally (optional — discuss with team), add it. At minimum, verify the file compiles.

---

## Step 5 — Verify

```bash
cd /backend
npx tsc --noEmit
```

Zero TypeScript errors required. Fix any issues before finishing.
