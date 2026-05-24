# Prompt 10 — Settings (`/settings/$businessId`)

> **How to run this prompt.** Paste **Prompt 0 (Master System Prompt)** below into your coding agent first, then paste the **Prompt 10** body. The Master prompt encodes the design language, tokens, fonts, backend contracts, and conventions every surface must follow.

---

## Prompt 0 — Master System Prompt (Design Language + Stack Contract)

**Paste this first in every coding-agent session.**

```
You are building the new frontend for NexoLeal — a B2B2C digital loyalty platform for Latin American SMBs (barbershops, vet clinics, cafés, gyms, boutique studios). The product has three distinct surfaces that must share ONE design system: (1) Customer Wallet — mobile-first, emotional, rewarding; (2) Staff Scanner — single-purpose, fast, glanceable at the cashier counter; (3) Business Owner Dashboard — dense, analytical, optimistic. Every screen must feel like it was designed by the same studio.

DESIGN LANGUAGE — fused from 7 Awwwards-winning references. Hold all of these in your head as you build:

1) Cleo AI (web.cleo.com) — PRIMARY REFERENCE.
   - Use for: overall product voice, mobile-first storytelling, phone-mockup heroes, dark-to-light section transitions, conversational copy, AI-companion personality.
   - Steal: floating phone hero parallax, warm card surfaces against dark backgrounds, "Hey you" conversational openers (in Spanish: "Hola, [nombre]"), GSAP/Framer scroll-triggered color-temperature shifts.

2) La Revoltosa (larevoltosa.es) — LATAM IDENTITY LAYER.
   - Use for: cultural resonance, celebration moments, brand energy when the customer earns a stamp or unlocks a reward.
   - Steal: red `#FF2D1A` celebration accent, bubble/particle physics for stamp-completion animation, heavy condensed display type for reward names, full-bleed marquee strips.

3) MindMarket (mindmarket.io) — DASHBOARD STORYTELLING.
   - Use for: making the owner dashboard feel alive and optimistic instead of cold and utility-like.
   - Steal: chartreuse `#C8F02A` as the "business health" signal color, Rive-style line-drawn data illustrations, playful hub cards for customer segments (active / at-risk / lost), illustrated empty states.

4) The Renaissance Edition by Shopify (shopify.com/renaissance) — EDITORIAL POLISH.
   - Use for: feature communication, weekly insights, premium onboarding storytelling.
   - Steal: magazine-style multi-column grids, "hidden-layer" parallax reveal pattern for overview-to-detail transitions, editorial serif display headings paired with grotesque body, cinematic crossfades between sections.

5) Kriss.AI (kriss.ai) — STAFF SCANNER REFERENCE.
   - Use for: the cashier-side scanner UI and any "AI for service-industry SMBs" framing.
   - Steal: isometric 3D scene illustration for empty/onboarding scanner state, hotspot pulse animation around the QR target reticle, zoom transition for SCAN → CONFIRMED → STAMP ADDED, warm beige/terracotta accent for the staff app so it doesn't feel clinical.

6) Reventador (reventador.io) — DATA-DENSITY GRAMMAR.
   - Use for: dashboard layout structure, real-time data panels, status indicators.
   - Steal: fixed left sidebar nav, multi-panel card grid, traffic-light status chips (green/amber/red for active/at-risk/lost customers), modal drill-down on row click, subtle live-data refresh pulses.

7) Sidewave (awwwards.com/sites/sidewave) — MOTION REFERENCE.
   - Use for: the 90-second QR countdown ring on the wallet.
   - Steal: hypnotic radial pulse animation, "order emerging from chaos" feel for the QR reveal.

GLOBAL DESIGN TOKENS — non-negotiable. Implement in Tailwind v4 `@theme` block in `frontend/src/styles.css`:

  Color (CSS custom properties, also exposed as Tailwind utilities):
    --color-bg-base:        #0D0D0D        /* Cleo near-black, dark mode base */
    --color-bg-elevated:    #1A1A1A
    --color-bg-paper:       #F9F6EF        /* Shopify warm off-white, light surfaces */
    --color-cream:          #F5E8D8        /* Cleo warm cream, wallet card body */
    --color-ink:            #0A0F1E        /* deep navy, primary text on light */
    --color-ink-soft:       #4A5160
    --color-signal:         #F5C518        /* Cleo yellow, primary CTA */
    --color-celebrate:      #FF2D1A        /* La Revoltosa red, stamp/reward celebration ONLY */
    --color-health:         #C8F02A        /* MindMarket chartreuse, "business is healthy" */
    --color-status-good:    #16A34A
    --color-status-warn:    #F59E0B
    --color-status-risk:    #EF4444
    --color-scanner-warm:   #C8A89A        /* Kriss.AI dusty rose, staff scanner accent */
    --color-data-blue:      #2B8EFF        /* Reventador electric blue, chart primary */

  Type (load via @fontsource or local):
    --font-display:  "Fraunces", "Söhne Breit", ui-serif       /* Shopify editorial serif for hero/display */
    --font-sans:     "Inter", "GT Walsheim", ui-sans-serif      /* Cleo-class grotesque for body */
    --font-mono:     "JetBrains Mono", ui-monospace             /* QR codes, staff keys */
    Display sizes use tight tracking (-0.02em) and clamp() for fluid scaling.

  Radii:    --radius-sm: 8px;  --radius: 14px;  --radius-lg: 22px;  --radius-pill: 9999px
  Shadow:   premium soft shadow stack — `0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(10,15,30,.08)`
  Motion:   default ease `cubic-bezier(.22,1,.36,1)`, duration 320ms; scroll-trigger transitions 600ms.

