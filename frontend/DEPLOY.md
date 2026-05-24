# NexoLeal Frontend — Deploy

## Live

| | |
|---|---|
| **Worker** | `tanstack-start-app` |
| **URL** | https://tanstack-start-app.nexoleal.workers.dev |
| **Config** | [`wrangler.jsonc`](wrangler.jsonc) |

## CI/CD

Push to `main` with changes under `frontend/**` triggers [Frontend CI](../.github/workflows/frontend-ci.yml):

1. Prettier check → ESLint → TypeScript → Vite build
2. `wrangler deploy` (requires Node.js **22+**)

## Manual deploy

```bash
cd frontend
cp .env.example .env    # fill Supabase + API URL
npm ci
npm run build
npx wrangler deploy
```

Build-time env (from `.env` or export):

```
VITE_SUPABASE_URL=https://lajrjnjyvbpaaspzgpvh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_API_URL=https://nexoleal-backend.nexoleal.workers.dev
```

## Verify

```bash
curl -sI https://tanstack-start-app.nexoleal.workers.dev/ | head -3
curl -s https://tanstack-start-app.nexoleal.workers.dev/manifest.webmanifest
```

After a successful revamp deploy, `/manifest.webmanifest` returns JSON (not 404).

## GitHub secrets (CI)

| Secret | Example value |
|--------|---------------|
| `CLOUDFLARE_API_TOKEN` | Workers deploy token |
| `VITE_SUPABASE_URL` | `https://lajrjnjyvbpaaspzgpvh.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_API_URL` | `https://nexoleal-backend.nexoleal.workers.dev` |
