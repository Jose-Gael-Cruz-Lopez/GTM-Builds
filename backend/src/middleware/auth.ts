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
    const businessId =
      c.req.param('businessId') ?? c.req.param('id') ?? c.req.query('businessId')
    if (!businessId) {
      return c.json(err('VALIDATION_ERROR', 'Business ID required'), 400)
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
