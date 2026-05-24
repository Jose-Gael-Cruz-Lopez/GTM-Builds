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

Build-time env is loaded from [`.env.production`](.env.production) (committed — anon key is public). Worker runtime SSR vars are in [`wrangler.jsonc`](wrangler.jsonc) `vars`.

```bash
cd frontend
npm ci
npm run build
npx wrangler deploy
```

Optional local override: copy `.env.example` to `.env` for dev.

## Verify

```bash
curl -sI https://tanstack-start-app.nexoleal.workers.dev/ | head -3
curl -s https://tanstack-start-app.nexoleal.workers.dev/manifest.webmanifest
```

After a successful revamp deploy, `/manifest.webmanifest` returns JSON (not 404).

## GitHub secrets (CI)

| Secret | Required | Notes |
|--------|----------|-------|
| `CLOUDFLARE_API_TOKEN` | Yes | Workers deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account |
| `VITE_SUPABASE_*` | No | Loaded from committed `.env.production` |
