# NexoLeal

**Motor de Lealtad y Retención para PYMES latinoamericanas**

[![Backend CI](https://github.com/Jose-Gael-Cruz-Lopez/GTM-Builds/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Jose-Gael-Cruz-Lopez/GTM-Builds/actions/workflows/backend-ci.yml)
[![Worker](https://img.shields.io/badge/worker-live-brightgreen)](https://nexoleal-backend.nexoleal.workers.dev/health)

NexoLeal transforma el sistema tradicional de tarjetas de lealtad de cartón en un ecosistema digital B2B2C. Combina un monedero digital sin fricción para el cliente con un motor de retención para el negocio: registra visitas, previene fraude y activa campañas inteligentes con IA.

---

## Problema

Las PYMES de servicios (barberías, estéticas, veterinarias, cafeterías) enfrentan tres problemas en la retención de clientes:

- **Pérdida de datos** — las tarjetas físicas no capturan frecuencia ni historial.
- **Fraude** — los sellos físicos son fáciles de falsificar.
- **Sin seguimiento** — no hay forma de detectar cuándo un cliente dejó de regresar.

El resultado: una relación ciega con el cliente. El negocio entrega recompensas pero no aprende nada.

---

## Solución

NexoLeal digitaliza el programa de lealtad con tres componentes conectados:

| Componente | Quién lo usa | Qué hace |
|---|---|---|
| **Monedero digital** | Cliente | Muestra progreso, genera QR temporal para escaneo |
| **Validación segura** | Staff / caja | Escanea el QR, registra la visita, previene doble uso |
| **Dashboard + IA** | Dueño del negocio | Métricas de retención, detecta inactivos, genera campañas |

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| **Backend** | Cloudflare Workers + Hono.js |
| **Base de datos** | Supabase (PostgreSQL) |
| **Autenticación** | Supabase Auth (JWT) + staff keys (HMAC-SHA256) |
| **IA / Campañas** | NVIDIA NIM (`meta/llama-3.3-70b-instruct`) |
| **KV / Cache** | Cloudflare KV (token blacklist, rate limit, analytics cache) |
| **Frontend** | Lovable (React + Vite + Tailwind CSS) |
| **CI/CD** | GitHub Actions → Cloudflare Workers (auto-deploy on push) |

---

## Arquitectura del backend

```
POST /tokens/generate   ← cliente genera QR (Supabase JWT)
POST /tokens/validate   ← staff escanea QR (X-Staff-Key)
POST /visits            ← registra visita + sello + recompensa
GET  /businesses/:id/analytics/summary   ← métricas (KV cache)
POST /businesses/:id/campaigns/generate  ← IA genera campaña
```

### Anti-fraude por diseño

Cada QR está firmado con HMAC-SHA256 y tiene una vida útil de 90 segundos. Después del primer escaneo válido, el token se invalida en Cloudflare KV — imposible reutilizarlo.

$$T = \text{HMAC\\_SHA256}(k,\ u \| b \| t \| \text{nonce})$$

- `k` — clave secreta del servidor (`TOKEN_SECRET`)
- `u` — ID del usuario (Supabase auth)
- `b` — ID del negocio
- `t` — timestamp Unix (segundos)
- `nonce` — 16 bytes aleatorios (hace cada token único)

---

## Cómo funciona

**Flujo del cliente**
1. Abre su monedero digital → ve sus sellos y recompensas.
2. Genera un QR temporal válido por 90 s.
3. Presenta el QR en caja.

**Flujo del staff**
1. Escanea el QR con su dispositivo.
2. El backend valida firma, expiración y uso único.
3. Registra la visita, actualiza sellos, desbloquea recompensa si aplica.

**Flujo del dueño**
1. Entra al dashboard.
2. Ve clientes activos / en riesgo / perdidos (calculado diariamente a las 3 AM UTC).
3. Genera campañas de reactivación personalizadas con IA en segundos.

---

## Estructura del repositorio

```
GTM-Builds/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Hono app + cron export
│   │   ├── cron.ts            # Recalcula status active/at_risk/lost
│   │   ├── lib/
│   │   │   ├── supabase.ts    # Cliente PostgREST tipado
│   │   │   ├── tokenEngine.ts # Genera / valida / invalida QR tokens
│   │   │   └── nim.ts         # Genera campañas con NVIDIA NIM
│   │   ├── middleware/
│   │   │   ├── auth.ts        # requireClient / requireStaff / requireAdmin
│   │   │   ├── rateLimit.ts   # Sliding window (Cloudflare KV)
│   │   │   └── errorHandler.ts
│   │   ├── routes/            # tokens, businesses, clients, visits, analytics, campaigns
│   │   └── types/             # Env, API envelope, DB schema
│   ├── src/__tests__/         # 24 tests — Vitest + miniflare
│   ├── supabase-schema.sql    # Schema completo para el teammate
│   ├── wrangler.toml          # KV namespaces + cron trigger
│   └── DEPLOY.md              # Guía de deploy paso a paso
├── prompts/
│   ├── START-HERE.md          # Punto de entrada para agentes
│   └── backend/               # 10 prompts detallados (01–10)
└── .github/workflows/
    └── backend-ci.yml         # typecheck → test → deploy automático
```

---

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/health` | — | Estado del worker |
| `POST` | `/tokens/generate` | Bearer JWT | Genera QR token |
| `POST` | `/tokens/validate` | X-Staff-Key | Valida y consume QR |
| `POST` | `/visits` | X-Staff-Key | Registra visita |
| `GET` | `/clients/me` | Bearer JWT | Perfil del cliente |
| `GET` | `/businesses/:id/analytics/summary` | Bearer JWT | Dashboard stats |
| `POST` | `/businesses/:id/campaigns/generate` | Bearer JWT | Genera campaña IA |

---

## Casos de uso

NexoLeal está diseñado para negocios de alta recurrencia:

- Barberías y estéticas
- Clínicas veterinarias
- Cafeterías
- Gimnasios boutique
- Consultorios y servicios por cita

---

## CI/CD

Cada push a `main` que toque `backend/**`:

```
GitHub Actions
  └── typecheck (tsc --noEmit)
  └── tests (vitest — 24/24 passing)
  └── deploy → https://nexoleal-backend.nexoleal.workers.dev
```

---

## Desarrollo local

```bash
cd backend
cp .dev.vars.example .dev.vars   # llena con tus keys
npm install
npm run dev        # wrangler dev en localhost:8787
npm test           # vitest — 24 tests
```

Variables requeridas en `.dev.vars`:

```
SUPABASE_URL=https://lajrjnjyvbpaaspzgpvh.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
TOKEN_SECRET=<256-bit hex>
NIM_API_KEY=nvapi-...
STAFF_API_KEY_HASH=<sha256 del raw key>
```

---

## Visión

NexoLeal busca convertirse en la **capa de lealtad digital para PYMES en Latinoamérica**: una infraestructura sencilla, segura y accesible que permita a pequeños negocios conocer mejor a sus clientes, aumentar recurrencia y crecer con datos reales en lugar de intuición.
