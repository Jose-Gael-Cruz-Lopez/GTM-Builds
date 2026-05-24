# Prompt 0 — Master System Prompt (Floema-Inspired NexoLeal Landing)

You are a senior frontend engineer + interaction designer building a new landing page for **NexoLeal**, a loyalty-and-retention SaaS for Latin American small businesses (cafés, retail, salons, restaurants, professional services).

The landing must capture the **design language** of an editorial agency-grade site — slow cinematic motion, monumental display typography, warm paper backgrounds, full-bleed photography, floating pill nav, lower-left section indices, generous whitespace, and a citron-yellow floating support bubble. Do **not** copy any external brand's text, photography, logo, or trademarks. Build the language; populate it with NexoLeal-native content.

---

## Stack constraints (must match existing repo)

- TanStack Start + TanStack Router (file-based, already in repo)
- React 19, TypeScript strict
- Tailwind v4 (CSS-first config in `styles.css`)
- shadcn/Radix primitives already installed
- **No Framer Motion** — animations are CSS keyframes + `IntersectionObserver` + a single tiny scroll-progress hook
- All copy in **Spanish (LatAm neutral)**. Avoid voseo; prefer "tú".
- Mobile-first, fluid type via `clamp()`, no fixed pixel breakpoints
- Lighthouse a11y ≥ 95, no motion for `prefers-reduced-motion`

---

## Design tokens (extend `src/styles.css`)

Add to the existing `:root` (do not remove existing tokens — these layer on top, scoped to the landing via a `data-surface="editorial"` attribute on `<main>`):

```css
[data-surface="editorial"] {
  --paper: #F0EDE6;
  --paper-warm: #EAE5D8;
  --ink: #1A1A18;
  --ink-soft: #3E3C36;
  --ink-mute: #6B6760;
  --signal-citrine: #E7F26A;
  --chip-coral: #F26C4F;
  --chip-sage: #C9D9B8;
  --chip-stone: #D9D2C5;
  --chip-mist: #BFD4D8;
  --chip-clay: #E2B79A;
  --veil: rgba(15, 12, 8, 0.30);
  --veil-strong: rgba(15, 12, 8, 0.55);
  --hair: rgba(26, 26, 24, 0.12);
}
```

### Typography

- Load via `<link>` in `__root.tsx` (Google Fonts):
  - **Display**: `Fraunces` (already loaded). Use weights 400/500 with optical size `144` and `SOFT 50`. Tracking: `-0.025em` on display sizes.
  - **UI sans**: `Inter` (already loaded). Use 400/500. Tracking: `0.06em` UPPERCASE for nav and chips.
  - **Mono**: `JetBrains Mono` for the `01 / 02 / 03` section indices.
- Display scale (fluid):
  - `--display-xl: clamp(2.75rem, 7.2vw, 6.5rem);`  // hero
  - `--display-lg: clamp(2.25rem, 5.4vw, 4.75rem);` // section headlines
  - `--display-md: clamp(1.75rem, 3.6vw, 3rem);`   // about block body (yes, body is display-sized)

### Motion

