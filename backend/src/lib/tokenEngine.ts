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
