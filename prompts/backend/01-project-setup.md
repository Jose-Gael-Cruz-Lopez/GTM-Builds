# Agent Prompt — 01: Project Setup

## Context

You are building the **NexoLeal Cloudflare Workers backend** — a loyalty engine for Latin American SMBs. This is Wave 1A of the build. Your job is to scaffold the complete project structure so all subsequent agents have a working foundation to build on.

**Do not** build any business logic. **Do** create every config file, directory, and entrypoint scaffold so the project compiles and `wrangler dev` starts without errors.

---

## Step 1 — Create the `/backend` directory at the project root

The repository root is the working directory. Create this exact structure:

```
/backend
  src/
    index.ts
    routes/
      .gitkeep
    middleware/
      errorHandler.ts
    lib/
      .gitkeep
    types/
      env.ts
      api.ts
  wrangler.toml
  package.json
  tsconfig.json
  vitest.config.ts
  .dev.vars.example
  .gitignore
```

---

## Step 2 — `package.json`

Create `/backend/package.json` with exactly these dependencies and scripts:

```json
{
  "name": "nexoleal-backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "hono": "^4.4.0"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.0",
    "@cloudflare/workers-types": "^4.20240529.0",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0",
    "wrangler": "^3.60.0"
  }
}
```

After writing this file, run `npm install` inside `/backend`.

---

## Step 3 — `tsconfig.json`

Create `/backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Step 4 — `wrangler.toml`

Create `/backend/wrangler.toml` with three environments (development is the default):

```toml
name = "nexoleal-backend"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

# ─── KV Namespaces ──────────────────────────────────────────────────────────
[[kv_namespaces]]
binding = "TOKEN_BLACKLIST"
id = "REPLACE_WITH_KV_ID"
preview_id = "REPLACE_WITH_PREVIEW_KV_ID"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "REPLACE_WITH_KV_ID_2"
preview_id = "REPLACE_WITH_PREVIEW_KV_ID_2"

[[kv_namespaces]]
binding = "ANALYTICS_CACHE"
id = "REPLACE_WITH_KV_ID_3"
preview_id = "REPLACE_WITH_PREVIEW_KV_ID_3"

# ─── Default Vars ────────────────────────────────────────────────────────────
[vars]
FRONTEND_ORIGIN = "http://localhost:5173"
TOKEN_TTL_SECONDS = "90"
RATE_LIMIT_WINDOW_SECONDS = "60"
RATE_LIMIT_MAX_REQUESTS = "60"

# ─── Staging Environment ─────────────────────────────────────────────────────
[env.staging]
name = "nexoleal-backend-staging"
vars = { FRONTEND_ORIGIN = "https://staging.nexoleal.com", TOKEN_TTL_SECONDS = "90", RATE_LIMIT_WINDOW_SECONDS = "60", RATE_LIMIT_MAX_REQUESTS = "60" }

[[env.staging.kv_namespaces]]
binding = "TOKEN_BLACKLIST"
id = "REPLACE_WITH_STAGING_KV_ID"

[[env.staging.kv_namespaces]]
binding = "RATE_LIMIT"
id = "REPLACE_WITH_STAGING_KV_ID_2"

[[env.staging.kv_namespaces]]
binding = "ANALYTICS_CACHE"
id = "REPLACE_WITH_STAGING_KV_ID_3"

# ─── Production Environment ──────────────────────────────────────────────────
[env.production]
name = "nexoleal-backend-production"
vars = { FRONTEND_ORIGIN = "https://app.nexoleal.com", TOKEN_TTL_SECONDS = "90", RATE_LIMIT_WINDOW_SECONDS = "60", RATE_LIMIT_MAX_REQUESTS = "60" }

[[env.production.kv_namespaces]]
binding = "TOKEN_BLACKLIST"
id = "REPLACE_WITH_PROD_KV_ID"

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT"
id = "REPLACE_WITH_PROD_KV_ID_2"

[[env.production.kv_namespaces]]
binding = "ANALYTICS_CACHE"
id = "REPLACE_WITH_PROD_KV_ID_3"
```

---

## Step 5 — `src/types/env.ts`

Create `/backend/src/types/env.ts`:

```typescript
export interface Env {
  // KV Namespaces
  TOKEN_BLACKLIST: KVNamespace;
  RATE_LIMIT: KVNamespace;
  ANALYTICS_CACHE: KVNamespace;

  // Secrets (set via: wrangler secret put SECRET_NAME)
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  TOKEN_SECRET: string;       // 256-bit hex string used for HMAC
  NIM_API_KEY: string;        // NVIDIA NIM API key (integrate.api.nvidia.com)
  STAFF_API_KEY_HASH: string; // SHA-256 hex hash of the raw staff API key

  // Configurable vars
  FRONTEND_ORIGIN: string;
  TOKEN_TTL_SECONDS: string;
  RATE_LIMIT_WINDOW_SECONDS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
}
```

---

## Step 6 — `src/types/api.ts`

Create `/backend/src/types/api.ts` with the shared response envelope and common types:

```typescript
// ─── Response Envelope ───────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Error Codes ─────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'AUTH_MISSING'
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'AUTH_FORBIDDEN'
  | 'RATE_LIMITED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_ALREADY_USED'
  | 'TOKEN_INVALID'
  | 'VISIT_DUPLICATE'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SUPABASE_ERROR'
  | 'NIM_ERROR'
  | 'INTERNAL_ERROR';

