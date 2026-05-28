import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../index'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

const TEST_AUTH_ID = 'auth-user-7a3'
const TEST_USERNAME = 'tester123'

describe('POST /consumer/login — clients row backfill', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('creates a clients row when Supabase auth succeeds but no profile exists', async () => {
    const postedRows: Array<Record<string, unknown>> = []

    mockFetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()

      if (url.includes('/auth/v1/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'fake-access',
            refresh_token: 'fake-refresh',
            expires_in: 3600,
            user: { id: TEST_AUTH_ID },
          }),
          { status: 200 },
        )
      }

      if (url.includes('/rest/v1/clients')) {
        if (method === 'GET') {
          // First lookup by auth_id returns empty — simulates missing profile.
          return new Response(JSON.stringify([]), { status: 200 })
        }
        if (method === 'POST') {
          const body = init?.body ? JSON.parse(init.body as string) : {}
          const row = {
            id: 'client-new-1',
            auth_id: body.auth_id,
            full_name: body.full_name,
            referral_code: body.referral_code,
            referred_by_client_id: body.referred_by_client_id,
          }
          postedRows.push(row)
          return new Response(JSON.stringify([row]), { status: 201 })
        }
      }

      return new Response(JSON.stringify([]), { status: 200 })
    })

    const request = new Request('http://localhost/consumer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_USERNAME }),
    })
    const response = await app.fetch(request, env)

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      success: boolean
      data: {
        accessToken: string
        client: { id: string; username: string; referralCode: string } | null
      }
    }

    expect(body.success).toBe(true)
    expect(body.data.accessToken).toBe('fake-access')
    expect(body.data.client).not.toBeNull()
    expect(body.data.client?.username).toBe(TEST_USERNAME)
    expect(body.data.client?.referralCode).toMatch(/^[A-F0-9]{8}$/)

    expect(postedRows).toHaveLength(1)
    expect(postedRows[0]).toMatchObject({
      auth_id: TEST_AUTH_ID,
      full_name: TEST_USERNAME,
      referred_by_client_id: null,
    })
  })

  it('returns the existing client when profile is already present (no backfill)', async () => {
    let postCount = 0

    mockFetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()

      if (url.includes('/auth/v1/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'fake-access',
            refresh_token: 'fake-refresh',
            expires_in: 3600,
            user: { id: TEST_AUTH_ID },
          }),
          { status: 200 },
        )
      }

      if (url.includes('/rest/v1/clients')) {
        if (method === 'GET') {
          return new Response(
            JSON.stringify([
              {
                id: 'client-existing-1',
                auth_id: TEST_AUTH_ID,
                full_name: TEST_USERNAME,
                referral_code: 'ABCD1234',
              },
            ]),
            { status: 200 },
          )
        }
        if (method === 'POST') postCount++
      }

      return new Response(JSON.stringify([]), { status: 200 })
    })

    const request = new Request('http://localhost/consumer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_USERNAME }),
    })
    const response = await app.fetch(request, env)

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      success: boolean
      data: { client: { id: string; referralCode: string } | null }
    }
    expect(body.data.client?.id).toBe('client-existing-1')
    expect(body.data.client?.referralCode).toBe('ABCD1234')
    expect(postCount).toBe(0)
  })
})
