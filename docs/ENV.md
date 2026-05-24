# Environment variables

Reference for all NexoLeal configuration.

## Frontend (public — safe in client bundle)

| Variable | Example | Where |
|----------|---------|-------|
| `VITE_SUPABASE_URL` | `https://lajrjnjyvbpaaspzgpvh.supabase.co` | `.env`, `.env.production` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon JWT | `.env`, `.env.production` |
| `VITE_API_URL` | `https://nexoleal-backend.nexoleal.workers.dev` | `.env`, `.env.production` |
| `SUPABASE_URL` | Same as above | SSR fallback; `wrangler.jsonc` vars |
| `SUPABASE_PUBLISHABLE_KEY` | Same as anon key | SSR fallback; `wrangler.jsonc` vars |

## Backend (secrets — never commit)

| Variable | Where |
|----------|-------|
| `SUPABASE_URL` | `backend/.dev.vars`, Cloudflare secrets |
| `SUPABASE_ANON_KEY` | `backend/.dev.vars`, Cloudflare secrets |
| `SUPABASE_SERVICE_KEY` | `backend/.dev.vars`, Cloudflare secrets |
| `TOKEN_SECRET` | Min 32 chars; Cloudflare secret |
| `NIM_API_KEY` | NVIDIA NIM for campaign generation |
| `FRONTEND_ORIGIN` | Comma-separated CORS origins in `wrangler.toml` |

## GitHub Actions

| Secret | Required |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | Yes (frontend + backend deploy) |
| `CLOUDFLARE_ACCOUNT_ID` | Yes |

Supabase/VITE vars for frontend CI are **not** required — they load from `frontend/.env.production`.
