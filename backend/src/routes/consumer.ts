import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireClient } from '../middleware/auth'
import { strictRateLimit } from '../middleware/rateLimit'
import { generateConsumerToken } from '../lib/tokenEngine'
import { createSupabaseClient, mapSupabaseError, SupabaseError } from '../lib/supabase'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const consumerRoutes = new Hono<HonoEnv>()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/

interface SupabaseAuthResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: { id: string }
  error?: string
  error_description?: string
  msg?: string
  code?: number
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Deterministic password — login never stores credentials server-side
async function consumerPassword(username: string, secret: string): Promise<string> {
  return hmacHex(secret, `consumer:passwd:${username}`)
}

// 8-char uppercase referral code derived from Supabase auth_id
async function makeReferralCode(authId: string, secret: string): Promise<string> {
  const hash = await hmacHex(secret, `consumer:referral:${authId}`)
  return hash.slice(0, 8).toUpperCase()
}

// ─── POST /consumer/register ──────────────────────────────────────────────────
// Frictionless B2C registration: username + optional referral code.
// Uses a synthetic email ({username}@consumer.internal) with a deterministic
// HMAC password so the user can log back in with just their username.

consumerRoutes.post('/register', strictRateLimit(), async (c) => {
  const body = await c.req.json<{
    username: string
    referralCode?: string
  }>().catch(() => null)

  if (!body?.username || !USERNAME_RE.test(body.username)) {
    return c.json(
      err('VALIDATION_ERROR', 'username must be 3-30 characters (a-z, 0-9, _, -)'),
      400
    )
  }

  const username = body.username.toLowerCase()
  const email = `${username}@consumer.internal`
  const password = await consumerPassword(username, c.env.TOKEN_SECRET)

  const signupRes = await fetch(`${c.env.SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': c.env.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  })

  const signupData = await signupRes.json() as SupabaseAuthResponse

  if (!signupRes.ok || !signupData.access_token || !signupData.user) {
    const msg = signupData.msg ?? signupData.error ?? 'Registration failed'
    if (msg.toLowerCase().includes('already registered')) {
      return c.json(err('VALIDATION_ERROR', 'Username is already taken'), 409)
    }
    return c.json(err('SUPABASE_ERROR', msg), 400)
  }

  const authId = signupData.user.id
  const db = createSupabaseClient(c.env, 'service')
  const referralCode = await makeReferralCode(authId, c.env.TOKEN_SECRET)

  // Resolve referrer if code provided. Wrapped because the production
  // clients table currently lacks the referral_code column, which makes the
  // filter throw a PostgREST schema-cache error. Falling back to "no referrer"
  // keeps register unblocked; restore strict lookup once the column exists.
  let referredByClientId: string | null = null
  if (body.referralCode) {
    try {
      const referrer = await db.getOne('clients', {
        filters: [
          { column: 'referral_code', operator: 'eq', value: body.referralCode.toUpperCase() },
        ],
      })
      referredByClientId = referrer?.id ?? null
    } catch (e) {
      console.warn('Referrer lookup failed, continuing without referral link:', e)
    }
  }

  try {
    // Insert only the columns we know exist in production. Both referral_code
    // (derived from auth_id) and referred_by_client_id (column also missing
    // in prod, surfaced as a PostgREST schema-cache error on register) are
    // omitted. Once the schema catches up, attribution can be re-enabled by
    // including referred_by_client_id here.
    const [client] = await db.post('clients', {
      auth_id: authId,
      full_name: body.username,
    })

    return c.json(
      ok({
        accessToken: signupData.access_token,
        refreshToken: signupData.refresh_token!,
        expiresIn: signupData.expires_in!,
        client: {
          id: client!.id,
          username: client!.full_name,
          referralCode,
          referredBy: referredByClientId !== null,
        },
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

// ─── POST /consumer/login ─────────────────────────────────────────────────────
// Username-only login: recomputes deterministic credentials and signs in via Supabase.

consumerRoutes.post('/login', strictRateLimit(), async (c) => {
  const body = await c.req.json<{ username: string }>().catch(() => null)

  if (!body?.username || !USERNAME_RE.test(body.username)) {
    return c.json(err('VALIDATION_ERROR', 'username must be 3-30 characters (a-z, 0-9, _, -)'), 400)
  }

  const username = body.username.toLowerCase()
  const email = `${username}@consumer.internal`
  const password = await consumerPassword(username, c.env.TOKEN_SECRET)

  const loginRes = await fetch(`${c.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': c.env.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  })

  const loginData = await loginRes.json() as SupabaseAuthResponse

  if (!loginRes.ok || !loginData.access_token || !loginData.user) {
    return c.json(err('AUTH_INVALID', 'Invalid username or account not found'), 401)
  }

  const db = createSupabaseClient(c.env, 'service')
  let client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: loginData.user.id }],
  })

  // Self-heal: Supabase auth user exists but no clients row (e.g. a prior
  // /register that signed up the user but then failed to insert the profile).
  // Without this, every authed call returns 404 and the account is stuck.
  if (!client) {
    try {
      // Use the request-supplied casing (matches /register's behavior) so a
      // user re-recovering after a partial signup keeps the same display name.
      // Insert only known-present columns (see /register for the same rationale
      // around omitted referral_code and referred_by_client_id).
      const [created] = await db.post('clients', {
        auth_id: loginData.user.id,
        full_name: body.username,
      })
      client = created ?? null
    } catch (error) {
      if (error instanceof SupabaseError) {
        // Likely a concurrent backfill won the race and a unique constraint
        // on auth_id rejected this insert. Re-query before giving up so
        // simultaneous logins for the same orphan resolve idempotently.
        client = await db.getOne('clients', {
          filters: [{ column: 'auth_id', operator: 'eq', value: loginData.user.id }],
        })
        if (!client) {
          const mapped = mapSupabaseError(error)
          return c.json(err(mapped.code, mapped.message), mapped.status)
        }
      } else {
        throw error
      }
    }
  }

  const responseClient = client
    ? {
        id: client.id,
        username: client.full_name,
        referralCode: await makeReferralCode(client.auth_id, c.env.TOKEN_SECRET),
      }
    : null

  return c.json(
    ok({
      accessToken: loginData.access_token,
      refreshToken: loginData.refresh_token!,
      expiresIn: loginData.expires_in!,
      client: responseClient,
    }),
    200
  )
})

