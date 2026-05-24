# NexoLeal Backend — Deployment

## Live

| | |
|---|---|
| **Worker (primary)** | `nexoleal-backend` |
| **URL** | https://nexoleal-backend.nexoleal.workers.dev |
| **Health** | https://nexoleal-backend.nexoleal.workers.dev/health |
| **Config** | [`wrangler.toml`](wrangler.toml) |

Additional Workers (CI):

| Env | Worker name | Trigger |
|-----|-------------|---------|
| `staging` | `nexoleal-backend-staging` | Push to `develop` |
| `production` | `nexoleal-backend-production` | Push to `main` |

The frontend `.env` / GitHub `VITE_API_URL` should point at **`nexoleal-backend`** unless you migrate to the production env worker.

## One-time setup — done

- KV namespaces configured in `wrangler.toml`
- Secrets set on `nexoleal-backend` via `wrangler secret put`
- Cron: daily 03:00 UTC (client status recalculation)

## Deploy commands

```bash
cd backend

# Local dev
npm run dev                    # http://localhost:8787

# Primary worker (used by live frontend today)
npx wrangler deploy

# CI environments
npm run deploy:staging         # nexoleal-backend-staging
npm run deploy:production      # nexoleal-backend-production
```

## Per-deploy checklist

- [ ] `npm test` passes (25 tests)
- [ ] `npx tsc --noEmit` passes
- [ ] `FRONTEND_ORIGIN` in `wrangler.toml` includes the deployed frontend URL
- [ ] Supabase migrations applied if schema changed

## Verify

```bash
curl https://nexoleal-backend.nexoleal.workers.dev/health
# {"success":true,"data":{"status":"ok","version":"0.1.0","ts":"..."}}
```

## Secrets (Cloudflare)

```bash
npx wrangler secret put SUPABASE_URL          # https://lajrjnjyvbpaaspzgpvh.supabase.co
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put TOKEN_SECRET
npx wrangler secret put NIM_API_KEY
```

Repeat with `--env staging` / `--env production` for CI workers.

## GitHub secrets (CI)

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Configuration

| Setting | Value |
|---------|-------|
| `SUPABASE_URL` | `https://lajrjnjyvbpaaspzgpvh.supabase.co` |
| `FRONTEND_ORIGIN` | `localhost:8080`, `localhost:5173`, `https://tanstack-start-app.nexoleal.workers.dev` |
| `TOKEN_TTL_SECONDS` | `90` |
| `RATE_LIMIT_MAX_REQUESTS` | `60` per 60 s window |
