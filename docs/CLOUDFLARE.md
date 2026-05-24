# Cloudflare Workers — NexoLeal

## Production workers (2)

| Worker | Type | URL | Config |
|--------|------|-----|--------|
| `tanstack-start-app` | TanStack Start SSR + static assets | https://tanstack-start-app.nexoleal.workers.dev | [`frontend/wrangler.jsonc`](../frontend/wrangler.jsonc) |
| `nexoleal-backend` | Hono API | https://nexoleal-backend.nexoleal.workers.dev | [`backend/wrangler.toml`](../backend/wrangler.toml) |

Both deploy on push to `main` via GitHub Actions (when respective paths change).

## Frontend worker

- **Build:** Vite 7 → `dist/client` (static) + `dist/server` (Worker)
- **Env at build:** `frontend/.env.production`
- **Env at runtime:** `wrangler.jsonc` → `vars` (SSR `process.env.*`)
- **Node.js compat:** enabled for Supabase SSR

## Backend worker

### KV namespaces

| Binding | ID (default env) | Use |
|---------|------------------|-----|
| `TOKEN_BLACKLIST` | `5d4fb7d450ec41ee90894eda78ddbe9e` | Used QR hashes |
| `RATE_LIMIT` | `7599c9c50d97401a9537cf4a70ba3cdc` | Per-IP counters |
| `ANALYTICS_CACHE` | `a79f587953124bc3a2615aa88ae90723` | Stats cache |

### Secrets (set via dashboard or CLI)

```bash
cd backend
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put TOKEN_SECRET
npx wrangler secret put NIM_API_KEY
```

### CORS

`FRONTEND_ORIGIN` in `wrangler.toml` must include every frontend URL:

- `http://localhost:8080`
- `https://tanstack-start-app.nexoleal.workers.dev`

## Staging (optional)

| Worker | Trigger |
|--------|---------|
| `nexoleal-backend-staging` | Push to `develop` |

Deploy: `cd backend && npm run deploy:staging`

## GitHub Actions secrets

| Secret | Required |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Yes |

## Manual deploy

```bash
# Frontend
cd frontend && npm run build && npx wrangler deploy

# Backend
cd backend && npm run deploy
```
