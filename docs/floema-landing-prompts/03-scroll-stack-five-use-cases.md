# Prompt 3 — ScrollStack: Five Full-Bleed Use-Case Panels

> **How to run.** Paste Prompt 0 first, then this prompt. Prompts 1 and 2 must already be in place.

---

## Goal

Build the editorial scroll-stack — the signature pattern where five full-bleed photographic panels stack vertically, each panel locking briefly on enter, with the lower-left section index `01` … `05` incrementing through scroll, a small vertical category chip, a monumental headline, a pill CTA with circular icon node, and a bottom-right "Demo PDF" anchor card.

---

## Tasks

### 1. Panel data `src/lib/landing-assets.ts` (extend)

Add:

```ts
export type UseCasePanel = {
  index: string;          // "01" – "05"
  vertical: 'cafeteria' | 'retail' | 'salon' | 'restaurante' | 'servicios';
  chipLabel: string;
  chipTone: 'coral' | 'sage' | 'clay' | 'mist' | 'stone';
  iconSvg: string;        // /landing/cloud/<icon>.svg
  headline: string;       // Spanish
  ctaLabel: string;
  ctaHref: string;
  bgImage: string;        // /landing/panels/<name>.jpg
  bgAlt: string;
  pdfCard?: {
    title: string;        // e.g. "Guía Cafetería"
    href: string;         // /landing/pdf/...
    miniSvg: string;
  };
};

export const useCasePanels: UseCasePanel[] = [/* 5 entries — see content map in Prompt 0 */];
```

For each panel, ship a **placeholder** JPG at `public/landing/panels/` (1600×1000, ~120kB each — flat-color or noise textures are fine; the team will replace later). Author a `README.md` in `public/landing/panels/` that names what photograph each placeholder should be replaced with (mood + composition guidance from Prompt 0's content map).

### 2. `src/components/landing/ScrollStackPanel.tsx`

A single panel component. Props: `panel: UseCasePanel`, `isLast?: boolean`.

Layout (mobile-first, all in CSS):

- `position: sticky; top: 0; height: 100svh; overflow: hidden;` — the sticky behavior is what creates the stack/peel feel.
- Background layer: `<img>` at `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;` with the panel's `bgImage`.
- Veil overlay: `position: absolute; inset: 0; background: var(--veil);` — increases to `var(--veil-strong)` on the lower 40% via a `linear-gradient(to bottom, transparent 40%, var(--veil-strong) 100%)` overlay for legibility.
- Top hairline divider drawn at ~52% viewport height (mimics the reference): `position: absolute; left: 0; right: 0; top: 52%; height: 1px; background: rgba(255,255,255,0.45);`.
- Lower-left index cluster (anchored `bottom: 38%; left: clamp(1.5rem, 5vw, 5rem);`):
  - `panel.index` in JetBrains Mono `0.875rem`, color `rgba(255,255,255,0.92)`.
  - Below it, the chip: rounded pill, `0.4rem 0.875rem`, Inter UPPERCASE `0.06em` `0.75rem`. Backgrounds by tone:
    - `coral` → `var(--chip-coral)`, ink text
    - `sage` → `var(--chip-sage)`, ink text
    - `clay` → `var(--chip-clay)`, ink text
    - `mist` → `var(--chip-mist)`, ink text
    - `stone` → `var(--chip-stone)`, ink text
  - The chip prefixes a 14×14 inline SVG (the `iconSvg`) at left.
- "Hecho para volver" eyebrow above the index, Inter `0.75rem` UPPERCASE `0.06em`, color `rgba(255,255,255,0.78)`.
- Headline block centered horizontally, anchored ~`bottom: 18%`:
  - Fraunces 500, `--display-lg`, color `rgba(255,255,255,0.96)`, max-width `22ch`, `text-wrap: balance`, `letter-spacing: -0.02em`.
  - Each line wrapped in `<span class="line">` for the line-rise reveal.
- CTA, beneath the headline:
  - A horizontal pill split into two halves — left half is a circle (56×56) with the panel's icon SVG, white fill, ink stroke; right half is a pill (`height: 56px`, white fill, ink text, ink hair border, `padding: 0 1.5rem`) with the `ctaLabel` in Inter UPPERCASE `0.06em` `0.8125rem`.
  - The two halves visually overlap by 8px so the circle reads as a "node" punched into the pill.
  - Wrap both in a single `<a href={panel.ctaHref}>`. Focus ring covers both halves.
- Bottom-right `pdfCard` (if present), anchored `bottom: 1.5rem; right: 1.5rem`:
  - White card, `border-radius: 18px`, `padding: 1.25rem 1.25rem`, `width: 18rem`, `box-shadow: 0 14px 40px -20px rgba(0,0,0,0.4)`.
  - Left: title in Fraunces `1.125rem`, `Descargar ↓` in Inter `0.75rem`, `--ink-soft`.
  - Right: 56×56 tinted square with the `miniSvg`. Tint background matches the chip tone at 18% opacity.
- "Desplaza para explorar ↓" wayfinder reuses `<ScrollToExplore />` anchored `bottom: 1.5rem; left: 50%; transform: translateX(-50%)` — hide on the last panel.

Behavior:

- `useRevealOnce` on the panel root with threshold `0.35`. When revealed, the headline lines rise (80ms stagger) and the veil layer plays `veil-clear` over 700ms (clip from top → fully revealed) — this gives the "peeled edge" feel as you scroll into each panel.
- The background image scales subtly: `transform: scale(1.02)` at rest, animates to `scale(1.0)` over 1200ms on reveal (slow Ken-Burns settle).

### 3. `src/components/landing/ScrollStack.tsx`

- Section wrapper `<section data-surface="editorial" aria-label="Casos de uso de NexoLeal">`.
- Renders the 5 panels in order. Because each panel is `position: sticky; top: 0; height: 100svh`, scrolling stacks them. The parent must have `height: calc(5 * 100svh)` to provide the scroll runway.
- Uses `useScrollProgress` on the parent to compute which panel index is currently dominant (0–4) and exposes it via React context so a small fixed "panel indicator" (three dots stacked at `right: 1.5rem; top: 50%`) can highlight the active one. The indicator dots are `8×8` circles, `--ink-soft` background, active is `--ink` and 2× wide (becomes a small dash).

### 4. Wire into route

- `src/routes/index.tsx`: render `<Hero />` followed by `<ScrollStack />`. Remove the legacy hero (`data-legacy`) elements introduced in Prompt 2.

---

## Acceptance

- Scrolling from the hero into the stack: panel 01 slides up under the hero, locks for a beat, then panel 02 peels up over it, etc., for all five panels.
- Each panel's headline rises through clip on first appearance; reverse scroll does not replay (one-shot).
- The right-side panel indicator updates as you scroll.
- The PDF card is always tappable and never overflows the viewport.
- No layout shift; build passes; Lighthouse a11y ≥ 95.
- Reduced-motion: no veil-clear, no scale settle, no rise — content is visible immediately, sticky stack still works (CSS, no JS).
