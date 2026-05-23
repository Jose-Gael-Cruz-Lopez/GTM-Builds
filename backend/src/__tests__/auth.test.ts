import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../index'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe('Auth Middleware', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('requireClient', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const request = new Request('http://localhost/tokens/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'test-biz-id' }),
      })
      const response = await app.fetch(request, env)
      expect(response.status).toBe(401)
      const body = (await response.json()) as { success: boolean; error: { code: string } }
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('returns 401 when Bearer token is invalid', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Invalid JWT' }), { status: 401 })
      )

      const request = new Request('http://localhost/tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token',
        },
        body: JSON.stringify({ businessId: 'test-biz-id' }),
      })
      const response = await app.fetch(request, env)
      expect(response.status).toBe(401)
      const body = (await response.json()) as { success: boolean; error: { code: string } }
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTH_INVALID')
    })

    it('passes through with valid token', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: 'user-abc-123', email: 'test@example.com' }),
          { status: 200 }
        )
      )

      const request = new Request('http://localhost/tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-supabase-jwt',
        },
        body: JSON.stringify({ businessId: 'test-biz-id' }),
      })
      const response = await app.fetch(request, env)
      // Should not return 401 (may return other errors due to missing KV setup, but auth passed)
      expect(response.status).not.toBe(401)
    })
  })

  describe('requireStaff (X-Staff-Key)', () => {
    it('returns 401 when X-Staff-Key is missing', async () => {
      const request = new Request('http://localhost/tokens/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'some-token' }),
      })
      const response = await app.fetch(request, env)
      expect(response.status).toBe(401)
      const body = (await response.json()) as { success: boolean; error: { code: string } }
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('returns 401 when X-Staff-Key format is invalid', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 })
      )

      const request = new Request('http://localhost/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Key': 'keywithoutseparator',
        },
        body: JSON.stringify({ token: 'some-token' }),
      })
      const response = await app.fetch(request, env)
      expect(response.status).toBe(401)
    })
  })

  describe('Rate limiting', () => {
    it('returns 429 after exceeding the strict rate limit', async () => {
      // mockImplementation creates a fresh Response per call (bodies are one-shot streams).
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: 'user-abc', email: 'test@example.com' }), { status: 200 })
        )
      )

      // Use a unique IP per test run so this test doesn't share rate-limit state
      // with prior auth tests in the same file.
      const ip = `10.0.0.${Math.floor(Math.random() * 250) + 1}`

      let lastStatus = 0
      for (let i = 0; i < 12; i++) {
        const request = new Request('http://localhost/tokens/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token',
            'CF-Connecting-IP': ip,
          },
          body: JSON.stringify({ businessId: 'test-biz-id' }),
        })
        const response = await app.fetch(request, env)
        lastStatus = response.status
      }

      expect(lastStatus).toBe(429)
    })
  })
})
