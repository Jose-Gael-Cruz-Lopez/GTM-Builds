# 08 — Backend CORS + Frontend Deploy

**Wave**: 4 (run alone, after Wave 3 completes)
**Working dirs**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/backend` and `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

The Worker's CORS allow-list (`FRONTEND_ORIGIN`) currently has dev/staging/prod placeholders:

| Env | Origin |
|---|---|
| dev (default) | `http://localhost:5173` |
| staging | `https://staging.nexoleal.com` |
| production | `https://app.nexoleal.com` |

After deploying the frontend, the real production origin (e.g. `https://nexoleal-landing.pages.dev` or a custom domain) must be added so the browser can call the API without CORS errors.

## Tasks

### 1. Detect the deployed frontend origin

The frontend uses `@cloudflare/vite-plugin` and a `wrangler.jsonc` — it deploys to Cloudflare Pages or Workers. Run:

```bash
cd /Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend
cat wrangler.jsonc
```

Identify the project name. The default Cloudflare Pages URL pattern is:

```
https://<project-name>.pages.dev
```

The Workers static-assets URL pattern is:

```
https://<worker-name>.<subdomain>.workers.dev
```

Deploy the frontend first so we know the real origin:

```bash
npm run build
npx wrangler deploy
```

Capture the printed URL (e.g. `https://nexoleal-landing.pages.dev`).

### 2. Update backend `wrangler.toml`

Edit `/Users/josegaelcruzlopez/Downloads/GTM-Builds/backend/wrangler.toml`:

For the default (dev) environment, change `FRONTEND_ORIGIN` to support BOTH localhost and the deployed origin. Since Hono's CORS middleware accepts either a string or a function, we need to switch to a multi-origin allow-list.

The current code in `backend/src/index.ts`:

```ts
app.use('*', async (c, next) => {
  const origin = c.env.FRONTEND_ORIGIN
  return cors({ origin, /* ... */ })(c, next)
})
```

Refactor to accept a comma-separated list:

```ts
app.use('*', async (c, next) => {
  const allowList = c.env.FRONTEND_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  return cors({
    origin: (origin) => (origin && allowList.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Staff-Key'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
  })(c, next)
})
```

Then update each environment's `FRONTEND_ORIGIN` in `wrangler.toml`:

```toml
[vars]
FRONTEND_ORIGIN = "http://localhost:5173,http://localhost:3000,https://<deployed-frontend>.pages.dev"
# ... rest

[env.staging.vars]
FRONTEND_ORIGIN = "https://staging.nexoleal.com,https://<deployed-frontend>.pages.dev"

[env.production.vars]
FRONTEND_ORIGIN = "https://app.nexoleal.com,https://<deployed-frontend>.pages.dev"
```

(`vars` syntax — keep all existing fields; only `FRONTEND_ORIGIN` changes.)

### 3. Redeploy the backend

```bash
cd /Users/josegaelcruzlopez/Downloads/GTM-Builds/backend
npx wrangler deploy
```

Confirm the deploy output includes the updated `FRONTEND_ORIGIN` in the bindings section.

### 4. Set `VITE_API_URL` for the deployed frontend

If the frontend's deploy pipeline doesn't already inject `VITE_API_URL`, add it as a Cloudflare Pages env var (Dashboard → the project → Settings → Environment variables → Production → add `VITE_API_URL=https://nexoleal-backend.nexoleal.workers.dev`). Then trigger a redeploy.

OR — if the frontend deploys via `wrangler.jsonc` direct to Workers static assets, add the variable to that config.

### 5. Smoke test the live integration

Open the deployed frontend URL in a browser. Open DevTools → Network tab. Then:

1. Hit `/signup`. Create a test user. Watch the Network panel: should see `POST` to `lajrjnjyvbpaaspzgpvh.supabase.co/auth/v1/signup` then `POST https://nexoleal-backend.nexoleal.workers.dev/businesses` returning 201.
2. Go to `/dashboard/<businessId>`. Watch: 4 GET requests fire to the Workers API. All return 200 with `success: true`.
3. Switch to `/wallet`. Watch `GET /clients/me/loyalty` succeed.
4. Switch to `/campaigns/<businessId>`. Click "Generar 3 campañas". Watch `POST /campaigns/generate` return 201 with 3 NIM-generated drafts.

If any request shows a CORS error in the console, the origin isn't in the allow-list — re-check the `FRONTEND_ORIGIN` env var and redeploy.

### 6. Optional: pin the custom domain

If a custom domain is configured (e.g. `app.nexoleal.com`), add it to the CORS allow-list **and** to Cloudflare's Workers Custom Domains for the backend project.

## Files this prompt creates or modifies

- **Modified**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/backend/wrangler.toml`, `/Users/josegaelcruzlopez/Downloads/GTM-Builds/backend/src/index.ts`
- **Deployed**: backend (via `wrangler deploy`), frontend (via `wrangler deploy` or Pages auto-deploy)

## Done when

- The deployed frontend at `https://<...>.pages.dev` loads with no CORS errors.
- Every backend call from the deployed frontend returns 200 / 201 / expected status.
- DevTools Network tab shows the `access-control-allow-origin` header echoing the deployed frontend origin.
- Manual smoke-test of signup → dashboard → wallet → scanner → campaigns all work end-to-end.

## Things to avoid

- DO NOT set `FRONTEND_ORIGIN = "*"` — that would disable CORS entirely. Always list explicit origins.
- DO NOT commit any environment-specific secret to git. CORS origin strings are fine (they're public).
- DO NOT skip the backend redeploy after editing `wrangler.toml` — env vars don't update automatically.
- DO NOT change the Worker's existing KV namespace bindings or other secrets in this step.
