# NexoLeal — Cloudflare Backend Orchestrator

## Your Role

You are the **orchestrator agent** for building the NexoLeal Cloudflare Workers backend. Your job is to read this file completely, understand the full system, then dispatch multiple specialized agents in parallel waves to build the backend simultaneously. Do not write code yourself — coordinate agents.

---

## Project Context

**NexoLeal** is a B2B2C digital loyalty engine for Latin American SMBs (barbershops, beauty salons, veterinary clinics, cafeterias, gyms). It replaces paper stamp cards with a secure, fraud-resistant digital loyalty system.

### Three User Personas

| Persona | Role | Auth Method |
|---------|------|-------------|
| **Cliente** | End customer earning stamps | Supabase JWT (Bearer token) |
| **Staff** | Business employee scanning QR codes | Hashed API key in `X-Staff-Key` header |
| **Admin** | Business owner viewing dashboard | Supabase JWT with `role: admin` claim |

### Core Flows

1. **Client generates QR** → `POST /tokens/generate` → receives HMAC-signed token with 90s TTL
2. **Staff scans QR** → `POST /tokens/validate` (anti-replay check) → `POST /visits` (registers visit, updates stamps)
3. **Reward unlock** → when stamps reach threshold, system auto-creates reward record + resets counter
4. **Admin dashboard** → reads analytics, views at-risk clients, triggers AI campaign generation
5. **NVIDIA NIM campaigns** → `POST /businesses/:id/campaigns/generate` → NVIDIA NIM (`llama-3.1-nemotron-70b-instruct`) returns 3 structured campaign suggestions

### Tech Stack

- **Runtime**: Cloudflare Workers (Node.js compat mode)
- **Framework**: Hono.js v4
- **Database**: Supabase (PostgreSQL via PostgREST REST API) — a teammate is building the Supabase side
- **Cache / Token blacklist / Rate limiting**: Cloudflare KV
- **AI**: NVIDIA NIM API (`nvidia/llama-3.1-nemotron-70b-instruct` via `https://integrate.api.nvidia.com/v1/chat/completions`)
- **Frontend**: Lovable (React + Vite + Tailwind) — hosted separately, calls this backend via CORS

### Repository Layout (backend lives at `/backend`)

```
/backend
  src/
    index.ts               ← Hono app entrypoint, middleware + route mounting
    routes/
      tokens.ts
      visits.ts
      businesses.ts
      clients.ts
      analytics.ts
      campaigns.ts
    middleware/
      auth.ts              ← JWT + API key guards
      rateLimit.ts         ← KV-based sliding window
      errorHandler.ts
    lib/
      supabase.ts          ← Typed REST client for Supabase PostgREST
      tokenEngine.ts       ← HMAC token generation + validation
      nim.ts               ← NVIDIA NIM API wrapper
    types/
      db.ts                ← TypeScript DB row types
      api.ts               ← Request/response envelope types
      env.ts               ← Cloudflare env bindings interface
  wrangler.toml
  package.json
  tsconfig.json
  vitest.config.ts
  .dev.vars                ← local secrets (gitignored)
```

---

## Shared Conventions — ALL agents must follow these

### Response Envelope

Every endpoint returns one of these two shapes. No exceptions.

```typescript
// Success
{ "success": true, "data": { /* payload */ } }

// Error
{ "success": false, "error": { "code": "SNAKE_CASE_CODE", "message": "Human readable" } }
```

### HTTP Status Codes

| Situation | Code |
|-----------|------|
| Success (read) | 200 |
| Success (created) | 201 |
| Validation error | 400 |
| Unauthenticated | 401 |
| Forbidden (wrong role) | 403 |
| Not found | 404 |
| Token expired | 410 |
| Rate limited | 429 |
| Server error | 500 |

### Environment Bindings (Hono context type)

All agents must use this `Env` interface from `src/types/env.ts`:

```typescript
export interface Env {
  // KV Namespaces
  TOKEN_BLACKLIST: KVNamespace;
  RATE_LIMIT: KVNamespace;
  ANALYTICS_CACHE: KVNamespace;

  // Secrets (set via wrangler secret put)
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  TOKEN_SECRET: string;
  NIM_API_KEY: string;        // NVIDIA NIM API key
  STAFF_API_KEY_HASH: string; // SHA-256 hash of the raw staff API key

  // Vars
  FRONTEND_ORIGIN: string;
  TOKEN_TTL_SECONDS: string; // "90"
  RATE_LIMIT_WINDOW_SECONDS: string; // "60"
  RATE_LIMIT_MAX_REQUESTS: string;   // "60"
}
```

### Hono App Type

```typescript
import { Hono } from 'hono'
import type { Env } from './types/env'

// Context variables passed through middleware
type Variables = {
  userId: string
  businessId: string
  userRole: 'client' | 'staff' | 'admin'
}

export type AppType = Hono<{ Bindings: Env; Variables: Variables }>
```

### Timestamps

All timestamps stored and returned as ISO 8601 UTC strings. Use `new Date().toISOString()`.

### Supabase Calls

