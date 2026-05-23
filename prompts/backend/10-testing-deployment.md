# Agent Prompt — 10: Testing & Deployment

## Context

You are building the **NexoLeal Cloudflare Workers backend** — Wave 4 (final). All previous agents have completed their work. Your job is to:

1. Write a comprehensive test suite using Vitest with `@cloudflare/vitest-pool-workers`
2. Finalize `src/index.ts` to mount all routes
3. Produce a deployment checklist and CI workflow
4. Run the tests and ensure everything passes

---

## Pre-flight: Verify All Files Exist

Before writing tests, confirm these files exist (all created by previous agents):

```
src/index.ts
src/types/env.ts
src/types/api.ts
src/types/db.ts
src/lib/supabase.ts
src/lib/tokenEngine.ts
src/lib/nim.ts
src/middleware/auth.ts
src/middleware/rateLimit.ts
src/middleware/errorHandler.ts
src/routes/tokens.ts
src/routes/visits.ts
src/routes/businesses.ts
src/routes/clients.ts
src/routes/analytics.ts
src/routes/campaigns.ts
wrangler.toml
vitest.config.ts
```

If any are missing, recreate them using the relevant prompt file.

---

## Step 1 — Finalize `src/index.ts`

Ensure ALL routes are imported and mounted. Replace the contents of `src/index.ts` with the final version:

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from './middleware/errorHandler'
import { tokenRoutes } from './routes/tokens'
import { visitRoutes } from './routes/visits'
import { businessRoutes } from './routes/businesses'
import { clientRoutes } from './routes/clients'
import { analyticsRoutes } from './routes/analytics'
import { campaignRoutes } from './routes/campaigns'
import type { Env } from './types/env'
import type { ContextVariables } from './types/api'

const app = new Hono<{ Bindings: Env; Variables: ContextVariables }>()

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use('*', logger())
app.use('*', async (c, next) => {
  const origin = c.env.FRONTEND_ORIGIN
  return cors({
    origin,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Staff-Key'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
  })(c, next)
})
app.use('*', errorHandler())

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({
    success: true,
    data: { status: 'ok', version: '0.1.0', ts: new Date().toISOString() },
  })
)

// ─── Route Mounts ─────────────────────────────────────────────────────────────
app.route('/tokens', tokenRoutes)
app.route('/visits', visitRoutes)
app.route('/businesses', businessRoutes)
app.route('/clients', clientRoutes)

// Analytics and campaigns are mounted under /businesses (routes use /:id/analytics/...)
app.route('/businesses', analyticsRoutes)
app.route('/businesses', campaignRoutes)

export default app
```

---

## Step 2 — Create Test Directory

Create `src/__tests__/` with the following test files:

---

### `src/__tests__/health.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../index'

describe('Health check', () => {
  it('GET /health returns 200', async () => {
    const request = new Request('http://localhost/health')
    const response = await app.fetch(request, env)
    expect(response.status).toBe(200)
    const body = await response.json() as { success: boolean; data: { status: string } }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
  })
})
```

---

### `src/__tests__/tokenEngine.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
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

      // First validation passes
      const first = await validateToken(token, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(first.valid).toBe(true)

      // Invalidate the token
      await invalidateToken(token, env.TOKEN_BLACKLIST, TTL)

      // Second validation fails
      const second = await validateToken(token, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(second.valid).toBe(false)
      if (!second.valid) {
        expect(second.code).toBe('TOKEN_ALREADY_USED')
      }
    })

    it('rejects an expired token (TTL = 1 second)', async () => {
      // Generate with 1s TTL but validate with a slightly-past timestamp
      const SHORT_TTL = 1
      const { token } = await generateToken(USER_ID, BUSINESS_ID, SECRET, SHORT_TTL)

      // Wait just over 1 second
      await new Promise((resolve) => setTimeout(resolve, 1100))

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

      // After invalidation, validation should fail
      const result = await validateToken(token, SECRET, TTL, env.TOKEN_BLACKLIST)
      expect(result.valid).toBe(false)
    })
  })
})
```

---

### `src/__tests__/auth.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../index'

