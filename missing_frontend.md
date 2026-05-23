# NexoLeal — Frontend Gap Analysis & Build Roadmap

**Document purpose:** Complete inventory of what the frontend still needs to build, fix, or polish before NexoLeal feels like a shippable SaaS product.

**Last updated:** 2026-05-23  
**Repo:** [GTM-Builds](https://github.com/Jose-Gael-Cruz-Lopez/GTM-Builds)  
**Live frontend:** https://tanstack-start-app.nexoleal.workers.dev  
**Live backend:** https://nexoleal-backend.nexoleal.workers.dev  

---

## Executive summary

The frontend integration pass delivered a **working skeleton** (~40% of a shippable product):

- Landing page, signup, login, partial onboarding, basic admin dashboard, client wallet with QR, staff scanner, and AI campaign drafts are all wired to the live Cloudflare Workers API.

However, **most of what makes it feel like a real SaaS is still missing**: role separation, client join flows, settings, client/visit management, campaign sending, landing polish, auth recovery, and several backend endpoints that exist but are either broken or have no UI.

This document is the single source of truth for what remains.

---

## Tech stack (current)

| Layer | Choice |
|---|---|
| Framework | TanStack Start (SSR on Vite 7, Cloudflare Workers deploy) |
| Routing | TanStack Router (file-based, `frontend/src/routes/`) |
| Data fetching | React Query (`useQuery` / `useMutation`) |
| Auth | Supabase JS (`@supabase/supabase-js`) — JWT sent as `Authorization: Bearer` |
| API client | `frontend/src/lib/api-client.ts` → `VITE_API_URL` |
| UI | Tailwind v4 + shadcn/ui |
| QR | `qrcode.react` (client wallet), `html5-qrcode` (staff scanner) |
| Charts | `recharts` (dashboard only) |

**Env vars required (`frontend/.env`):**

```text
VITE_SUPABASE_URL=https://lajrjnjyvbpaaspzgpvh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_API_URL=https://nexoleal-backend.nexoleal.workers.dev
```

---

## What exists today

### Routes implemented

| Route | File | Status | Notes |
|---|---|---|---|
| `/` | `src/routes/index.tsx` | ✅ Built | Static marketing landing |
| `/signup` | `src/routes/signup.tsx` | ✅ Built | Supabase Auth + `POST /businesses` |
| `/login` | `src/routes/login.tsx` | ✅ Built | Email/password only |
| `/onboarding` | `src/routes/onboarding.tsx` | ⚠️ Partial | Reward config + staff key; brand step is placeholder |
| `/dashboard/$businessId` | `src/routes/dashboard.$businessId.tsx` | ⚠️ Partial | KPIs, visits chart, client breakdown, churn list |
| `/wallet` | `src/routes/wallet.index.tsx` | ⚠️ Partial | Loyalty card list + one-time name registration |
| `/wallet/$businessId` | `src/routes/wallet.$businessId.tsx` | ⚠️ Partial | Progress bar + QR generation (`POST /tokens/generate`) |
| `/scan` | `src/routes/scan.tsx` | ✅ Built | Camera scanner + `POST /visits` with `X-Staff-Key` |
| `/campaigns/$businessId` | `src/routes/campaigns.$businessId.tsx` | ⚠️ Partial | Generate/edit/activate/archive — no actual sending |

### API modules implemented (`frontend/src/lib/api/`)

| Module | Endpoints wrapped |
|---|---|
| `tokens.ts` | `POST /tokens/generate` |
| `businesses.ts` | CRUD business, loyalty config, staff keys, stats summary |
| `clients.ts` | Register, get me, loyalty cards, loyalty by business |
| `visits.ts` | Register visit (staff), list my visits |
| `analytics.ts` | retention, visits, clients, peak-hours, churn-risk |
| `campaigns.ts` | generate, list, get, activate, update |

### Components by feature area

- **Landing:** `Navbar`, `Hero`, `HowItWorks`, `Benefits`, `Testimonials`, `FinalCTA`, `Footer`
- **Dashboard:** `DashboardHeader`, `StatCard`, `VisitsChart`, `ClientsBreakdown`, `ChurnRiskList`
- **Wallet:** `LoyaltyCardPreview`
- **Campaigns:** `CampaignCard`, `CampaignEditDialog`

---

## Critical bugs & backend blockers

These affect the frontend even before new pages are built.

### 1. `GET /businesses/:id` returns 404 for valid businesses

**Location:** `backend/src/routes/businesses.ts` line 76–92  
**Cause:** Route uses `createSupabaseClient(env, 'anon')` which is subject to Supabase RLS. Business rows exist (service role can read them) but anon key cannot.  
**Frontend impact:** Dashboard `businessesApi.get(businessId)` fails; business name in header may be blank.  
**Fix:** Use service role in this route, or add RLS policy allowing authenticated users to read active businesses.

### 2. Admin client/visit list routes are mis-mounted

**Documented in backend, broken in practice:**

| Intended route | Actual mount | Problem |
|---|---|---|
| `GET /businesses/:businessId/clients` | `GET /clients/businesses-clients?businessId=` | `requireAdmin()` reads `:id` from path — not present → 400 |
| `GET /businesses/:businessId/clients/at-risk` | `GET /clients/at-risk?businessId=` | Same issue |
| `GET /businesses/:businessId/visits` | `GET /visits/business-visits?businessId=` | Same issue |

**Fix (backend):** Remount under `/businesses/:id/clients` etc., or update `requireAdmin()` to accept `businessId` from query params.  
**Fix (frontend):** Build admin UI only after backend routes are corrected.

### 3. Supabase `getOne` was broken (fixed 2026-05-23)

Two bugs in `backend/src/lib/supabase.ts` caused all admin routes to return 403:

- Accept header typo: `pgsuite` → `pgrst`
- Single-object response parsed as array (`rows[0]` on object → always `null`)

**Status:** Fixed and deployed. Admin routes (stats, staff keys, loyalty PATCH) now work.

### 4. No role separation in auth

Business owners and end-customers share the same Supabase auth.users table and JWT. There is no:

- `user_metadata.role` or separate signup flows
- Post-login routing based on whether the user owns a business
- Guard preventing owners from seeing client-only views or vice versa

**Current behavior:** Login redirects to `/wallet` unless `localStorage['nexoleal:current-business-id']` is set — owners often land on the wrong page.

### 5. Email confirmation blocks signup

**Location:** `frontend/src/routes/signup.tsx` lines 116–122  
If Supabase project has email confirmation enabled, `signUpData.session` is null → user sees toast *"Te enviamos un correo..."* and **never** calls `POST /businesses`. Business is never created.  
**Fix:** Handle post-confirmation redirect, or use admin API in dev, or disable email confirm in Supabase for MVP.

---

## P0 — Core product gaps (build first)

Users will feel these immediately. Highest impact.

### P0.1 Auth & routing

| Task | Description | Files to create/modify |
|---|---|---|
| Role-aware login redirect | After login: if user owns a business → `/dashboard/$id`; if client only → `/wallet` | `login.tsx`, new hook `useOwnedBusiness()` |
| Fetch owned business on login | `GET /businesses` doesn't exist — need `GET /businesses/:id` fix OR query Supabase `businesses` where `owner_id = user.id` | `lib/api/businesses.ts`, `hooks/use-owned-business.ts` |
| Forgot password | `/forgot-password` + Supabase `resetPasswordForEmail` | New route `forgot-password.tsx`, link from login |
| Reset password | `/reset-password` handling Supabase redirect hash | New route `reset-password.tsx` |
| Email verification callback | Handle `?code=` or hash from Supabase confirm email, then create business if pending | `signup.tsx`, new route `auth/callback.tsx` |
| Sign out everywhere | Ensure all app shells use `signOut()` from `lib/auth.ts` | Dashboard, wallet, campaigns headers |
| Protected route guard component | Reusable `requireAuth({ role: 'admin' \| 'client' })` | `lib/auth-guards.ts` |

### P0.2 Client join flow

Clients cannot discover or join a business today. The only way to get a loyalty card is if `clientsApi.register({ businessId })` was called during signup (it isn't) or loyalty link is auto-created on first wallet visit to a known `businessId`.

| Task | Description |
|---|---|
| **`/join/$businessId`** | Public page: business name, reward description, "Unirme" button → Supabase signup/login → `clientsApi.register({ fullName, businessId })` |
| **Business join QR** | Static QR encoding `https://app.../join/$businessId` — distinct from the rotating visit token QR |
| **Printable QR asset** | Download PNG/PDF from dashboard or onboarding step 3 |
| **Share link copy button** | "Copia enlace para clientes" on dashboard |

**Backend:** Join page can use public `GET /businesses/:id/loyalty-config` (after RLS fix) for reward preview without auth.

### P0.3 Onboarding completion

| Step | Current | Needed |
|---|---|---|
| 1 — Brand | Placeholder text *"Pronto podrás subir tu logo..."* | Logo upload (Supabase Storage), primary color picker, loyalty card preview |
| 2 — Reward | ✅ Works | — |
| 3 — Finish | Shows staff key + links | Add join QR for customers, printable download, "Compartir con clientes" CTA |

### P0.4 Fix business profile fetch

Until `GET /businesses/:id` works for authenticated users, dashboard header and join page cannot show business name reliably.

**Options:**
1. Backend: switch to service role for read
2. Backend: add RLS policy `SELECT businesses WHERE is_active = true` for authenticated
3. Frontend workaround: store business name in localStorage at signup (fragile)

---

## P1 — Admin features (backend mostly ready, frontend missing)

### P1.1 Settings page — `/settings/$businessId`

New route with tabs:

| Tab | API | UI |
|---|---|---|
| **General** | `PATCH /businesses/:id` | Edit name, view plan, deactivate business |
| **Loyalty program** | `GET/PATCH .../loyalty-config` | Stamps required slider, reward description |
| **Staff devices** | `GET/POST/DELETE .../staff-keys` | List keys, create new, revoke, last-used timestamp |
| **Account** | Supabase auth | Change password, email, delete account |

**API already in** `frontend/src/lib/api/businesses.ts` — only UI missing.

### P1.2 Client list — `/dashboard/$businessId/clients`

**Requires backend route fix first.**

| Column | Source |
|---|---|
| Name | `fullName` |
| Stamps | `stampCount / stampsRequired` |
| Status | active / at_risk / lost badge |
| Last visit | `lastVisitAt` |
| Total visits | `totalVisits` |

Features: search, filter by status, pagination (`page`, `limit` query params), click row → client detail.

**Backend:** `GET /clients/businesses-clients?businessId=&page=&limit=&status=` (currently broken — see Critical bugs).

### P1.3 Visit feed — `/dashboard/$businessId/visits`

**Requires backend route fix first.**

Table of recent visits: client name, timestamp, reward unlocked yes/no, staff device.  
Date range filter (`from`, `to` query params).

**Backend:** `GET /visits/business-visits?businessId=&from=&to=&limit=&offset=` (currently broken).

### P1.4 Dashboard analytics expansion

API clients exist in `analytics.ts` but are **not used** in the dashboard UI:

| Endpoint | Suggested UI |
|---|---|
| `GET /businesses/:id/retention` | 30/60/90-day retention bar chart |
| `GET /businesses/:id/peak-hours` | 7×24 heatmap grid (busiest day/hour) |
| `GET /businesses/:id/clients` | Already partially used via `clientsBreakdown` — add "new last 7/30 days" KPIs |

### P1.5 Rewards & redemptions

**Backend:** `rewards` table exists; visits route creates reward rows when `rewardUnlocked: true`.  
**Frontend:** No page to view pending redemptions or mark as redeemed.

| Task | Description |
|---|---|
| Redemptions inbox | List clients who unlocked reward, mark fulfilled |
| Reward history | Per-client list of earned rewards |

**May need new backend endpoint:** `GET /businesses/:id/rewards?status=pending`.

### P1.6 Multi-business support

If one Supabase user owns multiple businesses (not prevented today):

- Business switcher in `DashboardHeader`
- Store selected business in localStorage / URL param
- List businesses: needs `GET /businesses/mine` backend route (does not exist)

---

## P2 — Client wallet gaps

### P2.1 Visit history

**API exists:** `visitsApi.listMine({ businessId?, limit, offset })` in `lib/api/visits.ts`  
**UI:** Not built.

Add to `/wallet/$businessId`: scrollable list of past visits with dates.

### P2.2 Reward unlocked UX

When scanner registers a visit that unlocks a reward (`rewardUnlocked: true`), the wallet should:

- Show celebration modal / confetti
- Display redeem instructions from `rewardDescription`
- Track `totalRewards` count (already in loyalty API response)

### P2.3 Profile management

Current: one-time name dialog on first `/wallet` visit.  
Missing:

- Edit full name, phone, email via `clientsApi.register` PATCH path or new endpoint
- Profile page at `/wallet/profile`

### P2.4 Join from wallet

If user has zero cards, show:

- "¿Tienes un código de negocio?" input for businessId
- Link to `/join/$businessId`
- Scan business join QR (optional)

---

## P3 — Campaigns (looks done, isn't)

### What works today

- `POST /businesses/:id/campaigns/generate` → 3 NIM/fallback drafts
- List by status (draft / active / sent / archived)
- Edit title, message, timing, expected lift
- Activate (status → `active`)
- Archive

### What's missing

| Task | Description |
|---|---|
| **Actual sending** | "Activar" only changes DB status. No SMS, email, or WhatsApp integration |
| **Audience preview** | Show count: "23 clientes en riesgo recibirán este mensaje" before activate |
| **Campaign stats UI** | `GET .../campaigns/:id/stats` returns `sentCount: null` — wire UI when backend implements tracking |
| **Copy to WhatsApp** | MVP: "Abrir WhatsApp" with pre-filled message for manual send |
| **Schedule send** | `sendTiming` field exists but no scheduler/cron |
| **Segment filter UI** | Edit `targetSegment` (at_risk / lost / all / frequent) in edit dialog |

**Backend note:** Campaign stats endpoint explicitly returns:

```json
{
  "note": "Full campaign tracking coming in a future release"
}
```

---

## P4 — Landing & marketing polish

Original Lovable plan (`frontend/.lovable/plan.md`) vs current:

| Planned section | Status |
|---|---|
| Navbar with Precios link | ❌ No pricing link |
| Hero + mockup | ✅ Built |
| "Ver demo" CTA | ❌ Button exists, does nothing |
| "Usado por +500 negocios" strip | ❌ Not built |
| Cómo funciona (3 steps) | ✅ Built |
| Beneficios (2×2 grid) | ✅ Built |
| Testimonios (2 fake) | ⚠️ Static hardcoded quotes |
| CTA final | ✅ Built |
| Footer | ⚠️ Missing Terms, Privacy, contact |
| Pricing section | ❌ Not built |
| Mobile hamburger nav | ❌ Nav links hidden on `md` breakpoint |
| JSON-LD SEO | ✅ Partially in `index.tsx` |
| Root meta "Lovable App" | ⚠️ Still in `__root.tsx` default head |

### Landing tasks

1. Wire "Ver demo" → `/join/demo` or embedded video / interactive wallet preview
2. Add `#precios` section with Free vs Pro plans (matches backend `plan: 'free' | 'pro'`)
3. Add social proof strip below hero
4. Replace fake testimonials with real ones or remove claims
5. Footer: `/terms`, `/privacy`, contact email
6. Spanish 404 page (currently English in `__root.tsx`)
7. Logged-in navbar: show "Mi panel" link when user owns a business

---

## P5 — Infrastructure & quality

| Item | Status | Action |
|---|---|---|
| Frontend CI/CD | ❌ | Add `.github/workflows/frontend-ci.yml` — typecheck, build, `wrangler deploy` |
| Cloudflare env vars in deploy | ❌ | Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL` in Workers/Pages |
| Supabase auth middleware | ❌ Unused | `auth-attacher.ts` + `auth-middleware.ts` scaffolded but not registered in `start.ts` |
| E2E tests | ❌ | Playwright: signup → onboard → scan flow |
| Component tests | ❌ | Vitest + Testing Library for forms |
| Error monitoring | ❌ | Sentry or similar |
| Rate limit UX | ❌ | Show `Retry-After` from 429 responses in toasts |
| Loading/error boundaries | ⚠️ Partial | Generic error in `__root.tsx` only |
| Accessibility audit | ❌ | Scanner needs aria labels; forms need focus management |
| PWA / offline | ❌ | Service worker for wallet (optional) |

---

## Backend API coverage matrix

Legend: ✅ UI built · ⚠️ API client only · ❌ Not wired · 🔴 Backend broken

### Tokens

| Method | Path | Auth | Frontend |
|---|---|---|---|
| POST | `/tokens/generate` | Client JWT | ✅ Wallet QR |
| POST | `/tokens/validate` | X-Staff-Key | ❌ (staff uses /visits directly) |
| POST | `/tokens/invalidate` | X-Staff-Key | ❌ |

### Businesses

| Method | Path | Auth | Frontend |
|---|---|---|---|
| POST | `/businesses` | Any JWT | ✅ Signup |
| GET | `/businesses/:id` | Any JWT | ⚠️ Broken (RLS) |
| PATCH | `/businesses/:id` | Admin | ❌ No settings UI |
| GET | `/businesses/:id/loyalty-config` | Any JWT | ❌ |
| PATCH | `/businesses/:id/loyalty-config` | Admin | ✅ Onboarding only |
| POST | `/businesses/:id/staff-keys` | Admin | ✅ Onboarding only |
| GET | `/businesses/:id/staff-keys` | Admin | ❌ |
| DELETE | `/businesses/:id/staff-keys/:keyId` | Admin | ❌ |
| GET | `/businesses/:id/stats/summary` | Admin | ✅ Dashboard KPIs |

### Clients

| Method | Path | Auth | Frontend |
|---|---|---|---|
| POST | `/clients` | Client JWT | ✅ Wallet name registration |
| GET | `/clients/me` | Client JWT | ❌ |
| GET | `/clients/me/loyalty/:businessId` | Client JWT | ✅ Wallet detail |
| GET | `/clients/me/loyalty` | Client JWT | ✅ Wallet index |
| GET | `/clients/businesses-clients` | Admin | 🔴 Broken mount + ❌ No UI |
| GET | `/clients/at-risk` | Admin | 🔴 Broken mount + ❌ No UI |

### Visits

| Method | Path | Auth | Frontend |
|---|---|---|---|
| POST | `/visits` | Staff key | ✅ Scanner |
| GET | `/visits/:visitId` | Any JWT | ❌ |
| GET | `/visits/me/visits` | Any JWT | ❌ |
| GET | `/visits/business-visits` | Admin | 🔴 Broken mount + ❌ No UI |

### Analytics

| Method | Path | Auth | Frontend |
|---|---|---|---|
| GET | `/businesses/:id/retention` | Admin | ❌ |
| GET | `/businesses/:id/visits` | Admin | ✅ VisitsChart |
| GET | `/businesses/:id/clients` | Admin | ✅ ClientsBreakdown |
| GET | `/businesses/:id/peak-hours` | Admin | ❌ |
| GET | `/businesses/:id/churn-risk` | Admin | ✅ ChurnRiskList |

### Campaigns

| Method | Path | Auth | Frontend |
|---|---|---|---|
| POST | `/businesses/:id/campaigns/generate` | Admin | ✅ |
| GET | `/businesses/:id/campaigns` | Admin | ✅ |
| GET | `/businesses/:id/campaigns/:campaignId` | Admin | ✅ Edit dialog |
| POST | `/businesses/:id/campaigns/:campaignId/activate` | Admin | ✅ |
| PATCH | `/businesses/:id/campaigns/:campaignId` | Admin | ✅ |
| GET | `/businesses/:id/campaigns/:campaignId/stats` | Admin | ❌ |

---

## Recommended build order

### Sprint 1 — Unblock core flows (1–2 weeks)

1. Fix `GET /businesses/:id` RLS (backend)
2. Fix admin client/visit route mounts (backend)
3. Role-aware login redirect + `useOwnedBusiness` hook
4. Forgot / reset password pages
5. `/join/$businessId` client enrollment flow
6. Business join QR + share link on dashboard

### Sprint 2 — Admin completeness (1–2 weeks)

7. `/settings/$businessId` (general, loyalty, staff keys)
8. `/dashboard/$businessId/clients` list page
9. `/dashboard/$businessId/visits` feed
10. Dashboard: retention chart + peak hours heatmap
11. Redemptions inbox (may need new backend route)

### Sprint 3 — Client experience (1 week)

12. Wallet visit history
13. Reward unlocked celebration
14. Profile edit page
15. Empty wallet → join flow CTA

### Sprint 4 — Campaigns & landing (1 week)

16. Campaign audience preview + WhatsApp copy MVP
17. Landing: pricing, demo link, mobile nav, legal pages
18. Replace static testimonials

### Sprint 5 — Ship quality (ongoing)

19. Frontend CI/CD pipeline
20. E2E tests for happy path
21. Error monitoring
22. Email verification flow

---

## New routes to create (summary)

| Route | Purpose | Priority |
|---|---|---|
| `/join/$businessId` | Client enrollment | P0 |
| `/forgot-password` | Password reset request | P0 |
| `/reset-password` | Password reset confirm | P0 |
| `/auth/callback` | Email verification OAuth callback | P0 |
| `/settings/$businessId` | Business settings hub | P1 |
| `/settings/$businessId/staff-keys` | Staff key management (or tab) | P1 |
| `/dashboard/$businessId/clients` | Client list | P1 |
| `/dashboard/$businessId/visits` | Visit feed | P1 |
| `/dashboard/$businessId/redemptions` | Pending rewards | P1 |
| `/wallet/profile` | Client profile edit | P2 |
| `/pricing` | Public pricing page | P4 |
| `/terms` | Terms of service | P4 |
| `/privacy` | Privacy policy | P4 |

---

## New frontend files to create (suggested structure)

```
frontend/src/
├── routes/
│   ├── join.$businessId.tsx          # P0
│   ├── forgot-password.tsx           # P0
│   ├── reset-password.tsx            # P0
│   ├── auth.callback.tsx             # P0
│   ├── settings.$businessId.tsx      # P1
│   ├── dashboard.$businessId.clients.tsx   # P1
│   ├── dashboard.$businessId.visits.tsx    # P1
│   └── wallet.profile.tsx            # P2
├── hooks/
│   ├── use-owned-business.ts         # P0
│   └── use-user-role.ts              # P0
├── lib/
│   └── auth-guards.ts                # P0
└── components/
    ├── join/
    │   ├── JoinHero.tsx
    │   └── JoinQR.tsx
    ├── settings/
    │   ├── GeneralSettings.tsx
    │   ├── LoyaltySettings.tsx
    │   └── StaffKeysManager.tsx
    └── dashboard/
        ├── RetentionChart.tsx        # P1
        ├── PeakHoursHeatmap.tsx      # P1
        ├── ClientListTable.tsx       # P1
        └── VisitFeedTable.tsx        # P1
```

---

## Acceptance criteria for "MVP complete"

The frontend is shippable when all of the following work end-to-end:

- [ ] Business owner can sign up, confirm email, complete onboarding, and land on dashboard
- [ ] Owner can copy/share a join link; customer can enroll without knowing UUID
- [ ] Customer can view loyalty card, generate QR, and staff can scan it
- [ ] Dashboard shows accurate business name, live stats, and updates after scan
- [ ] Owner can view client list and recent visits
- [ ] Owner can manage staff keys (add/revoke) from settings
- [ ] Owner can edit loyalty config after onboarding
- [ ] Owner can generate AI campaigns and copy message to send manually
- [ ] Forgot password flow works
- [ ] Landing page demo/pricing links work
- [ ] Frontend deploys automatically on push to main

---

## Related docs in this repo

| File | Purpose |
|---|---|
| `prompts/frontend-integration/00-ORCHESTRATOR.md` | Integration wave plan (completed) |
| `prompts/frontend-integration/01–08-*.md` | Per-feature integration prompts |
| `backend/supabase-schema.sql` | Database schema reference |
| `backend/DEPLOY.md` | Backend deployment guide |
| `frontend/.env.example` | Required frontend env vars |

---

## Notes for agents picking up this work

1. **Always use `apiFetch`** from `lib/api-client.ts` — never raw `fetch`.
2. **React Query keys:** `['business', businessId, 'resource']`.
3. **Spanish UI copy** for all user-facing strings.
4. **Auth pattern:** `beforeLoad` with `supabase.auth.getSession()` + redirect to `/login?redirect=...`.
5. **Fix backend blockers before building admin list UIs** — client/visit routes are mis-mounted.
6. **Do not commit** `.env`, `.dev.vars`, or `SMOKE-TEST-ACCOUNT.md`.
7. **Smoke test account** exists locally for manual QA (not in repo).

---

*Generated from codebase audit on 2026-05-23. Update this file as features ship.*
