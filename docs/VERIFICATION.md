# Verification checklist

Run after deploy or significant changes.

## Automated

```bash
# Backend
cd backend && npm test && npx tsc --noEmit

# Frontend
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

## Live probes

```bash
curl -s https://nexoleal-backend.nexoleal.workers.dev/health
curl -s https://tanstack-start-app.nexoleal.workers.dev/manifest.webmanifest
```

Expected: health `{"success":true,...}` and manifest JSON with `"name":"NexoLeal"`.

## Manual smoke test (owner)

1. Open https://tanstack-start-app.nexoleal.workers.dev/login
2. Sign in as business owner
3. Navigate sidebar: **Resumen → Clientes → Visitas → Campañas → Configuración** (must stay logged in)
4. Confirm dashboard KPIs load (empty state OK for new businesses)

## Manual smoke test (API)

With owner Bearer token:

| Endpoint | Expected |
|----------|----------|
| `GET /businesses/:id` | 200 + business object |
| `GET /visits/business-visits?businessId=` | 200 + `{ visits: [] }` |
| `GET /clients/businesses-clients?businessId=` | 200 |
| `GET /businesses/:id/campaigns` | 200 |

## Known worker names

| Purpose | Worker |
|---------|--------|
| Live frontend | `tanstack-start-app` |
| Live API (frontend points here) | `nexoleal-backend` |
| CI backend on main push | `nexoleal-backend-production` |

Keep `nexoleal-backend` and `nexoleal-backend-production` in sync when schema or routes change.
