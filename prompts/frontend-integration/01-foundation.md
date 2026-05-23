# 01 — Foundation: Env, API client, Supabase reconfig

**Wave**: 1 (run alone, blocking)
**Working dir**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

The TanStack Start frontend at `frontend/` will consume the Cloudflare Workers backend at `https://nexoleal-backend.nexoleal.workers.dev`. Today the frontend has zero API client code and points its Supabase JS client at a **different** Supabase project than the backend uses. Both must point at the same project for JWTs to cross-validate.

- **Backend Supabase project**: `https://lajrjnjyvbpaaspzgpvh.supabase.co`
- **Frontend Supabase project (current)**: `https://jwnncyzjxxflncibntnq.supabase.co` ← must change

## Tasks

### 1. Install runtime dependencies

```bash
cd frontend
npm install qrcode.react html5-qrcode
```

Confirm `package.json` lists them under `dependencies`.

### 2. Reconcile Supabase project

Update `frontend/.env`:

```text
SUPABASE_URL="https://lajrjnjyvbpaaspzgpvh.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<paste the anon key from backend/.dev.vars>"
VITE_SUPABASE_URL="https://lajrjnjyvbpaaspzgpvh.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<same anon key>"
VITE_SUPABASE_PROJECT_ID="lajrjnjyvbpaaspzgpvh"
VITE_API_URL="https://nexoleal-backend.nexoleal.workers.dev"
```

The anon key is the JWT in `backend/.dev.vars` under `SUPABASE_ANON_KEY=`. Copy it verbatim.

Also create `frontend/.env.example` mirroring the keys with placeholder values (no secrets):

```text
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="REPLACE_ME"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="REPLACE_ME"
VITE_SUPABASE_PROJECT_ID="your-project"
VITE_API_URL="https://nexoleal-backend.nexoleal.workers.dev"
```

Confirm `.env` is in `.gitignore` (it already is).

### 3. Regenerate Supabase types from the real schema

Replace `frontend/src/integrations/supabase/types.ts` with types that mirror the backend's `supabase-schema.sql`. The minimal set needed by the frontend is `businesses`, `clients`, `loyalty_configs`, `visits`, `campaigns`, plus `auth.users` references. Use exact column names (snake_case) and types from `backend/src/types/db.ts`. Do NOT keep the old `business_signups` table type — that table is no longer used.

### 4. Create the API client

Create `frontend/src/lib/api-client.ts`:

```ts
import { supabase } from '@/integrations/supabase/client'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://nexoleal-backend.nexoleal.workers.dev'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export interface ApiSuccess<T> { success: true; data: T }
export interface ApiFailure {
  success: false
  error: { code: string; message: string }
}

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  staffKey?: boolean   // if true, attach X-Staff-Key from localStorage
  timeoutMs?: number
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, staffKey, timeoutMs = 8000, headers, ...rest } = options
  const finalHeaders = new Headers(headers)
  finalHeaders.set('Content-Type', 'application/json')

  // Attach Supabase JWT when present (no error if logged out — caller decides)
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    finalHeaders.set('Authorization', `Bearer ${session.access_token}`)
  }

  if (staffKey) {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('nexoleal:staff-key') : null
    if (stored) finalHeaders.set('X-Staff-Key', stored)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeout)
    if ((e as Error).name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'La petición tardó demasiado. Intenta de nuevo.', 0)
    }
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar al servidor.', 0)
  }
  clearTimeout(timeout)

  // 204 No Content
  if (res.status === 204) return undefined as T

  let parsed: ApiSuccess<T> | ApiFailure
  try {
    parsed = await res.json()
  } catch {
    throw new ApiError('INVALID_RESPONSE', `Respuesta inválida (HTTP ${res.status})`, res.status)
  }

  if (!parsed.success) {
    throw new ApiError(parsed.error.code, parsed.error.message, res.status)
  }
  return parsed.data
}
```

### 5. Create resource-scoped API helpers

Create `frontend/src/lib/api/tokens.ts`:

```ts
import { apiFetch } from '../api-client'

export interface GenerateTokenRequest { businessId: string }
export interface GenerateTokenResponse {
  token: string
  expiresAt: string
  ttlSeconds: number
}

export const tokensApi = {
  generate: (body: GenerateTokenRequest) =>
    apiFetch<GenerateTokenResponse>('/tokens/generate', { method: 'POST', body }),
}
```

Create `frontend/src/lib/api/businesses.ts` with:

- `create({ name, category, plan?, stampsRequired?, rewardDescription? })` → `POST /businesses`
- `get(id)` → `GET /businesses/:id`
- `update(id, patch)` → `PATCH /businesses/:id`
- `getLoyaltyConfig(id)` → `GET /businesses/:id/loyalty-config`
- `updateLoyaltyConfig(id, patch)` → `PATCH /businesses/:id/loyalty-config`
- `createStaffKey(id, { label })` → `POST /businesses/:id/staff-keys`
- `listStaffKeys(id)` → `GET /businesses/:id/staff-keys`
- `deleteStaffKey(id, keyId)` → `DELETE /businesses/:id/staff-keys/:keyId`
- `getStatsSummary(id)` → `GET /businesses/:id/stats/summary`

Create `frontend/src/lib/api/clients.ts` with:

- `register({ fullName, phone?, email?, businessId? })` → `POST /clients`
- `getMe()` → `GET /clients/me`
- `getLoyalty(businessId)` → `GET /clients/me/loyalty/:businessId`
- `listLoyaltyCards()` → `GET /clients/me/loyalty`

Create `frontend/src/lib/api/visits.ts`:

- `register({ token, notes? }, { staffKey: true })` → `POST /visits`
- `listMine(params?)` → `GET /visits/me/visits`

Create `frontend/src/lib/api/analytics.ts`:

- `retention(businessId)` → `GET /businesses/:id/retention`
- `visits(businessId, days?)` → `GET /businesses/:id/visits?days=`
- `clients(businessId)` → `GET /businesses/:id/clients`
- `peakHours(businessId)` → `GET /businesses/:id/peak-hours`
- `churnRisk(businessId)` → `GET /businesses/:id/churn-risk`

Create `frontend/src/lib/api/campaigns.ts`:

- `generate(businessId)` → `POST /businesses/:id/campaigns/generate`
- `list(businessId, status?)` → `GET /businesses/:id/campaigns?status=`
- `get(businessId, campaignId)` → `GET /businesses/:id/campaigns/:campaignId`
- `activate(businessId, campaignId)` → `POST /businesses/:id/campaigns/:campaignId/activate`
- `update(businessId, campaignId, patch)` → `PATCH /businesses/:id/campaigns/:campaignId`

Each helper file must be small (≤80 lines) and just wrap `apiFetch` with typed request/response interfaces. The exact shapes come from the API reference in `prompts/frontend-integration/00-ORCHESTRATOR.md` (or you can re-read `backend/src/routes/*.ts` to confirm).

### 6. Business category mapping

Create `frontend/src/lib/business-categories.ts`:

```ts
export type BusinessCategory = 'barbershop' | 'salon' | 'vet' | 'cafe' | 'gym' | 'other'

export const BUSINESS_CATEGORY_OPTIONS: Array<{ label: string; value: BusinessCategory }> = [
  { label: 'Cafetería', value: 'cafe' },
  { label: 'Restaurante', value: 'other' },
  { label: 'Barbería', value: 'barbershop' },
  { label: 'Salón de belleza', value: 'salon' },
  { label: 'Tienda de mascotas', value: 'vet' },
  { label: 'Tienda minorista', value: 'other' },
  { label: 'Gimnasio', value: 'gym' },
  { label: 'Otro', value: 'other' },
]

export function mapBusinessTypeLabel(category: BusinessCategory): string {
  const found = BUSINESS_CATEGORY_OPTIONS.find((o) => o.value === category)
  return found?.label ?? 'Negocio'
}
```

### 7. Session hook

Create `frontend/src/hooks/use-session.ts`:

```ts
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, isLoading } as {
    session: Session | null
    user: User | null
    isLoading: boolean
  }
}
```

### 8. Smoke test

After writing all the above, run:

```bash
cd frontend
npm run dev
```

The dev server should boot at `http://localhost:5173` (or whatever Vite picks) with no TypeScript errors.

Open the landing page in the browser and confirm:
- Page renders
- DevTools console has no missing-env or 404 errors
- `import.meta.env.VITE_API_URL` is reachable (verify by typing the URL in the address bar: should return `{"success":true,"data":{...}}` from `/health`)

## Files this prompt creates or modifies

- **Modified**: `frontend/.env`, `frontend/package.json`
- **Created**: `frontend/.env.example`, `frontend/src/lib/api-client.ts`, `frontend/src/lib/api/*.ts` (6 files), `frontend/src/lib/business-categories.ts`, `frontend/src/hooks/use-session.ts`
- **Modified**: `frontend/src/integrations/supabase/types.ts`

Do NOT modify any route file, signup, onboarding, or root layout yet. Those are Wave 2/3.

## Done when

- `npm run dev` boots clean
- `npx tsc --noEmit` (or whatever the project uses) reports zero errors in the new files
- A quick sanity check in the browser console:
  ```js
  await (await fetch(import.meta.env.VITE_API_URL + '/health')).json()
  // → { success: true, data: { status: 'ok', ... } }
  ```