// ─── POST /consumer/token ─────────────────────────────────────────────────────
// Authenticated consumer generates their current 90-second QR token.
// The token encodes userId + displayName; the scanning business is resolved
// at scan time from the staff key — no businessId needed here.

consumerRoutes.post('/token', requireClient(), strictRateLimit(), async (c) => {
  const userId = c.get('userId')
  const db = createSupabaseClient(c.env, 'service')

  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
  })

  if (!client) {
    return c.json(
      err('NOT_FOUND', 'Client profile not found. Call POST /consumer/register first.'),
      404
    )
  }

  const ttl = parseInt(c.env.TOKEN_TTL_SECONDS, 10)
  const result = await generateConsumerToken(userId, client.full_name, c.env.TOKEN_SECRET, ttl)

  return c.json(
    ok({
      token: result.token,
      expiresAt: result.expiresAt,
      ttlSeconds: ttl,
    }),
    200
  )
})

// ─── GET /consumer/referral-code ──────────────────────────────────────────────
// Returns the authenticated consumer's personal referral code for sharing.

consumerRoutes.get('/referral-code', requireClient(), async (c) => {
  const userId = c.get('userId')
  const db = createSupabaseClient(c.env, 'service')

  const client = await db.getOne('clients', {
    filters: [{ column: 'auth_id', operator: 'eq', value: userId }],
  })

  if (!client) {
    return c.json(err('NOT_FOUND', 'Client profile not found'), 404)
  }

  const referralCode = await makeReferralCode(client.auth_id, c.env.TOKEN_SECRET)

  return c.json(
    ok({
      referralCode,
      username: client.full_name,
    }),
    200
  )
})
