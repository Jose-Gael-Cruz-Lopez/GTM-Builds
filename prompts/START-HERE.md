# NexoLeal Backend — Start Here

You are building the complete Cloudflare Workers backend for **NexoLeal**, a digital loyalty engine for Latin American SMBs.

## Your first action

Read the orchestrator file in full:

```
/Users/josegaelcruzlopez/Downloads/GTM-Builds/prompts/backend/00-ORCHESTRATOR.md
```

That file contains the full project context, all shared conventions, and the exact parallel execution plan you must follow.

---

## What you are building

A production-ready Cloudflare Workers REST API with:

- **Hono.js v4** as the web framework
- **Supabase PostgREST** as the database (`https://lajrjnjyvbpaaspzgpvh.supabase.co`)
- **Cloudflare KV** for token blacklist, rate limiting, and analytics cache
- **NVIDIA NIM** (`nvidia/llama-3.1-nemotron-70b-instruct`) for AI campaign generation
- **HMAC-SHA256** QR token engine with anti-replay protection

The backend lives at `/backend` in the project root (`/Users/josegaelcruzlopez/Downloads/GTM-Builds/backend`).

---

## Execution plan

After reading `00-ORCHESTRATOR.md`, load the parallel agents skill:

```
/Users/josegaelcruzlopez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/dispatching-parallel-agents/SKILL.md
```

Then execute the 4 waves below. Each wave runs its agents **simultaneously**. Do not start a wave until all agents in the previous wave have finished writing their files.

### Wave 1 — Run both at the same time
| Agent | Reads | Produces |
|-------|-------|----------|
| Setup Agent | `prompts/backend/01-project-setup.md` | `/backend` scaffold, `wrangler.toml`, `package.json`, `src/index.ts` |
| Supabase Client Agent | `prompts/backend/02-supabase-client.md` | `src/lib/supabase.ts`, `src/types/db.ts` |

### Wave 2 — Run all four at the same time (requires Wave 1 done)
| Agent | Reads | Produces |
|-------|-------|----------|
| Auth Agent | `prompts/backend/03-auth-middleware.md` | `src/middleware/auth.ts`, `src/middleware/rateLimit.ts` |
| Token Agent | `prompts/backend/04-qr-token-engine.md` | `src/lib/tokenEngine.ts`, `src/routes/tokens.ts` |
| Businesses Agent | `prompts/backend/05-businesses-api.md` | `src/routes/businesses.ts` |
| Clients Agent | `prompts/backend/06-clients-api.md` | `src/routes/clients.ts` |

### Wave 3 — Run all three at the same time (requires Wave 2 done)
| Agent | Reads | Produces |
|-------|-------|----------|
| Visits Agent | `prompts/backend/07-visits-api.md` | `src/routes/visits.ts` |
| Analytics Agent | `prompts/backend/08-analytics-api.md` | `src/routes/analytics.ts` |
| Campaigns Agent | `prompts/backend/09-campaigns-api.md` | `src/lib/nim.ts`, `src/routes/campaigns.ts` |

### Wave 4 — Single agent (requires Wave 3 done)
| Agent | Reads | Produces |
|-------|-------|----------|
| Test + Deploy Agent | `prompts/backend/10-testing-deployment.md` | Tests, CI workflow, `DEPLOY.md` |

---

## After all waves complete

1. Open `src/index.ts` and confirm every route is imported and mounted
2. Run `cd /backend && npm install && npx tsc --noEmit` — must exit 0
3. Run `npm test` — all tests must pass
4. Run `npx wrangler dev --local` and hit `GET /health` — must return `{"success":true,"data":{"status":"ok"}}`

---

## Secrets you will need (set after first deploy)

```bash
wrangler secret put SUPABASE_URL          # https://lajrjnjyvbpaaspzgpvh.supabase.co
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put TOKEN_SECRET          # openssl rand -hex 32
wrangler secret put NIM_API_KEY           # from integrate.api.nvidia.com
wrangler secret put STAFF_API_KEY_HASH
```

---

## Start now

Read `prompts/backend/00-ORCHESTRATOR.md`, then dispatch Wave 1.
