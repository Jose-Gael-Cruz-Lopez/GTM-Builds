# Prompt 12 — Quality Pass: A11y, Motion, Empty States, Errors

> **How to run this prompt.** Paste **Prompt 0 (Master System Prompt)** below into your coding agent first, then paste the **Prompt 12** body. The Master prompt encodes the design language, tokens, fonts, backend contracts, and conventions every surface must follow.

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

## Prompt 12 — Quality Pass: A11y, Motion, Empty States, Errors

**Closes:** P5 quality items (error boundaries, rate-limit UX, a11y audit, reduced motion, 429 toasts).

```
Run a quality pass across every surface so the product feels polished and resilient.

CHECKS TO IMPLEMENT:

1. Reduced motion: in `lib/theme.ts` motion presets, gate every transform/parallax behind `prefers-reduced-motion: no-preference`. Confetti and bubble physics simplify to a 200ms opacity fade under reduced-motion.

2. Error boundaries:
   • Wrap every route with a per-route error boundary that renders an editorial "Algo salió mal" scene + retry button.
   • Network errors with `429` should toast (sonner) "Demasiadas solicitudes. Intenta de nuevo en [Retry-After]s" using the header value.
   • Auth errors `401/403` redirect to `/login?reason=expired`.

3. Accessibility audit:
   • Add `aria-label` to icon-only buttons.
   • Forms: every input has an associated `<label>` and `aria-describedby` for error text.
   • Scanner: `aria-live="polite"` on the status panel, `role="status"`.
   • Color is never the sole signal: every status chip pairs a colored dot with text or icon.
   • Focus-visible ring (2px signal yellow, 2px offset) on every interactive element.
   • Run axe-core in dev (install `@axe-core/react`) and fix all serious/critical issues.

4. Empty + loading + error states for every list/data view. Inventory required:
   • Dashboard charts, KPI tiles, churn list.
   • Clients list, visits list, redemptions (P1.5).
   • Wallet cards index, single business detail history.
   • Campaigns list per status.

5. SEO + meta:
   • Replace "Lovable App" default head in `__root.tsx`.
   • Per-route `<title>` and `<meta name="description">`.
   • OG image: generate a static 1200×630 hero with serif headline.

6. CI/CD (matches P5 in roadmap):
   • Add `.github/workflows/frontend-ci.yml`:
     - Triggers on push to main touching `frontend/**`.
     - Steps: install (bun), `bun run lint`, `tsc --noEmit`, `bun run build`, `wrangler deploy`.
     - Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`, `CLOUDFLARE_API_TOKEN` from secrets.

7. PWA (optional but recommended for the wallet):
   • Add a minimal service worker + manifest so customers can "Add to Home Screen" their wallet.
   • Icons in NexoLeal brand palette.

ACCEPTANCE:
  • Lighthouse scores on `/`, `/wallet`, `/dashboard/$id`: Perf ≥ 85 mobile, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
  • axe-core dev overlay reports zero serious/critical issues.
  • CI green on a fresh PR.
```

---

## How the 7 references map across the build

| Surface | Cleo AI | La Revoltosa | MindMarket | Renaissance | Kriss.AI | Reventador | Sidewave |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Landing | ✅ Hero + dark→light | ✅ Marquee + final CTA | ✅ How-it-works | ✅ Beneficios grid | — | — | — |
| Auth | ✅ Split + voice | — | ✅ Success scenes | ✅ Display type | — | — | — |
| Join | ✅ Phone preview | ✅ Celebrate CTA | — | — | ✅ Category illustration | — | — |
| Onboarding | ✅ Live preview | — | ✅ Step dots | ✅ Finish cards | — | — | — |
| Wallet | ✅ Whole surface | ✅ Reward celebration | — | ✅ History divider | — | — | ✅ QR pulse |
| Scanner | — | — | — | — | ✅ Scene + reticle + zoom | ✅ Status chips | ✅ Idle pulse |
| Dashboard | ✅ Greeting | — | ✅ Segments + health | ✅ Insight card | — | ✅ Sidebar + grammar | — |
| Clients/Visits | — | — | ✅ Empty states | ✅ Filter bar | — | ✅ Tables + sheet | — |
| Settings | — | — | ✅ Tab headers | ✅ Field grids | — | ✅ Staff-keys table | — |
| Campaigns | ✅ Generation voice | — | ✅ Segment cards | ✅ Cards | — | ✅ Status chips | — |

---

## Recommended order to feed these prompts to your coding agent

1. **Prompt 0** (paste once at session start).
2. **Prompt 1** — Foundation. Stop here, visually QA the playground route.
3. **Prompt 3 + Prompt 4** — Auth + Join. This unblocks the entire customer enrollment loop.
4. **Prompt 6** — Wallet (the emotional centerpiece).
5. **Prompt 7** — Scanner.
6. **Prompt 8** — Dashboard.
7. **Prompt 2** — Landing (now that internal surfaces exist to link to).
8. **Prompt 5 + Prompt 10** — Onboarding completion + Settings.
9. **Prompt 11** — Campaigns revamp.
10. **Prompt 9** — Clients/Visits sub-pages (gated by backend fix).
11. **Prompt 12** — Quality pass and ship.

---

*Prompt pack generated from the NexoLeal frontend gap analysis (2026-05-23) and the Awwwards inspiration scout (Cleo AI, La Revoltosa, MindMarket, Renaissance Edition, Kriss.AI, Reventador, Sidewave). Update this file as prompts evolve.*