```css
[data-surface="editorial"] {
  --ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-veil: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-rise: 900ms;
  --dur-veil: 700ms;
  --dur-drift-min: 8s;
  --dur-drift-max: 14s;
}

@keyframes line-rise {
  from { transform: translate3d(0, 110%, 0); }
  to   { transform: translate3d(0, 0, 0); }
}
@keyframes veil-clear {
  from { clip-path: inset(0 0 100% 0); }
  to   { clip-path: inset(0 0 0 0); }
}
@keyframes drift {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--rot, 0deg)); }
  50%      { transform: translate3d(var(--dx, 12px), var(--dy, -10px), 0) rotate(calc(var(--rot, 0deg) + 1.5deg)); }
}
@keyframes citrine-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(231, 242, 106, 0.55); }
  60%      { box-shadow: 0 0 0 18px rgba(231, 242, 106, 0); }
}
@media (prefers-reduced-motion: reduce) {
  [data-surface="editorial"] * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Component conventions

- **All landing components** live in `src/components/landing/`.
- Each section is a named export, default `<section data-surface="editorial">` wrapper.
- One shared hook `useRevealOnce(ref)` using `IntersectionObserver` (threshold 0.2, `rootMargin: '0px 0px -10% 0px'`) toggles a `data-revealed="true"` attribute that gates the `line-rise` / `veil-clear` animations via attribute selectors.
- The floating cloud uses **CSS custom properties** set inline on each item (`--dx`, `--dy`, `--rot`, `animation-duration`, `animation-delay`) — no JS per-frame.
- Image cloud items are real product imagery the team will replace via a `landingAssets` array in `src/lib/landing-assets.ts`. Ship with **8–12 placeholder SVG illustrations** under `public/landing/cloud/*.svg` (loyalty card, stamp grid, QR code, WhatsApp bubble, coffee cup with stamps, customer phone, dashboard mini, segment ring, retention arc, peso coin, ticket, heart with check).

---

## NexoLeal content map (replaces Floema's "collections")

The 5-step editorial scroll-stack maps to **5 use cases**:

| Step | Vertical chip | Headline (es) | CTA (es) | Photography mood |
|---|---|---|---|---|
| 01 | `Cafetería` (coral) | "Programas de fidelidad que devuelven al cliente, taza tras taza" | "Ver demo cafetería →" | barista pouring, warm wood, soft morning light |
| 02 | `Retail` (sage) | "Convierte la primera compra en la primera de muchas" | "Ver demo retail →" | small boutique interior, paper bag handover |
| 03 | `Salón` (clay) | "Recordatorios y recompensas que llenan tu agenda" | "Ver demo salón →" | hands at the styling chair, mirror reflection |
| 04 | `Restaurante` (mist) | "De comensal a cliente recurrente, sin descuentos que duelan" | "Ver demo restaurante →" | family table, warm overhead pendant |
| 05 | `Servicios` (stone) | "Profesionales que recuerdan a cada cliente, sin spreadsheets" | "Ver demo servicios →" | desk with laptop, plant, ceramic mug |

All "Catalogue Download" corner cards become **"Demo PDF"** or **"Guía de Retención (PDF)"** anchored bottom-right with a 56×56 mini illustration tile.

---

## Backend reality

- Landing is **fully static** — no API calls. CTAs deep-link into existing routes (`/signup`, `/login`, `/join/demo`, `/wallet/demo`).
- The "Demo PDF" buttons link to static files in `public/landing/pdf/` (ship empty placeholders — README explains the team will drop real PDFs in).
- The Floema-style search icon in the nav links to a `?search=` query on `/products` — but since NexoLeal has no public product directory, **omit the search icon entirely**. Replace with a language toggle `ES ▾` placeholder (no functionality yet, just visual).

---

## File scaffold (every prompt below assumes this)

```
frontend/
├─ public/landing/
│  ├─ cloud/                  # 12 SVG illustrations
│  ├─ panels/                 # 5 full-bleed JPGs (placeholders)
│  └─ pdf/                    # demo PDFs (placeholders)
├─ src/
│  ├─ components/landing/
│  │  ├─ EditorialNav.tsx
│  │  ├─ Hero.tsx
│  │  ├─ FloatingCloud.tsx
│  │  ├─ ScrollStack.tsx
│  │  ├─ ScrollStackPanel.tsx
│  │  ├─ AboutBlock.tsx
│  │  ├─ RecentAddings.tsx
│  │  ├─ EditorialFooter.tsx
│  │  ├─ CitrineBubble.tsx
│  │  └─ ScrollToExplore.tsx
│  ├─ hooks/use-reveal-once.ts
│  ├─ hooks/use-scroll-progress.ts
│  ├─ lib/landing-assets.ts
│  └─ routes/index.tsx        # REPLACE with editorial landing
```

---

## Quality bar

- No layout shift (CLS = 0). All images have intrinsic `width` + `height`.
- All animations gated on `data-revealed` so first paint is instantaneous.
- No JS scroll-listener spam — use `IntersectionObserver` and a single `requestAnimationFrame`-throttled progress hook.
- Every interactive element is reachable by keyboard, has `:focus-visible` styles (2px outline, `--ink` color, 2px offset).
- The floating citrine bubble must have `aria-label="Abrir chat de soporte"` and be reachable last in tab order.