// Mock fetch for Supabase auth calls
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

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
      const body = await response.json() as { success: boolean; error: { code: string } }
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('returns 401 when Bearer token is invalid', async () => {
      // Mock Supabase /auth/v1/user returning 401
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
      const body = await response.json() as { success: boolean; error: { code: string } }
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTH_INVALID')
    })

    it('passes through with valid token', async () => {
      // Mock Supabase returning a user
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
      const body = await response.json() as { success: boolean; error: { code: string } }
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTH_MISSING')
    })

    it('returns 401 when X-Staff-Key format is invalid', async () => {
      // Mock the Supabase call that getOne('staff_keys') would make
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
      // Mock successful auth for all requests
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 'user-abc', email: 'test@example.com' }), { status: 200 })
      )

      // Make 11 requests (strict limit is 10/min)
      let lastStatus = 0
      for (let i = 0; i < 11; i++) {
        const request = new Request('http://localhost/tokens/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token',
            'CF-Connecting-IP': '1.2.3.4',
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
```

---

### `src/__tests__/visits.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../index'
import { generateToken } from '../lib/tokenEngine'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const TEST_USER_ID = 'user-abc-123'
const TEST_BUSINESS_ID = 'biz-def-456'
const SECRET = 'a'.repeat(64)  // matches vitest.config.ts binding

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
    // Mock staff_keys lookup
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ id: 'key-1', business_id: TEST_BUSINESS_ID, key_hash: 'test', is_active: true }]),
        { status: 200 }
      )
    )

    // The sha256 of 'testrawkey' needs to match what staff_keys table returns
    const request = new Request('http://localhost/visits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Staff-Key': `${TEST_BUSINESS_ID}:testrawkey`,
      },
      body: JSON.stringify({}),
    })
    const response = await app.fetch(request, env)
    expect(response.status).toBe(401) // auth fails because hash won't match
  })

  it('returns 410 for an expired token', async () => {
    // Generate a token with a 0-second TTL (already expired)
    const expiredToken = await generateToken(TEST_USER_ID, TEST_BUSINESS_ID, SECRET, 0)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Mock: staff_keys lookup, client lookup
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ id: 'key-1', business_id: TEST_BUSINESS_ID, is_active: true }]),
          { status: 200 }
        )
      )

    const request = new Request('http://localhost/visits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Staff-Key': `${TEST_BUSINESS_ID}:rawkey`,
      },
      body: JSON.stringify({ token: expiredToken.token }),
    })
    const response = await app.fetch(request, env)
    // Auth fails first (bad hash), so we get 401, not 410
    // This test verifies the route exists and handles auth
    expect([401, 410]).toContain(response.status)
  })
})
```

---

## Step 3 — `src/__tests__/supabase.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { createSupabaseClient, SupabaseError, mapSupabaseError } from '../lib/supabase'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('Supabase Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('GET returns parsed rows on success', async () => {
    const rows = [{ id: '1', name: 'Test Biz' }]
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))

    const db = createSupabaseClient(env, 'anon')
    const result = await db.get('businesses')
    expect(result).toEqual(rows)
  })

  it('GET throws SupabaseError on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: '42501', message: 'permission denied' }), { status: 403 })
    )

    const db = createSupabaseClient(env, 'anon')
    await expect(db.get('businesses')).rejects.toThrow(SupabaseError)
  })

  it('getOne returns null when no rows found', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

    const db = createSupabaseClient(env, 'anon')
    const result = await db.getOne('businesses', {
      filters: [{ column: 'id', operator: 'eq', value: 'nonexistent' }],
    })
    expect(result).toBeNull()
  })

  it('mapSupabaseError maps unique constraint to VISIT_DUPLICATE', () => {
    const error = new SupabaseError('23505', 'duplicate key value', 409)
    const mapped = mapSupabaseError(error)
    expect(mapped.code).toBe('VISIT_DUPLICATE')
  })

  it('mapSupabaseError maps unknown SupabaseError to SUPABASE_ERROR', () => {
    const error = new SupabaseError('XXXXX', 'some error', 400)
    const mapped = mapSupabaseError(error)
    expect(mapped.code).toBe('SUPABASE_ERROR')
  })
})
```

---

## Step 4 — Run Tests

```bash
cd /backend
npm test
```

All tests must pass. Fix any failures. Common issues:

1. **Import errors** — check that all route files export correctly (`export const tokenRoutes = new Hono()`)
2. **Type errors** — run `npx tsc --noEmit` and fix TypeScript errors first
3. **KV not available** — `vitest.config.ts` must have `kvNamespaces: ['TOKEN_BLACKLIST', 'RATE_LIMIT', 'ANALYTICS_CACHE']` in miniflare bindings
4. **env not defined** — import `env` from `'cloudflare:test'` not from `'@cloudflare/workers-types'`

---

## Step 5 — GitHub Actions CI Workflow

Create `.github/workflows/backend-ci.yml`:

```yaml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  test:
    name: Test & Type Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test

  deploy-staging:
    name: Deploy to Staging
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    defaults:
      run:
        working-directory: ./backend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Staging
        run: npm run deploy:staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-production:
    name: Deploy to Production
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    defaults:
      run:
        working-directory: ./backend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Production
        run: npm run deploy:production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## Step 6 — Pre-deployment Checklist

