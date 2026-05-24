# Code quality

Last verified: **2026-05-24**

## Commands

```bash
# Backend
cd backend && npm test && npx tsc --noEmit

# Frontend
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

## Current status

| Metric | Backend | Frontend |
|--------|---------|----------|
| Tests | 25 passing | — |
| TypeScript errors | 0 | 0 |
| ESLint errors | — | 0 |
| ESLint warnings | — | 7 (shadcn `react-refresh`) |
| Build time | — | ~6s |

## Test coverage areas

| Suite | File | Covers |
|-------|------|--------|
| Auth middleware | `auth.test.ts` | JWT, staff key validation |
| Token engine | `tokenEngine.test.ts` | HMAC, TTL, blacklist |
| Visits API | `visits.test.ts` | Staff scan, route ordering |
| Supabase client | `supabase.test.ts` | PostgREST wrapper |
| Campaigns | `campaigns.test.ts` | NIM schema validation |

## Optimization notes

- **QR tokens:** 90s TTL + KV blacklist prevents replay fraud without DB round-trips on every scan.
- **Analytics:** 5-minute KV cache on dashboard stats reduces Supabase reads.
- **Rate limiting:** KV sliding window on sensitive routes (`/tokens/generate`, campaign AI).
- **Frontend bundles:** Largest chunks are `scan` (html5-qrcode) and dashboard charts (recharts) — lazy-loaded by route.
- **SSR auth:** Session guards skip server check (`requireSession`) to avoid localStorage-less SSR redirects; client hydrates auth.

## CI workflows

| Workflow | Trigger | Node | Deploy |
|----------|---------|------|--------|
| [`backend-ci.yml`](../.github/workflows/backend-ci.yml) | `backend/**` | 20 | `nexoleal-backend` on main |
| [`frontend-ci.yml`](../.github/workflows/frontend-ci.yml) | `frontend/**` | 22 | `tanstack-start-app` on main |
