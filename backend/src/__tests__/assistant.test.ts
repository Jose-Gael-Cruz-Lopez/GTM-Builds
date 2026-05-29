import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import app from '../index'
import { analyzeCacheKey } from '../routes/assistant'

// Worker entry expects (request, env, ctx). Tests must supply ctx so the
// route's c.executionCtx.waitUntil(...) — used to fire-and-forget cache writes
// — works. After fetch, awaiting on the same ctx flushes those background
// promises so subsequent assertions see the resulting KV state.
async function fetchApp(request: Request): Promise<Response> {
  const ctx = createExecutionContext()
  const response = await app.fetch(request, env, ctx)
  await waitOnExecutionContext(ctx)
  return response
}

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

const TEST_USER_ID = 'admin-user-1'
const TEST_BUSINESS_ID = 'biz-cache-1'

// Canonical "success" NIM response shared by every test that needs the model
// to return a parseable insights payload. Returning fresh Responses per call
// is required — Response bodies are one-shot streams.
function buildNimSuccessResponse(): Response {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              segmentAnalysis: { lostInsight: 'l', newInsight: 'n', frequentInsight: 'f' },
              serviceAnalysis: {
                slowPeriods: [],
                activePeriods: [],
                lowPerformanceReasons: [],
                predictions: [],
              },
              recommendations: {
                forLost: 'a',
                forFrequent: 'b',
                forNew: 'c',
                suggestedDiscountLost: 15,
                suggestedDiscountFrequent: 10,
                suggestedDiscountNew: 10,
                suggestedVisitsForReward: 5,
              },
            }),
          },
        },
      ],
    }),
    { status: 200 },
  )
}

// Counts how many times the NIM endpoint is called so we can prove the cache
// short-circuits before reaching the model.
function makeMockNimCounter() {
  let nimCalls = 0
  mockFetch.mockImplementation(async (input: string | URL | Request) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    if (url.includes('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: TEST_USER_ID }), { status: 200 })
    }

    if (url.includes('/rest/v1/businesses')) {
      return new Response(
        JSON.stringify([
          { id: TEST_BUSINESS_ID, owner_id: TEST_USER_ID, name: 'Demo Co', category: 'cafe' },
        ]),
        { status: 200 },
      )
    }

    if (url.includes('/rest/v1/client_business_loyalty') || url.includes('/rest/v1/visits')) {
      // No real data → triggers the demo branch in /analyze.
      return new Response(JSON.stringify([]), { status: 200 })
    }

    if (url.includes('integrate.api.nvidia.com')) {
      nimCalls++
      return buildNimSuccessResponse()
    }

    return new Response(JSON.stringify([]), { status: 200 })
  })
  return () => nimCalls
}

async function callAnalyze(query = ''): Promise<Response> {
  const url = `http://localhost/businesses/${TEST_BUSINESS_ID}/assistant/analyze${query}`
  return fetchApp(
    new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token',
      },
      body: '{}',
    }),
  )
}

