# Frontend Integration — Orchestrator

## Goal

Connect the existing TanStack Start frontend at `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend` to the live Cloudflare Workers backend at `https://nexoleal-backend.nexoleal.workers.dev`.

The frontend today is mostly static marketing + one Supabase-direct signup form. The backend exposes 33 routes with auth (Bearer JWT + X-Staff-Key) and a `{ success, data | error }` envelope. We need to:

1. Reconcile the two Supabase projects (frontend uses `jwnncyzjxxflncibntnq`, backend uses `lajrjnjyvbpaaspzgpvh`) so JWTs cross-validate.
2. Build a typed API client.
3. Wire signup → real auth + `POST /businesses`.
4. Wire onboarding → `PATCH /businesses/:id/loyalty-config` and staff key creation.
5. Build new routes: `/login`, `/dashboard/$businessId`, `/wallet`, `/wallet/$businessId`, `/scan`, `/campaigns/$businessId`.
6. Update backend CORS to allow the deployed frontend origin.

## Stack constraints (must respect)

| Layer | Tech (already chosen) |
|---|---|
| Framework | **TanStack Start** (NOT plain Vite SPA — has SSR + Cloudflare deploy) |
| Routing | TanStack Router file-based (`src/routes/`) |
| State / data | **React Query** (already configured in `src/router.tsx`) |
| Forms | `useState` + Zod (signup) or react-hook-form (installed) |
| UI | Tailwind v4 + shadcn/ui (`src/components/ui/`) |
| Auth | `@supabase/supabase-js` (already installed) |
| Toasts | sonner (`src/components/ui/sonner.tsx`) |
| Icons | lucide-react |

**Never add**: axios, SWR, Zustand, Redux. Use what's already installed.

## Execution plan — 4 waves

```
WAVE 1 — Foundation (run alone, blocking)
  └── 01-foundation.md
        env, API client, Supabase reconfig, types mirror, npm install qrcode.react + html5-qrcode

WAVE 2 — Auth surface (run in parallel after Wave 1)
  ├── 02-auth-flows.md         → /login, signup rewrite, navbar
  └── 03-onboarding-persistence.md → /onboarding wired to backend

WAVE 3 — Feature surfaces (run all 4 in parallel after Wave 2)
  ├── 04-admin-dashboard.md    → /dashboard/$businessId
  ├── 05-client-wallet.md      → /wallet + /wallet/$businessId with QR
  ├── 06-staff-scanner.md      → /scan with html5-qrcode
  └── 07-campaigns.md          → /campaigns/$businessId

WAVE 4 — Ship (run alone after Wave 3)
  └── 08-cors-and-deploy.md    → backend CORS update + frontend wrangler deploy
```

## Shared conventions (all sub-agents follow)

### File creation rules

- Every new route is a single file under `frontend/src/routes/`. File-based routing means the filename IS the URL. `routeTree.gen.ts` regenerates automatically on `vite dev` — never edit it manually.
- Hooks live under `frontend/src/hooks/`. One concern per file.
- API endpoint wrappers live under `frontend/src/lib/api/`. One file per resource (`tokens.ts`, `businesses.ts`, `clients.ts`, `visits.ts`, `analytics.ts`, `campaigns.ts`).
- Component primitives stay in `frontend/src/components/ui/` (shadcn). Feature components go in `frontend/src/components/<feature>/`.

### API request convention

Every API call goes through `apiFetch<T>(path, options?)` from `src/lib/api-client.ts`. Never call `fetch()` directly inside a route or component. The client handles:

- Base URL from `import.meta.env.VITE_API_URL`
- `Authorization: Bearer <session.access_token>` injection from Supabase session
- `X-Staff-Key` injection from localStorage when needed (`apiFetch(path, { staffKey: true })`)
- Envelope unwrapping: returns `data` on success, throws `ApiError` on failure
- Network timeouts (8s default)

### React Query convention

- All GET endpoints use `useQuery` with the key pattern `['<resource>', ...identifiers]`. Example: `['business', businessId, 'stats']`.
- All POST/PATCH/DELETE use `useMutation` with `invalidateQueries` on the relevant key prefix.
- A query that depends on auth uses `enabled: !!session` to defer fetch until login completes.

### Error handling convention

- API failures show a sonner toast with the error `message` from the backend envelope.
- 401 `AUTH_INVALID` / `AUTH_MISSING` → redirect to `/login`.
- 403 `AUTH_FORBIDDEN` → toast "No tienes permiso para esta acción" and stay on page.
- Validation errors render inline next to the offending field when possible.

### Spanish-first UI

- All user-facing strings are in Spanish (matching existing landing).
- Toast messages, button labels, errors: Spanish.
- Variable names and code comments: English.

### Auth state hook

Each sub-agent uses `useSession()` from `src/hooks/use-session.ts` (created in Wave 1) to read the current Supabase session. Pattern:

```ts
const { session, user, isLoading } = useSession()
```

### Protected route pattern

```ts
export const Route = createFileRoute('/dashboard/$businessId')({
  beforeLoad: async ({ params }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: `/dashboard/${params.businessId}` } })
  },
  component: DashboardPage,
})
```

## Acceptance criteria for the whole integration

1. ✅ `npm run dev` boots without errors.
2. ✅ A new user can: sign up → land on onboarding → set loyalty config → land on dashboard.
3. ✅ A logged-in client can: open `/wallet` → see their loyalty cards → generate a live QR code.
4. ✅ A staff member can: open `/scan` → scan a QR → register a visit (consumes the token).
5. ✅ A business owner can: open `/dashboard/$businessId` → see live stats from the API.
6. ✅ Generating a campaign at `/campaigns/$businessId` returns 3 NIM-generated drafts.
7. ✅ Browser DevTools Network tab shows all requests going to `https://nexoleal-backend.nexoleal.workers.dev`.
8. ✅ The deployed frontend origin is in the backend's CORS allow-list.

## What success looks like

After Wave 4, pushing the frontend to Cloudflare Pages and the backend to Workers gives a **fully working three-sided product** (client wallet + staff scanner + admin dashboard) running on real data through the live NIM-powered API.