All Supabase calls MUST go through the typed helper functions in `src/lib/supabase.ts`. Never call `fetch` to Supabase directly from route files.

### Error Codes Reference

```
AUTH_MISSING         - No auth header provided
AUTH_INVALID         - Token/key failed verification
AUTH_EXPIRED         - JWT or token is expired
AUTH_FORBIDDEN       - Valid auth but wrong role
RATE_LIMITED         - Too many requests
TOKEN_EXPIRED        - QR token past 90s TTL
TOKEN_ALREADY_USED   - Token already in KV blacklist
TOKEN_INVALID        - HMAC signature mismatch
VISIT_DUPLICATE      - Idempotency key already exists
NOT_FOUND            - Resource does not exist
VALIDATION_ERROR     - Request body failed schema check
SUPABASE_ERROR       - Upstream Supabase call failed
NIM_ERROR            - NVIDIA NIM API call failed
INTERNAL_ERROR       - Unexpected server error
```

---

## Parallel Execution Waves

Use the `dispatching-parallel-agents` skill. Dispatch agents in the following waves. Do NOT start Wave 2 until ALL Wave 1 agents have completed. Do NOT start Wave 3 until ALL Wave 2 agents have completed.

### Wave 1 — Foundation (run both simultaneously)

| Agent | Prompt File | Output |
|-------|-------------|--------|
| **Setup Agent** | `prompts/backend/01-project-setup.md` | Scaffolded `/backend` directory, `wrangler.toml`, `package.json`, `tsconfig.json`, `src/index.ts` |
| **Supabase Client Agent** | `prompts/backend/02-supabase-client.md` | `src/lib/supabase.ts`, `src/types/db.ts` |

**Wave 1 completion gate**: Both agents must have written their files to disk before Wave 2 starts.

### Wave 2 — Core Services (run all four simultaneously)

| Agent | Prompt File | Depends On | Output |
|-------|-------------|------------|--------|
| **Auth Agent** | `prompts/backend/03-auth-middleware.md` | Wave 1 | `src/middleware/auth.ts`, `src/middleware/rateLimit.ts` |
| **Token Agent** | `prompts/backend/04-qr-token-engine.md` | Wave 1 | `src/lib/tokenEngine.ts`, `src/routes/tokens.ts` |
| **Businesses Agent** | `prompts/backend/05-businesses-api.md` | Wave 1 | `src/routes/businesses.ts` |
| **Clients Agent** | `prompts/backend/06-clients-api.md` | Wave 1 | `src/routes/clients.ts` |

**Wave 2 completion gate**: All four route files and middleware must exist before Wave 3.

### Wave 3 — Business Logic (run all three simultaneously)

| Agent | Prompt File | Depends On | Output |
|-------|-------------|------------|--------|
| **Visits Agent** | `prompts/backend/07-visits-api.md` | Auth + Token + Clients | `src/routes/visits.ts` |
| **Analytics Agent** | `prompts/backend/08-analytics-api.md` | Auth + Businesses + Clients | `src/routes/analytics.ts` |
| **Campaigns Agent** | `prompts/backend/09-campaigns-api.md` | Auth + Businesses | `src/lib/nim.ts`, `src/routes/campaigns.ts` |

**Wave 3 completion gate**: All routes implemented and `src/index.ts` updated to mount all routes.

### Wave 4 — Quality (single agent)

| Agent | Prompt File | Output |
|-------|-------------|--------|
| **Test + Deploy Agent** | `prompts/backend/10-testing-deployment.md` | `vitest.config.ts`, `src/__tests__/`, CI workflow |

---

## Final Integration Step

After all 4 waves complete, verify `src/index.ts` mounts every route:

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { tokenRoutes } from './routes/tokens'
import { visitRoutes } from './routes/visits'
import { businessRoutes } from './routes/businesses'
import { clientRoutes } from './routes/clients'
import { analyticsRoutes } from './routes/analytics'
import { campaignRoutes } from './routes/campaigns'
import { errorHandler } from './middleware/errorHandler'
import type { Env } from './types/env'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: (origin, c) => c.env.FRONTEND_ORIGIN }))
app.use('*', errorHandler())

app.route('/tokens', tokenRoutes)
app.route('/visits', visitRoutes)
app.route('/businesses', businessRoutes)
app.route('/clients', clientRoutes)
app.route('/analytics', analyticsRoutes)  // analytics also mounted under /businesses/:id/analytics inside route file
app.route('/campaigns', campaignRoutes)

app.get('/health', (c) => c.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } }))

export default app
```

---

## How to Start

1. Read `prompts/backend/00-ORCHESTRATOR.md` (this file) — done
2. Load the `dispatching-parallel-agents` skill from `/Users/josegaelcruzlopez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/dispatching-parallel-agents/SKILL.md`
3. Dispatch Wave 1 agents simultaneously
4. Wait for Wave 1 to finish, then dispatch Wave 2
5. Wait for Wave 2 to finish, then dispatch Wave 3
6. Wait for Wave 3 to finish, then dispatch Wave 4
7. Run `wrangler dev` to verify the server starts without errors