describe('POST /businesses/:id/assistant/analyze — caching', () => {
  beforeEach(async () => {
    mockFetch.mockReset()
    await env.ANALYTICS_CACHE.delete(analyzeCacheKey(TEST_BUSINESS_ID))
  })

  it('caches the first response and serves subsequent calls from KV without re-calling NIM', async () => {
    const nimCalls = makeMockNimCounter()

    const first = await callAnalyze()
    expect(first.status).toBe(200)
    const firstBody = (await first.json()) as { success: boolean; data: { cached?: boolean } }
    expect(firstBody.data.cached).toBeUndefined()
    expect(nimCalls()).toBe(1)

    const second = await callAnalyze()
    expect(second.status).toBe(200)
    const secondBody = (await second.json()) as { success: boolean; data: { cached?: boolean } }
    expect(secondBody.data.cached).toBe(true)
    // No additional NIM call — served entirely from KV.
    expect(nimCalls()).toBe(1)
  })

  it('?refresh=true bypasses the cache and re-runs the model', async () => {
    const nimCalls = makeMockNimCounter()

    await callAnalyze() // populate cache
    expect(nimCalls()).toBe(1)

    const refreshed = await callAnalyze('?refresh=true')
    expect(refreshed.status).toBe(200)
    const body = (await refreshed.json()) as { success: boolean; data: { cached?: boolean } }
    expect(body.data.cached).toBeUndefined()
    expect(nimCalls()).toBe(2)
  })

  it('does not cache fallback responses (NIM error stays recoverable)', async () => {
    let nimCalls = 0
    mockFetch.mockImplementation(async (input: string | URL | Request) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url

      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: TEST_USER_ID }), { status: 200 })
      }
      if (url.includes('/rest/v1/businesses')) {
        return new Response(
          JSON.stringify([
            { id: TEST_BUSINESS_ID, owner_id: TEST_USER_ID, name: 'Demo Co', category: 'cafe' },
          ]),
          { status: 200 },
        )
      }
      if (url.includes('/rest/v1/')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      if (url.includes('integrate.api.nvidia.com')) {
        nimCalls++
        // NIM error → route falls back to FALLBACK_INSIGHTS w/ usedFallback=true
        return new Response(JSON.stringify({ detail: 'upstream error' }), { status: 500 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })

    const first = await callAnalyze()
    expect(first.status).toBe(200)
    const firstBody = (await first.json()) as {
      success: boolean
      data: { usedFallback: boolean; cached?: boolean }
    }
    expect(firstBody.data.usedFallback).toBe(true)
    expect(nimCalls).toBe(1)

    // Second call should NOT be served from cache because the first failed —
    // we want a chance to recover when NIM is healthy again.
    const second = await callAnalyze()
    expect(second.status).toBe(200)
    const secondBody = (await second.json()) as {
      success: boolean
      data: { cached?: boolean }
    }
    expect(secondBody.data.cached).toBeUndefined()
    expect(nimCalls).toBe(2)
  })

  it('POST /assistant/campaign invalidates the cache so the next /analyze re-runs NIM', async () => {
    let nimCalls = 0
    mockFetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
      ).toUpperCase()

      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: TEST_USER_ID }), { status: 200 })
      }
      if (url.includes('/rest/v1/businesses')) {
        return new Response(
          JSON.stringify([
            { id: TEST_BUSINESS_ID, owner_id: TEST_USER_ID, name: 'Demo Co', category: 'cafe' },
          ]),
          { status: 200 },
        )
      }
      if (url.includes('/rest/v1/client_business_loyalty') || url.includes('/rest/v1/visits')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      if (url.includes('/rest/v1/campaigns') && method === 'POST') {
        return new Response(
          JSON.stringify([{ id: 'camp-1', business_id: TEST_BUSINESS_ID, status: 'draft' }]),
          { status: 201 },
        )
      }
      if (url.includes('integrate.api.nvidia.com')) {
        nimCalls++
        return buildNimSuccessResponse()
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })

    // Prime the cache.
    await callAnalyze()
    expect(nimCalls).toBe(1)
    const beforeBust = await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))
    expect(beforeBust).not.toBeNull()

    // Create a campaign — should bust the cache.
    const campaignReq = new Request(
      `http://localhost/businesses/${TEST_BUSINESS_ID}/assistant/campaign`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        },
        body: JSON.stringify({ segment: 'lost', discountPct: 15, durationDays: 14 }),
      },
    )
    const campaignRes = await fetchApp(campaignReq)
    expect(campaignRes.status).toBe(201)

    // Cache should be gone.
    const afterBust = await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))
    expect(afterBust).toBeNull()

    // Next analyze must re-run the model rather than serve stale data.
    const refreshed = await callAnalyze()
    const refreshedBody = (await refreshed.json()) as {
      success: boolean
      data: { cached?: boolean }
    }
    expect(refreshedBody.data.cached).toBeUndefined()
    expect(nimCalls).toBe(2)
  })

  it('PATCH /assistant/loyalty invalidates the cache (both update and create paths)', async () => {
    // First pass: existing config exists → PATCH branch.
    let nimCalls = 0
    let loyaltyConfigExists = true

    function buildMock() {
      return async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url
        const method = (
          init?.method ?? (input instanceof Request ? input.method : 'GET')
        ).toUpperCase()

        if (url.includes('/auth/v1/user')) {
          return new Response(JSON.stringify({ id: TEST_USER_ID }), { status: 200 })
        }
        if (url.includes('/rest/v1/businesses')) {
          return new Response(
            JSON.stringify([
              { id: TEST_BUSINESS_ID, owner_id: TEST_USER_ID, name: 'Demo Co', category: 'cafe' },
            ]),
            { status: 200 },
          )
        }
        if (url.includes('/rest/v1/client_business_loyalty') || url.includes('/rest/v1/visits')) {
          return new Response(JSON.stringify([]), { status: 200 })
        }
        if (url.includes('/rest/v1/loyalty_configs')) {
          if (method === 'GET') {
            return new Response(
              loyaltyConfigExists
                ? JSON.stringify([
                    { id: 'lc-1', business_id: TEST_BUSINESS_ID, stamps_required: 5 },
                  ])
                : JSON.stringify([]),
              { status: 200 },
            )
          }
          if (method === 'PATCH') {
            return new Response(
              JSON.stringify([{ id: 'lc-1', business_id: TEST_BUSINESS_ID, stamps_required: 7 }]),
              { status: 200 },
            )
          }
          if (method === 'POST') {
            return new Response(
              JSON.stringify([{ id: 'lc-new', business_id: TEST_BUSINESS_ID, stamps_required: 7 }]),
              { status: 201 },
            )
          }
        }
        if (url.includes('integrate.api.nvidia.com')) {
          nimCalls++
          return buildNimSuccessResponse()
        }
        return new Response(JSON.stringify([]), { status: 200 })
      }
    }

    mockFetch.mockImplementation(buildMock())

    async function loyaltyPatch(): Promise<Response> {
      return fetchApp(
        new Request(`http://localhost/businesses/${TEST_BUSINESS_ID}/assistant/loyalty`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer fake-token',
          },
          body: JSON.stringify({ visitsRequired: 7 }),
        }),
      )
    }

    // ── Update branch ─────────────────────────────────────────────────────
    await callAnalyze()
    expect(nimCalls).toBe(1)
    expect(await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))).not.toBeNull()

    const updateRes = await loyaltyPatch()
    expect(updateRes.status).toBe(200)
    expect(await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))).toBeNull()

    // ── Create branch ─────────────────────────────────────────────────────
    // The mock factory already closes over loyaltyConfigExists and reads its
    // live value at call time, so toggling the variable is sufficient — no
    // need to rebind the implementation.
    loyaltyConfigExists = false

    await callAnalyze() // re-prime
    expect(nimCalls).toBe(2)
    expect(await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))).not.toBeNull()

    const createRes = await loyaltyPatch()
    expect(createRes.status).toBe(201)
    expect(await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))).toBeNull()
  })

  it('POST /visits invalidates the cache (most frequent trigger in production)', async () => {
    // Build a real valid token so requireStaff + tokenEngine.validateToken pass.
    const { generateToken } = await import('../lib/tokenEngine')
    const STAFF_SECRET = 'a'.repeat(64) // matches TOKEN_SECRET in vitest.config.ts
    const TEST_CLIENT_AUTH_ID = 'client-auth-9'
    const valid = await generateToken(TEST_CLIENT_AUTH_ID, TEST_BUSINESS_ID, STAFF_SECRET, 90)

    let nimCalls = 0
    mockFetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
      ).toUpperCase()

      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: TEST_USER_ID }), { status: 200 })
      }
      if (url.includes('/rest/v1/businesses')) {
        return new Response(
          JSON.stringify([
            { id: TEST_BUSINESS_ID, owner_id: TEST_USER_ID, name: 'Demo Co', category: 'cafe' },
          ]),
          { status: 200 },
        )
      }
      if (url.includes('/rest/v1/staff_keys')) {
        return new Response(
          JSON.stringify([
            {
              id: 'sk-1',
              business_id: TEST_BUSINESS_ID,
              key_hash: 'whatever',
              is_active: true,
            },
          ]),
          { status: 200 },
        )
      }
      if (url.includes('/rest/v1/clients')) {
        return new Response(
          JSON.stringify([{ id: 'client-row-1', auth_id: TEST_CLIENT_AUTH_ID }]),
          { status: 200 },
        )
      }
      if (url.includes('/rest/v1/client_business_loyalty')) {
        if (method === 'GET') {
          return new Response(
            JSON.stringify([
              {
                id: 'cbl-1',
                client_id: 'client-row-1',
                business_id: TEST_BUSINESS_ID,
                stamp_count: 0,
                total_visits: 0,
                total_rewards: 0,
                status: 'active',
              },
            ]),
            { status: 200 },
          )
        }
        if (method === 'PATCH' || method === 'POST') {
          return new Response(
            JSON.stringify([
              {
                id: 'cbl-1',
                client_id: 'client-row-1',
                business_id: TEST_BUSINESS_ID,
                stamp_count: 1,
                total_visits: 1,
                total_rewards: 0,
                status: 'active',
              },
            ]),
            { status: 200 },
          )
        }
      }
      if (url.includes('/rest/v1/loyalty_configs')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      if (url.includes('/rest/v1/visits')) {
        if (method === 'GET') return new Response(JSON.stringify([]), { status: 200 })
        if (method === 'POST') {
          return new Response(
            JSON.stringify([{ id: 'visit-1', business_id: TEST_BUSINESS_ID, reward_unlocked: false }]),
            { status: 201 },
          )
        }
      }
      if (url.includes('/rest/v1/campaigns')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      if (url.includes('integrate.api.nvidia.com')) {
        nimCalls++
        return buildNimSuccessResponse()
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })

    // Prime the assistant cache.
    await callAnalyze()
    expect(nimCalls).toBe(1)
    expect(await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))).not.toBeNull()

    // Register a visit — the most common production trigger for invalidation.
    const visitRes = await fetchApp(
      new Request('http://localhost/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Key': `${TEST_BUSINESS_ID}:rawkey`,
        },
        body: JSON.stringify({ token: valid.token }),
      }),
    )
    expect(visitRes.status).toBe(201)

    // Cache should be gone.
    expect(await env.ANALYTICS_CACHE.get(analyzeCacheKey(TEST_BUSINESS_ID))).toBeNull()
  })
})
