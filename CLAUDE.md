# CLAUDE.md

## Build & Test Commands

**Frontend** (`/frontend`):

```
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier write

```

**Backend** (`/backend`):

```
wrangler dev         # Local Cloudflare Worker
wrangler deploy      # Deploy to CF Workers
npm run test         # Vitest run (single pass)
npm run type-check   # tsc --noEmit
npm run lint         # ESLint

```

## Project Context

Loyalty-platform monorepo: **frontend** = TanStack Start (React 19 + Vite + Tailwind v4 + TanStack Router file-based + Supabase auth) deployed to Cloudflare; **backend** = Hono on Cloudflare Workers with Supabase and Vitest.

---

## Product Architecture & Roadmap (B2B2C)

### 1. Actor Model & Auth

* **Business Owner (B2B):** Authenticates via Email/Password (Supabase Auth). Manages branches, discounts, and views AI analytics.
* **End User/Consumer (B2C):** Frictionless auth via **Username only**. Optional Referral/Invitation code input during registration to reward the referrer.

### 2. Frontend Routing Structure (`/frontend/src/routes`)

* **B2C End User Routes (`/user/*`):**
* `/user/register`: Form with Username input + optional Referral Code.
* `/user/dashboard`: Single view containing:
* Dynamic QR/Code component that rotates/refreshes strictly every **90 seconds** (contains signed/encrypted User ID + Name data).
* "Invite Friends" section displaying their personal referral code.
* "My Rewards" section showing active or available discounts.




* **B2B Business Routes (`/business/*`):**
* `/business/dashboard`: Home panel displaying physical branches/stores management.
* `/business/scanner`: Camera/Scanner interface to read the user's 90s dynamic code, registering their visit/purchase automatically.
* `/business/customers`: CRM list tracking customer history, last purchase timestamp, and frequency.
* `/business/discounts`: CRUD panel for active loyalty rewards and point configurations.
* `/business/business-model`: Text-based input area where the owner describes their business niche, inventory, and operations.
* `/business/ai-reports`: LLM-powered analytical dashboard. Cross-references actual purchase data with the text from `/business-model` to output proactive retention strategies (e.g., automated discount recommendations for churning users).



---

## Code Style & Guidelines

* **TypeScript strict** (`"strict": true`). Path alias `@/*` → `src/*`. Never use `any`; prefer explicit return types on hooks and server functions.
* **Routing**: file-based via TanStack Router. `src/routeTree.gen.ts` is auto-generated — never edit manually.
* **Components**: Radix UI primitives wrapped in `src/components/ui/`; compose, don't re-implement.
* **Data fetching**: TanStack Query (`useQuery`/`useMutation`) on the client; Supabase client from `@/integrations/supabase/client`.
* **Forms**: `react-hook-form` + Zod schemas. Define schema first, infer type with `z.infer<typeof schema>`.
* **Hooks**: custom hooks in `src/hooks/`, named exports, single responsibility.
* **Backend**: Hono typed with `Hono<{ Bindings: Env; Variables: ContextVariables }>`. Errors via `errorHandler` middleware — throw `HTTPException`, never `res.status()` manually.
* **No barrel re-exports** unless the directory already has an `index.ts`.

## Token Optimization Rules (Crucial)

* Be extremely concise. Do not explain code unless explicitly asked.
* Before reading a full file, use `grep` or targeted reads (`offset`/`limit`) if only a specific section is needed.
* Never repeat existing code in responses; show only changed lines or a diff.
* For algorithm/logic problems, go directly to the optimal time/space complexity solution without preamble.
* `routeTree.gen.ts` is generated — never read or modify it; ask which route file is relevant instead.
* Prefer editing existing files over creating new ones.