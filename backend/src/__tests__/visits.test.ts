import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../index'
import { generateToken } from '../lib/tokenEngine'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

const TEST_USER_ID = 'user-abc-123'
const TEST_BUSINESS_ID = 'biz-def-456'
const SECRET = 'a'.repeat(64)

describe('Visits API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns 401 without X-Staff-Key', async () => {
    const request = new Request('http://localhost/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'some-token' }),
    })
    const response = await app.fetch(request, env)
    expect(response.status).toBe(401)
  })

  it('returns 400 when token is missing from body', async () => {
    // mockImplementation creates a fresh Response per call. Response bodies are
    // one-shot streams; mockResolvedValue would return the same Response, which
    // crashes on the second .json()/.text() consumption.
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([{ id: 'key-1', business_id: TEST_BUSINESS_ID, key_hash: 'test', is_active: true }]),
          { status: 200 }
        )
      )
    )

    const request = new Request('http://localhost/visits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Staff-Key': `${TEST_BUSINESS_ID}:testrawkey`,
      },
      body: JSON.stringify({}),
    })
    const response = await app.fetch(request, env)
    expect(response.status).toBe(400)
  })

  it('returns 410 for an expired token', async () => {
    // Build a token with ts ~200s in the past so the route's TOKEN_TTL_SECONDS
    // (90s from .dev.vars) treats it as expired. The route looks up its TTL
    // from env, not from the token, so we can't pass TTL=0 to generateToken.
    const realDateNow = Date.now
    const pastTime = realDateNow() - 200_000
    globalThis.Date.now = () => pastTime
    let expiredToken: Awaited<ReturnType<typeof generateToken>>
    try {
      expiredToken = await generateToken(TEST_USER_ID, TEST_BUSINESS_ID, SECRET, 60)
    } finally {
      globalThis.Date.now = realDateNow
    }

    // URL-aware mock: only the staff_keys lookup returns a row; every other
    // Supabase call returns an empty array (the route should short-circuit at
    // token validation and never reach those calls anyway).
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url
      if (u.includes('/rest/v1/staff_keys')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([{ id: 'key-1', business_id: TEST_BUSINESS_ID, key_hash: 'test', is_active: true }]),
            { status: 200 }
          )
        )
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
    })

    const request = new Request('http://localhost/visits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Staff-Key': `${TEST_BUSINESS_ID}:rawkey`,
      },
      body: JSON.stringify({ token: expiredToken.token }),
    })
    const response = await app.fetch(request, env)
    expect(response.status).toBe(410)
  })
})
