# Platform health audit

**Date:** 2026-05-24  
**Auditor:** Automated + manual smoke checks

## Summary

| System | Status | Notes |
|--------|--------|-------|
| Cloudflare frontend (`tanstack-start-app`) | ✅ Pass | HTTP 200, PWA manifest OK |
| Cloudflare backend (`nexoleal-backend`) | ✅ Pass | `/health` returns `ok` v0.1.0 |
| Supabase PostgreSQL | ✅ Pass | All 8 tables reachable |
| Supabase Auth | ✅ Pass | `/auth/v1/health` 200 |
| Backend CI (main) | ✅ Pass | 25 tests, deploy to `nexoleal-backend` |
| Frontend CI (main) | ✅ Pass | lint (0 errors), build OK |
| Worker count | ✅ Clean | 2 workers (frontend + backend) |

## Cloudflare

| Check | Result |
|-------|--------|
| `GET https://nexoleal-backend.nexoleal.workers.dev/health` | `{"success":true,"data":{"status":"ok","version":"0.1.0"}}` |
| `GET https://tanstack-start-app.nexoleal.workers.dev/` | HTTP 200 |
| `GET …/manifest.webmanifest` | `{"name":"NexoLeal",…}` |
| CORS preflight (production origin) | HTTP 204 |
| Duplicate worker removed | `nexoleal-backend-production` deleted (PR #9) |

### KV bindings (backend)

| Binding | Purpose |
|---------|---------|
| `TOKEN_BLACKLIST` | One-time QR token invalidation |
| `RATE_LIMIT` | Sliding-window request limits |
| `ANALYTICS_CACHE` | Dashboard stats cache (5 min TTL) |

### Cron

| Schedule | Job |
|----------|-----|
| `0 3 * * *` UTC | Recalculate client status (`active` / `at_risk` / `lost`) |

## Supabase

**Project:** `lajrjnjyvbpaaspzgpvh`  
**URL:** https://lajrjnjyvbpaaspzgpvh.supabase.co

| Table | REST probe |
|-------|------------|
| `businesses` | ✅ 200 |
| `clients` | ✅ 200 |
| `client_business_loyalty` | ✅ 200 |
| `loyalty_configs` | ✅ 200 |
| `visits` | ✅ 200 |
| `rewards` | ✅ 200 |
| `campaigns` | ✅ 200 |
| `staff_keys` | ✅ 200 |

Schema source: [`backend/supabase-schema.sql`](../backend/supabase-schema.sql)  
Incremental migrations: [`frontend/supabase/migrations/`](../frontend/supabase/migrations/)

## Code quality

| Check | Backend | Frontend |
|-------|---------|----------|
| Unit tests | 25/25 pass | — |
| TypeScript | 0 errors | 0 errors |
| ESLint | — | 0 errors, 7 warnings (shadcn UI) |
| Production build | — | ✅ ~6s |

Warnings are `react-refresh/only-export-components` in generated shadcn files — safe to ignore.

## Known limitations

1. **WhatsApp send** — campaigns copy to clipboard; no Twilio/Meta API integration yet.
2. **Email confirmation** — depends on Supabase Auth settings; smoke test uses pre-confirmed accounts.
3. **Staging worker** — `nexoleal-backend-staging` only deploys on `develop` branch pushes.
