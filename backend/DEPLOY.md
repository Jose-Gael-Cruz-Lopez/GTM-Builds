# NexoLeal Backend — Deployment Checklist

> **Status:** KV namespaces are already created and pasted into `wrangler.toml`.
> `.dev.vars` has a generated `TOKEN_SECRET` and `STAFF_API_KEY_HASH`.
> You still need to fill in `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, and
> `NIM_API_KEY` before the worker can talk to Supabase or NVIDIA NIM.

## One-time Setup (do this before first deploy)

### 1. KV Namespaces — ✅ already done

All 12 namespaces (3 bindings × dev/preview/staging/production) have been
created and pasted into `wrangler.toml`. No further action needed.

If you ever need to recreate them, the commands are:

```bash
# Development (used with wrangler dev)
npx wrangler kv namespace create "TOKEN_BLACKLIST"
npx wrangler kv namespace create "TOKEN_BLACKLIST" --preview
npx wrangler kv namespace create "RATE_LIMIT"
npx wrangler kv namespace create "RATE_LIMIT" --preview
npx wrangler kv namespace create "ANALYTICS_CACHE"
npx wrangler kv namespace create "ANALYTICS_CACHE" --preview

# Staging
npx wrangler kv namespace create "TOKEN_BLACKLIST" --env staging
npx wrangler kv namespace create "RATE_LIMIT"      --env staging
npx wrangler kv namespace create "ANALYTICS_CACHE" --env staging

# Production
npx wrangler kv namespace create "TOKEN_BLACKLIST" --env production
npx wrangler kv namespace create "RATE_LIMIT"      --env production
npx wrangler kv namespace create "ANALYTICS_CACHE" --env production
```

### 2. Set Secrets

Run for each environment (omit `--env` for default/development):

```bash
npx wrangler secret put SUPABASE_URL          # value: https://lajrjnjyvbpaaspzgpvh.supabase.co
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put TOKEN_SECRET          # generate with: openssl rand -hex 32
npx wrangler secret put NIM_API_KEY           # NVIDIA NIM key from integrate.api.nvidia.com
npx wrangler secret put STAFF_API_KEY_HASH    # see below

# For staging:
npx wrangler secret put SUPABASE_URL --env staging
# (repeat all secrets for staging and production)
```

### 3. Generate STAFF_API_KEY_HASH

```bash
# Generate a raw key:
openssl rand -hex 32
# Then hash it:
echo -n "your-raw-key-here" | sha256sum
# Paste the hash as STAFF_API_KEY_HASH
```

### 4. Set GitHub Secrets

In your GitHub repository settings, add:
- `CLOUDFLARE_API_TOKEN` — create at https://dash.cloudflare.com/profile/api-tokens
- `CLOUDFLARE_ACCOUNT_ID` — found in Cloudflare dashboard URL

---

## Per-deploy Checklist

- [ ] All tests pass: `npm test`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Secrets are set in target environment
- [ ] KV namespace IDs are correct in `wrangler.toml`
- [ ] `FRONTEND_ORIGIN` var matches the deployed frontend URL

---

## Deploy Commands

```bash
# Local development
npm run dev

# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

---

## Verify Deployment

```bash
# Check health endpoint
curl https://nexoleal-backend.your-subdomain.workers.dev/health

# Expected response:
# {"success":true,"data":{"status":"ok","version":"0.1.0","ts":"..."}}
```

---

## Configuration Reference

| Setting          | Default                            | Notes                                      |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| `SUPABASE_URL`   | `https://lajrjnjyvbpaaspzgpvh.supabase.co` | Project URL                          |
| `FRONTEND_ORIGIN`| `http://localhost:5173` (dev)      | Set per env in `wrangler.toml`             |
| `TOKEN_TTL_SECONDS` | `90`                            | Lifetime of a QR token                     |
| `RATE_LIMIT_WINDOW_SECONDS` | `60`                    | Sliding-window rate limit period           |
| `RATE_LIMIT_MAX_REQUESTS`   | `60`                    | Max requests per window per IP             |
