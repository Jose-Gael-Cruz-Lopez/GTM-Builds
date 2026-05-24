# Prompt 1 — Foundation, Editorial Nav, Citrine Bubble, Scroll Hooks

> **How to run.** Paste Prompt 0 (Master System Prompt) into your coding-agent session first, then paste this prompt.

---

## Goal

Lay the editorial foundation: design tokens, the two reveal hooks, the floating pill nav, the lower-left "Scroll to Explore" wayfinder, and the bottom-left citrine support bubble. After this prompt the landing route still renders the old hero, but every shared editorial primitive is wired up.

---

## Tasks

### 1. Extend `src/styles.css`

Append the full `[data-surface="editorial"]` token block, the keyframes (`line-rise`, `veil-clear`, `drift`, `citrine-pulse`), and the reduced-motion guard from Prompt 0. Do not remove or rename any existing tokens — wallet/dashboard/scanner must continue to work.

### 2. Create `src/hooks/use-reveal-once.ts`

A hook that:
- Accepts an optional `threshold` (default `0.2`) and `rootMargin` (default `'0px 0px -10% 0px'`).
- Returns a `ref` and a `revealed` boolean.
- Sets `data-revealed="true"` on the ref'd element the first time it intersects, then disconnects the observer.
- Respects `window.matchMedia('(prefers-reduced-motion: reduce)')` — when reduced, sets `revealed = true` immediately without observing.

### 3. Create `src/hooks/use-scroll-progress.ts`

A hook that:
- Returns a number `[0, 1]` representing scroll progress through a referenced element (`getBoundingClientRect().top / viewportHeight` clamped).
- Uses a single `requestAnimationFrame` loop scheduled only when the element is on screen (toggle via IntersectionObserver).
- Used by `ScrollStack` to drive the section-index counter and the peeled-edge mask.

### 4. `src/components/landing/EditorialNav.tsx`

- Fixed top, full width, padded `1.25rem 1.5rem`.
- Left cluster: NexoLeal wordmark (use the existing logo asset; if missing, render the word "NexoLeal" in Fraunces 500 at `1.5rem` with a small superscript "®"). To the right of the wordmark, a vertical hair divider, then a small `ES ▾` lang chip (visual only).
- Right cluster: a single white pill containing four links — **Producto**, **Casos**, **Precios**, **Diario**. Each link is `Inter` `0.06em` UPPERCASE, `0.8125rem`, padded `0.5rem 1rem`. The active link inverts to dark fill + light text. The pill itself has `background: rgba(255,255,255,0.92)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--hair)`, `border-radius: 9999px`, `box-shadow: 0 1px 0 rgba(0,0,0,0.04)`.
- A second smaller pill to the right with `EN ▾` (visual only — no functional language switch yet).
- On scroll past 80px, the nav pill background opacity ramps from `0.92` to `1.0` and the hair shadow strengthens. Drive this with `useScrollProgress` against the viewport (or a simple `window` scroll listener throttled to rAF; either is acceptable).
- Mobile (`< 768px`): collapse the link pill into a hamburger button on the right; tapping opens a full-screen `paper`-bg overlay with the four links stacked at `--display-lg` size, each with a `line-rise` reveal staggered 80ms.

### 5. `src/components/landing/CitrineBubble.tsx`

- Fixed bottom-left, `1.5rem` from each edge, `z-index: 60`.
- Circular button, 56×56, `background: var(--signal-citrine)`, `border: 1.5px solid var(--ink)`, `color: var(--ink)`.
- Centered icon: render an SVG of two interlinked circles (chat-bubble glyph) at 24×24. Inline SVG, no external dep.
- `aria-label="Abrir chat de soporte"`, `tabIndex` last in document.
- On mount, plays `citrine-pulse` once (1.4s), then never again.
- Clicking opens a placeholder `<dialog>` from shadcn with the headline "Hablemos" and a single field "Cuéntanos en qué te ayudamos" + submit button. Submit just `toast.success("Te respondemos en menos de 24 horas")` and closes — no backend.

### 6. `src/components/landing/ScrollToExplore.tsx`

- Absolutely positioned bottom-center (within whatever parent it's placed in), `bottom: 2rem`.
- Renders the text `Desplaza para explorar` in `Inter` UPPERCASE `0.06em` `0.75rem`, followed by a hair-thin downward arrow SVG (1px stroke, 14×14).
- Subtle infinite `translateY(0 → 4px → 0)` over 2.4s, `ease-in-out`. Disabled under reduced-motion.

### 7. Update `src/routes/__root.tsx`

- Ensure Fraunces is loaded with the optical-size + soft axis (`Fraunces:opsz,SOFT,wght@9..144,50..100,400;500`) and `JetBrains+Mono:wght@400`.
- Add `data-surface="editorial"` to a wrapper around `<Outlet />` *only* when `location.pathname === '/'`. (Read `useRouterState` from TanStack Router to gate it.) Other routes keep their existing dark/light surfaces untouched.
- Render `<EditorialNav />` and `<CitrineBubble />` only on `/`.

---

## Acceptance

- `npx vite build --mode development` passes; route tree regenerates cleanly.
- Visiting `/` shows the new top nav, the bottom-left citrine bubble (one pulse on load), and the existing landing content underneath (untouched).
- Tab order: nav links → main content → citrine bubble (last).
- Keyboard focus is visible on every interactive element.
- Reduced-motion users see no pulse, no infinite arrow bounce, and `revealed = true` from the first frame.
