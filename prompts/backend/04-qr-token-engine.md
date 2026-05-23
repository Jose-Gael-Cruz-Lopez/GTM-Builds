# Agent Prompt — 04: QR Token Engine

## Context

You are building the **NexoLeal Cloudflare Workers backend** — Wave 2B. Your job is to implement the fraud-resistant QR token engine. This is the security core of NexoLeal. Run this in parallel with the Auth, Businesses, and Clients agents.

Wave 1 has already created:
- `src/types/env.ts`, `src/types/api.ts`
- `src/lib/supabase.ts`

The token engine works like this:
1. An authenticated client calls `POST /tokens/generate`
2. The backend creates an HMAC-SHA256 token tied to `userId + businessId + timestamp + nonce`
3. The client encodes the token as a QR code displayed on their screen
4. Staff scans the QR, their app calls `POST /tokens/validate`
5. The backend verifies the HMAC, checks the token is within the 90-second window, and checks it hasn't been used before (KV blacklist)
6. After the visit is registered, `POST /tokens/invalidate` marks the token as used in KV

---

## Security Requirements

- **Anti-replay**: each token can only be used once. After validation, the token hash is stored in `TOKEN_BLACKLIST` KV with a 5-minute TTL.
- **Time window**: tokens expire 90 seconds after generation (configurable via `TOKEN_TTL_SECONDS` env var).
- **HMAC integrity**: token signature is HMAC-SHA256 using the `TOKEN_SECRET` env var. Any tampering is detectable.
- **Nonce**: a 16-byte random nonce is included to prevent two tokens generated in the same second from being identical.
- **Timing-safe comparison**: HMAC comparison uses constant-time comparison to prevent timing attacks.

---

## Token Payload Format

The token is a URL-safe base64-encoded JSON object:

```typescript
interface TokenPayload {
  uid: string       // userId (Supabase auth UUID)
  bid: string       // businessId (UUID)
  ts: number        // Unix timestamp in seconds (when token was generated)
  nonce: string     // 16-byte random hex string
  sig: string       // HMAC-SHA256 of "uid:bid:ts:nonce" as hex string
}
```

The full token returned to the client is `base64url(JSON.stringify(payload))`.

---

## Step 1 — `src/lib/tokenEngine.ts`

Create `/backend/src/lib/tokenEngine.ts`:

```typescript
// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  uid: string
  bid: string
  ts: number
  nonce: string
  sig: string
}

export interface GenerateTokenResult {
  token: string           // full base64url token (QR content)
  payload: TokenPayload   // decoded payload (for debugging)
  expiresAt: string       // ISO 8601 UTC timestamp
}

export interface ValidateTokenResult {
  valid: true
  payload: TokenPayload
}

export interface InvalidTokenResult {
  valid: false
  code: 'TOKEN_EXPIRED' | 'TOKEN_ALREADY_USED' | 'TOKEN_INVALID'
  message: string
}

export type TokenValidationResult = ValidateTokenResult | InvalidTokenResult

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function hmacSign(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacVerify(secret: string, message: string, expectedSig: string): Promise<boolean> {
  // Recompute and compare — constant-time via subtle.verify
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  // Convert hex string back to Uint8Array
  const sigBytes = new Uint8Array(
    expectedSig.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  )

  return crypto.subtle.verify('HMAC', keyMaterial, sigBytes, encoder.encode(message))
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    encoded.length + ((4 - (encoded.length % 4)) % 4),
    '='
  )
  return atob(padded)
}

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Token Generation ─────────────────────────────────────────────────────────

export async function generateToken(
  userId: string,
  businessId: string,
  secret: string,
  ttlSeconds: number
): Promise<GenerateTokenResult> {
  const ts = Math.floor(Date.now() / 1000)
  const nonce = generateNonce()
  const message = `${userId}:${businessId}:${ts}:${nonce}`
  const sig = await hmacSign(secret, message)

  const payload: TokenPayload = { uid: userId, bid: businessId, ts, nonce, sig }
  const token = base64urlEncode(JSON.stringify(payload))
  const expiresAt = new Date((ts + ttlSeconds) * 1000).toISOString()

  return { token, payload, expiresAt }
}

// ─── Token Validation ─────────────────────────────────────────────────────────

export async function validateToken(
  token: string,
  secret: string,
  ttlSeconds: number,
  blacklist: KVNamespace
): Promise<TokenValidationResult> {
  // 1. Decode and parse
  let payload: TokenPayload
  try {
    const decoded = base64urlDecode(token)
    payload = JSON.parse(decoded) as TokenPayload
  } catch {
    return { valid: false, code: 'TOKEN_INVALID', message: 'Token cannot be decoded' }
  }

  // 2. Check required fields
  if (!payload.uid || !payload.bid || !payload.ts || !payload.nonce || !payload.sig) {
    return { valid: false, code: 'TOKEN_INVALID', message: 'Token is missing required fields' }
  }

  // 3. Check expiry
  const now = Math.floor(Date.now() / 1000)
  if (now - payload.ts > ttlSeconds) {
    return {
      valid: false,
      code: 'TOKEN_EXPIRED',
      message: `Token expired ${now - payload.ts - ttlSeconds}s ago`,
    }
  }

  // 4. Verify HMAC signature
  const message = `${payload.uid}:${payload.bid}:${payload.ts}:${payload.nonce}`
  const sigValid = await hmacVerify(secret, message, payload.sig)
  if (!sigValid) {
    return { valid: false, code: 'TOKEN_INVALID', message: 'Token signature is invalid' }
  }

  // 5. Check KV blacklist (one-time use enforcement)
  const tokenHash = await sha256Hex(token)
  const blacklisted = await blacklist.get(`used_token:${tokenHash}`)
  if (blacklisted !== null) {
    return { valid: false, code: 'TOKEN_ALREADY_USED', message: 'Token has already been used' }
  }

  return { valid: true, payload }
}

// ─── Token Invalidation ───────────────────────────────────────────────────────
// Call this after successfully registering a visit to prevent reuse.

export async function invalidateToken(
  token: string,
  blacklist: KVNamespace,
  ttlSeconds: number
): Promise<void> {
  const tokenHash = await sha256Hex(token)
  // Store with TTL of 2x the token's own TTL — covers edge cases where
  // a token is validated near the edge of the expiry window.
  await blacklist.put(`used_token:${tokenHash}`, '1', {
    expirationTtl: ttlSeconds * 2,
  })
}

// ─── Token Hash (for visit idempotency key) ───────────────────────────────────

export { sha256Hex as hashToken }
```

---

## Step 2 — `src/routes/tokens.ts`

Create `/backend/src/routes/tokens.ts`:

```typescript
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
```

---

## Step 3 — Mount the route in `src/index.ts`

Open `/backend/src/index.ts` and add the token route. Uncomment the relevant line:

```typescript
import { tokenRoutes } from './routes/tokens'
// ...
app.route('/tokens', tokenRoutes)
```

---

## Step 4 — Verify

```bash
cd /backend
npx tsc --noEmit
```

Zero TypeScript errors required. The token engine is a pure crypto module — no Supabase calls in `tokenEngine.ts` itself. Routes call it via clean imports.
