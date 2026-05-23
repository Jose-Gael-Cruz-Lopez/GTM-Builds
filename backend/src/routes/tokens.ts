import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { ContextVariables } from '../types/api'
import { ok, err } from '../types/api'
import { requireClient } from '../middleware/auth'
import { strictRateLimit } from '../middleware/rateLimit'
import { generateToken, validateToken, invalidateToken } from '../lib/tokenEngine'

type HonoEnv = { Bindings: Env; Variables: ContextVariables }

export const tokenRoutes = new Hono<HonoEnv>()

// ─── POST /tokens/generate ────────────────────────────────────────────────────
// Authenticated client requests a new QR token for a specific business.
// Apply strict rate limit to prevent QR spam (10 req/min per IP).

tokenRoutes.post('/generate', requireClient(), strictRateLimit(), async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ businessId: string }>().catch(() => null)

  if (!body?.businessId) {
    return c.json(err('VALIDATION_ERROR', 'businessId is required in request body'), 400)
  }

  const ttl = parseInt(c.env.TOKEN_TTL_SECONDS, 10)
  const result = await generateToken(userId, body.businessId, c.env.TOKEN_SECRET, ttl)

  return c.json(
    ok({
      token: result.token,
      expiresAt: result.expiresAt,
      ttlSeconds: ttl,
    }),
    200
  )
})

// ─── POST /tokens/validate ────────────────────────────────────────────────────
// Staff-authenticated endpoint. Validates a QR token without consuming it.
// Returns the userId and businessId embedded in the token if valid.
// Note: validation does NOT mark the token as used — that happens in POST /visits.

tokenRoutes.post('/validate', async (c) => {
  // Staff auth via X-Staff-Key header
  const staffKey = c.req.header('X-Staff-Key')
  if (!staffKey) {
    return c.json(err('AUTH_MISSING', 'X-Staff-Key header required'), 401)
  }

  const body = await c.req.json<{ token: string }>().catch(() => null)
  if (!body?.token) {
    return c.json(err('VALIDATION_ERROR', 'token is required in request body'), 400)
  }

  const ttl = parseInt(c.env.TOKEN_TTL_SECONDS, 10)
  const result = await validateToken(body.token, c.env.TOKEN_SECRET, ttl, c.env.TOKEN_BLACKLIST)

  if (!result.valid) {
    const statusMap = {
      TOKEN_EXPIRED: 410,
      TOKEN_ALREADY_USED: 409,
      TOKEN_INVALID: 400,
    } as const
    return c.json(err(result.code, result.message), statusMap[result.code])
  }

  return c.json(
    ok({
      valid: true,
      userId: result.payload.uid,
      businessId: result.payload.bid,
      issuedAt: new Date(result.payload.ts * 1000).toISOString(),
    }),
    200
  )
})

// ─── POST /tokens/invalidate ──────────────────────────────────────────────────
// Called internally (by the visits route) after a visit is registered.
// Also exposed as an endpoint so staff apps can manually invalidate tokens.
// Requires staff auth.

tokenRoutes.post('/invalidate', async (c) => {
  const staffKey = c.req.header('X-Staff-Key')
  if (!staffKey) {
    return c.json(err('AUTH_MISSING', 'X-Staff-Key header required'), 401)
  }

  const body = await c.req.json<{ token: string }>().catch(() => null)
  if (!body?.token) {
    return c.json(err('VALIDATION_ERROR', 'token is required in request body'), 400)
  }

  const ttl = parseInt(c.env.TOKEN_TTL_SECONDS, 10)
  await invalidateToken(body.token, c.env.TOKEN_BLACKLIST, ttl)

  return c.json(ok({ invalidated: true }), 200)
})
