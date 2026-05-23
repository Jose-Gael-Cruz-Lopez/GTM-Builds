import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'
import {
  generateToken,
  validateToken,
  invalidateToken,
} from '../lib/tokenEngine'

const SECRET = 'a'.repeat(64)
const USER_ID = 'user-123e4567-e89b-12d3-a456-426614174000'
const BUSINESS_ID = 'biz-123e4567-e89b-12d3-a456-426614174001'
const TTL = 90

describe('Token Engine', () => {
  describe('generateToken', () => {
    it('produces a valid base64url-encoded token', async () => {
      const result = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)
      expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/)
      expect(result.expiresAt).toBeTruthy()
      expect(result.payload.uid).toBe(USER_ID)
      expect(result.payload.bid).toBe(BUSINESS_ID)
    })

    it('generates unique tokens for the same user', async () => {
      const t1 = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)
      const t2 = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)
      expect(t1.token).not.toBe(t2.token)
    })
  })

  describe('validateToken', () => {
    it('validates a freshly generated token as valid', async () => {
      const { token } = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)
      const result = await validateToken(token, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.payload.uid).toBe(USER_ID)
        expect(result.payload.bid).toBe(BUSINESS_ID)
      }
    })

    it('rejects a token with an invalid signature', async () => {
      const { token } = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)
      const tampered = token.slice(0, -5) + 'AAAAA'
      const result = await validateToken(tampered, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.code).toBe('TOKEN_INVALID')
      }
    })

    it('rejects a token with a wrong secret', async () => {
      const { token } = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)
      const result = await validateToken(token, 'b'.repeat(64), TTL, env.TOKEN_BLACKLIST)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.code).toBe('TOKEN_INVALID')
      }
    })

    it('rejects a random string as TOKEN_INVALID', async () => {
      const result = await validateToken('notavalidtoken', SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.code).toBe('TOKEN_INVALID')
      }
    })

    it('rejects an already-invalidated token (anti-replay)', async () => {
      const { token } = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)

      const first = await validateToken(token, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(first.valid).toBe(true)

      await invalidateToken(token, env.TOKEN_BLACKLIST, TTL)

      const second = await validateToken(token, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(second.valid).toBe(false)
      if (!second.valid) {
        expect(second.code).toBe('TOKEN_ALREADY_USED')
      }
    })

    it('rejects an expired token (TTL = 1 second)', async () => {
      const SHORT_TTL = 1
      const { token } = await generateToken(USER_ID, BUSINESS_ID, SECRET, SHORT_TTL)

      // 2100ms guarantees we cross a whole-second boundary even if generateToken
      // ran near the end of a second. Token engine uses Math.floor(Date.now()/1000).
      await new Promise((resolve) => setTimeout(resolve, 2100))

      const result = await validateToken(token, SECRET, SHORT_TTL, env.TOKEN_BLACKLIST)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.code).toBe('TOKEN_EXPIRED')
      }
    })
  })

  describe('invalidateToken', () => {
    it('stores the token hash in KV with a TTL', async () => {
      const { token } = await generateToken(USER_ID, BUSINESS_ID, SECRET, TTL)
      await invalidateToken(token, env.TOKEN_BLACKLIST, TTL)

      const result = await validateToken(token, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(result.valid).toBe(false)
    })
  })
})