SURFACE-TO-PALETTE MAPPING:
  • Customer Wallet  → dark base + cream card + signal yellow CTA + celebrate red for stamp wins.
  • Staff Scanner    → dark base + scanner-warm rose accent + green/red status flashes only.
  • Owner Dashboard  → paper light theme + ink navy text + health chartreuse for positive KPIs + data-blue charts.
  • Landing          → editorial mix: dark hero → cream mid → paper feature blocks (Cleo dark-to-light transition pattern).

STACK CONTRACT — do not deviate without asking:
  • TanStack Start on Vite 7 (SSR, Cloudflare Workers deploy)
  • TanStack Router (file-based, `frontend/src/routes/`)
  • React 19 + React Query (`useQuery` / `useMutation`)
  • Supabase JS auth → JWT bearer
  • API client: ALWAYS use `apiFetch` from `lib/api-client.ts`, never raw `fetch`
  • UI: Tailwind v4 + shadcn/ui + Radix primitives (already installed)
  • Motion: Framer Motion for component-level, GSAP only if scroll-triggered storytelling is needed
  • Charts: Recharts (already installed)
  • QR: `qrcode.react` (client), `html5-qrcode` (scanner)
  • Icons: `lucide-react`
  • Forms: `react-hook-form` + `zod`
  • Toasts: `sonner`

COPY CONTRACT:
  • All user-facing strings in Spanish (LatAm neutral, voseo avoided).
  • Conversational, warm, owner-empowering. Avoid corporate jargon.
  • Reward/celebration moments use a slightly playful register ("¡Sello desbloqueado!", "Tu próxima visita es gratis").
  • Dashboard insights are direct and actionable ("23 clientes están a punto de irse — envía esta campaña").

ACCESSIBILITY CONTRACT:
  • All interactive elements keyboard-reachable with visible :focus-visible ring (2px signal yellow, 2px offset).
  • Min contrast 4.5:1 for body text; status chips use icon + color, never color alone.
  • Scanner needs aria-live region for scan results.
  • Forms use `<label>` + `aria-describedby` for errors.

REACT QUERY KEY CONVENTION (mandatory):
  ['business', businessId, 'resource', ...params]
  ['client', 'me', 'resource', ...params]

ENV (already exists, do not duplicate):
  VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_URL

KNOWN BACKEND BLOCKERS — code defensively around these until fixed:
  • GET /businesses/:id returns 404 (RLS) → fall back to localStorage business name + retry on focus.
  • GET /clients/businesses-clients and /clients/at-risk and /visits/business-visits are mis-mounted → admin list pages must show a friendly "Función en preparación" empty state if the endpoint 400s.
  • Email confirmation may null out `signUpData.session` → handle pending-business via `/auth/callback`.

When in doubt, prefer: (a) the Cleo emotional register, (b) shadcn primitives styled with the tokens above, (c) one motion idea per screen — never more.
```

---

## Prompt 10 — Settings (`/settings/$businessId`)

**Closes:** P1.1 (general / loyalty / staff devices / account tabs).

```
Build a single settings hub with four tabs matching the gap-analysis spec.

REFERENCES TO FUSE:
  • Renaissance Edition — editorial section dividers and multi-column field grids.
  • MindMarket — illustrated tab headers.
  • Reventador — staff-keys table with revoke action and "last used" timestamps.

ROUTE: `frontend/src/routes/settings.$businessId.tsx` (new) with sub-tabs via search param `?tab=general|loyalty|staff|account`.

LAYOUT:
  • Page header: "Configuración de [businessName]" in serif display.
  • Tab bar (sticky on scroll): General · Programa de lealtad · Staff y dispositivos · Cuenta.
  • Right rail (desktop only): contextual help card for the active tab.

TAB 1 — GENERAL:
  • Fields: nombre del negocio, categoría, tagline, logo (re-upload), color primario, dirección (optional), teléfono de contacto.
  • Save via `PATCH /businesses/:id`.
  • Danger zone at the bottom: "Pausar negocio" (`is_active=false`) + "Eliminar negocio" with double-confirm.

TAB 2 — PROGRAMA DE LEALTAD:
  • Slider for `stampsRequired` (3 to 20) with a live preview of the card.
  • Textarea for `rewardDescription` (max 140 chars, char counter).
  • Save via `PATCH /businesses/:id/loyalty-config`.
  • Warning callout: "Cambiar el número de sellos no afecta a clientes existentes en curso."

TAB 3 — STAFF Y DISPOSITIVOS:
  • Table of staff keys: nombre/etiqueta, últimos 4 chars de la clave, fecha de creación, último uso, acciones.
  • Top-right "Crear nueva clave" button → opens dialog that shows the raw key ONCE with a copy-to-clipboard, and a warning "Guárdala ahora. No la mostraremos otra vez."
  • Revoke action → confirm dialog → `DELETE /businesses/:id/staff-keys/:keyId`.
  • Wire: `GET /businesses/:id/staff-keys`, `POST /businesses/:id/staff-keys`, `DELETE /businesses/:id/staff-keys/:keyId` (already in api/businesses.ts).

TAB 4 — CUENTA:
  • Change password (Supabase `updateUser({ password })`).
  • Change email (Supabase `updateUser({ email })` — triggers confirmation).
  • Sign out everywhere (`supabase.auth.signOut({ scope: 'global' })`).
  • Delete account with typed-confirmation ("escribe ELIMINAR para confirmar").

ACCEPTANCE:
  • All four tabs render and persist changes.
  • Staff-key dialog cannot be re-opened to view the raw key (only the last-4 visible afterward).
  • URL deep-links to a tab work (`?tab=staff`).
```
