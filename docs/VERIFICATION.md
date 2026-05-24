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

## Supabase checks

```bash
SB="https://lajrjnjyvbpaaspzgpvh.supabase.co"
SERVICE_KEY="<from backend/.dev.vars>"

for table in businesses clients visits campaigns staff_keys loyalty_configs rewards client_business_loyalty; do
  echo -n "$table: "
  curl -sS -o /dev/null -w "%{http_code}\n" "$SB/rest/v1/$table?limit=1" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
done
```

All tables should return `200`. See [`docs/SUPABASE.md`](SUPABASE.md).

## Known worker names

| Purpose | Worker |
|---------|--------|
| Live frontend | `tanstack-start-app` |
| Live API (frontend points here) | `nexoleal-backend` |

Only **2 production workers** should exist. Delete any legacy `nexoleal-backend-production`.