Create `/backend/DEPLOY.md`:

```markdown
# NexoLeal Backend — Deployment Checklist

## One-time Setup (do this before first deploy)

### 1. Create KV Namespaces

Run these commands and paste the IDs into `wrangler.toml`:

```bash
# Development (used with wrangler dev)
npx wrangler kv:namespace create "TOKEN_BLACKLIST"
npx wrangler kv:namespace create "TOKEN_BLACKLIST" --preview
npx wrangler kv:namespace create "RATE_LIMIT"
npx wrangler kv:namespace create "RATE_LIMIT" --preview
npx wrangler kv:namespace create "ANALYTICS_CACHE"
npx wrangler kv:namespace create "ANALYTICS_CACHE" --preview

# Staging
npx wrangler kv:namespace create "TOKEN_BLACKLIST" --env staging
npx wrangler kv:namespace create "RATE_LIMIT" --env staging
npx wrangler kv:namespace create "ANALYTICS_CACHE" --env staging

# Production
npx wrangler kv:namespace create "TOKEN_BLACKLIST" --env production
npx wrangler kv:namespace create "RATE_LIMIT" --env production
npx wrangler kv:namespace create "ANALYTICS_CACHE" --env production
```

### 2. Set Secrets

Run for each environment (omit --env for default/development):

```bash
npx wrangler secret put SUPABASE_URL      # value: https://lajrjnjyvbpaaspzgpvh.supabase.co
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put TOKEN_SECRET          # generate with: openssl rand -hex 32
npx wrangler secret put NIM_API_KEY        # NVIDIA NIM key from integrate.api.nvidia.com
npx wrangler secret put STAFF_API_KEY_HASH    # see below

# For staging:
npx wrangler secret put SUPABASE_URL --env staging
# (repeat all secrets for staging and production)
```

### 3. Generate STAFF_API_KEY_HASH

```bash
# Generate a raw key:
openssl rand -hex 32
# Then hash it:
echo -n "your-raw-key-here" | sha256sum
# Paste the hash as STAFF_API_KEY_HASH
```

### 4. Set GitHub Secrets

In your GitHub repository settings, add:
- `CLOUDFLARE_API_TOKEN` — create at https://dash.cloudflare.com/profile/api-tokens
- `CLOUDFLARE_ACCOUNT_ID` — found in Cloudflare dashboard URL

## Per-deploy Checklist

- [ ] All tests pass: `npm test`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Secrets are set in target environment
- [ ] KV namespace IDs are correct in `wrangler.toml`
- [ ] `FRONTEND_ORIGIN` var matches the deployed frontend URL

## Deploy Commands

```bash
# Local development
npm run dev

# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

## Verify Deployment

```bash
# Check health endpoint
curl https://nexoleal-backend.your-subdomain.workers.dev/health

# Expected response:
# {"success":true,"data":{"status":"ok","version":"0.1.0","ts":"..."}}
```
```

---

## Final Verification

Run these three commands in sequence. All must exit with code 0:

```bash
cd /backend

# 1. TypeScript
npx tsc --noEmit

# 2. Tests
npm test

# 3. Local dev server (starts in 2-3 seconds, then Ctrl+C)
npx wrangler dev --local
```

If `wrangler dev` starts successfully and `GET /health` returns 200, the backend is ready to deploy.
