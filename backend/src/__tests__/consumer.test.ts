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
          }
          postedRows.push(body)
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
    })
    // Both columns are intentionally omitted — referral_code is derived,
    // referred_by_client_id is absent in the production schema.
    expect(postedRows[0]).not.toHaveProperty('referral_code')
    expect(postedRows[0]).not.toHaveProperty('referred_by_client_id')
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
    // referralCode is derived from auth_id, not read from the row
    expect(body.data.client?.referralCode).toMatch(/^[A-F0-9]{8}$/)
    expect(postCount).toBe(0)
  })

  it('idempotently resolves a concurrent backfill via re-query after insert conflict', async () => {
    let getCallCount = 0

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
          getCallCount++
          // 1st GET: missing (triggers backfill). 2nd GET (post-conflict re-query): found.
          if (getCallCount === 1) return new Response(JSON.stringify([]), { status: 200 })
          return new Response(
            JSON.stringify([
              { id: 'client-race-winner', auth_id: TEST_AUTH_ID, full_name: TEST_USERNAME },
            ]),
            { status: 200 },
          )
        }
        if (method === 'POST') {
          // Simulate the unique-constraint violation a concurrent insert would raise.
          return new Response(
            JSON.stringify({ code: '23505', message: 'duplicate key value violates unique constraint' }),
            { status: 409 },
          )
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
      data: { client: { id: string } | null }
    }
    expect(body.data.client?.id).toBe('client-race-winner')
    expect(getCallCount).toBe(2)
  })
})

describe('POST /consumer/register — derived referral_code', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns a derived referralCode on the happy path and omits the column from insert', async () => {
    const postedRows: Array<Record<string, unknown>> = []

    mockFetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()

      if (url.includes('/auth/v1/signup')) {
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

      if (url.includes('/rest/v1/clients') && method === 'POST') {
        const inserted = init?.body ? JSON.parse(init.body as string) : {}
        postedRows.push(inserted)
        return new Response(
          JSON.stringify([{ id: 'client-fresh-1', ...inserted }]),
          { status: 201 },
        )
      }

      return new Response(JSON.stringify([]), { status: 200 })
    })

    const request = new Request('http://localhost/consumer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_USERNAME }),
    })
    const response = await app.fetch(request, env)

    expect(response.status).toBe(201)
    const body = (await response.json()) as {
      success: boolean
      data: { client: { referralCode: string; referredBy: boolean } }
    }
    expect(body.data.client.referralCode).toMatch(/^[A-F0-9]{8}$/)
    expect(body.data.client.referredBy).toBe(false)

    expect(postedRows).toHaveLength(1)
    expect(postedRows[0]).not.toHaveProperty('referral_code')
    expect(postedRows[0]).not.toHaveProperty('referred_by_client_id')
  })

  it('falls back to no referrer when the referrer lookup throws (missing column)', async () => {
    mockFetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()

      if (url.includes('/auth/v1/signup')) {
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
        // Filtering by referral_code in the GET triggers the schema-cache error.
        if (method === 'GET' && url.includes('referral_code')) {
          return new Response(
            JSON.stringify({
              code: 'PGRST204',
              message: "Could not find the 'referral_code' column of 'clients' in the schema cache",
            }),
            { status: 400 },
          )
        }
        if (method === 'POST') {
          const inserted = init?.body ? JSON.parse(init.body as string) : {}
          return new Response(
            JSON.stringify([{ id: 'client-norefer', ...inserted }]),
            { status: 201 },
          )
        }
      }

      return new Response(JSON.stringify([]), { status: 200 })
    })

    const request = new Request('http://localhost/consumer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_USERNAME, referralCode: 'SOMECODE' }),
    })
    const response = await app.fetch(request, env)

    expect(response.status).toBe(201)
    const body = (await response.json()) as {
      success: boolean
      data: { client: { referredBy: boolean } }
    }
    expect(body.data.client.referredBy).toBe(false)
  })
})

describe('GET /consumer/referral-code — derived from auth_id', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns a derived referralCode regardless of stored row contents', async () => {
    mockFetch.mockImplementation(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: TEST_AUTH_ID }), { status: 200 })
      }

      if (url.includes('/rest/v1/clients')) {
        return new Response(
          JSON.stringify([
            { id: 'client-1', auth_id: TEST_AUTH_ID, full_name: TEST_USERNAME },
          ]),
          { status: 200 },
        )
      }

      return new Response(JSON.stringify([]), { status: 200 })
    })

    const request = new Request('http://localhost/consumer/referral-code', {
      method: 'GET',
      headers: { Authorization: 'Bearer fake-token' },
    })
    const response = await app.fetch(request, env)

    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      success: boolean
      data: { referralCode: string; username: string }
    }
    expect(body.data.referralCode).toMatch(/^[A-F0-9]{8}$/)
    expect(body.data.username).toBe(TEST_USERNAME)
  })
})