// ─── Hono Context Variables ───────────────────────────────────────────────────

export type ContextVariables = {
  userId: string;
  businessId: string;
  userRole: 'client' | 'staff' | 'admin';
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function err(code: ErrorCode, message: string): ApiError {
  return { success: false, error: { code, message } };
}

export function parsePagination(url: URL, defaultLimit = 20): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(defaultLimit), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
```

---

## Step 7 — `src/middleware/errorHandler.ts`

Create `/backend/src/middleware/errorHandler.ts`:

```typescript
import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types/env'
import { err } from '../types/api'

export function errorHandler(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      console.error('[errorHandler]', error)
      return c.json(err('INTERNAL_ERROR', 'An unexpected error occurred'), 500)
    }
  }
}
```

---

## Step 8 — `src/index.ts`

Create the root Hono entrypoint at `/backend/src/index.ts`. This is a scaffold — route imports will be filled in by other agents in later waves. Write it so it compiles now with placeholder comments:

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from './middleware/errorHandler'
import type { Env } from './types/env'
import type { ContextVariables } from './types/api'

// Route imports (added by Wave 2 and Wave 3 agents)
// import { tokenRoutes } from './routes/tokens'
// import { visitRoutes } from './routes/visits'
// import { businessRoutes } from './routes/businesses'
// import { clientRoutes } from './routes/clients'
// import { analyticsRoutes } from './routes/analytics'
// import { campaignRoutes } from './routes/campaigns'

const app = new Hono<{ Bindings: Env; Variables: ContextVariables }>()

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use('*', logger())
app.use('*', async (c, next) => {
  const origin = c.env.FRONTEND_ORIGIN
  return cors({ origin })(c, next)
})
app.use('*', errorHandler())

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({ success: true, data: { status: 'ok', version: '0.1.0', ts: new Date().toISOString() } })
)

// ─── Route Mounts (uncommented as agents complete each route file) ────────────
// app.route('/tokens', tokenRoutes)
// app.route('/visits', visitRoutes)
// app.route('/businesses', businessRoutes)
// app.route('/clients', clientRoutes)
// app.route('/campaigns', campaignRoutes)

export default app
```

---

## Step 9 — `.dev.vars.example`

Create `/backend/.dev.vars.example` (the actual `.dev.vars` is gitignored — developers copy this file):

```
# Copy this file to .dev.vars and fill in real values for local development
# NEVER commit .dev.vars to git

SUPABASE_URL=https://lajrjnjyvbpaaspzgpvh.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
TOKEN_SECRET=replace-with-256-bit-hex-string-generated-via-openssl-rand-hex-32
NIM_API_KEY=nvapi-...
STAFF_API_KEY_HASH=replace-with-sha256-hash-of-your-raw-staff-api-key
```

---

## Step 10 — `.gitignore`

Create `/backend/.gitignore`:

```
node_modules/
dist/
.wrangler/
.dev.vars
*.env
*.env.local
.DS_Store
```

---

## Step 11 — `vitest.config.ts`

Create `/backend/vitest.config.ts` (the full test suite is built by the Test agent in Wave 4, but the config must exist now):

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          kvNamespaces: ['TOKEN_BLACKLIST', 'RATE_LIMIT', 'ANALYTICS_CACHE'],
          bindings: {
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_ANON_KEY: 'test-anon-key',
            SUPABASE_SERVICE_KEY: 'test-service-key',
            TOKEN_SECRET: 'a'.repeat(64),
            NIM_API_KEY: 'test-nim-key',
            STAFF_API_KEY_HASH: 'test-hash',
            FRONTEND_ORIGIN: 'http://localhost:5173',
            TOKEN_TTL_SECONDS: '90',
            RATE_LIMIT_WINDOW_SECONDS: '60',
            RATE_LIMIT_MAX_REQUESTS: '60',
          },
        },
      },
    },
  },
})
```

---

## Step 12 — KV Namespace Creation Commands

Document these commands at the bottom of `wrangler.toml` as comments so the team knows what to run:

```toml
# ─── KV Setup Commands ───────────────────────────────────────────────────────
# Run once to create KV namespaces and paste the IDs above:
#
# npx wrangler kv:namespace create "TOKEN_BLACKLIST"
# npx wrangler kv:namespace create "TOKEN_BLACKLIST" --preview
# npx wrangler kv:namespace create "RATE_LIMIT"
# npx wrangler kv:namespace create "RATE_LIMIT" --preview
# npx wrangler kv:namespace create "ANALYTICS_CACHE"
# npx wrangler kv:namespace create "ANALYTICS_CACHE" --preview
#
# For staging/production, create separate namespaces:
# npx wrangler kv:namespace create "TOKEN_BLACKLIST" --env staging
# (etc.)
```

---

## Verification

After completing all steps, run:

```bash
cd /backend
npm install
npx tsc --noEmit
```

Both commands must exit with code 0 before this agent is done. Fix any TypeScript errors before finishing.
