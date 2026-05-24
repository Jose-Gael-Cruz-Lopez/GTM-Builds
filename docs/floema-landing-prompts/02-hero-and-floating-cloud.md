# Prompt 2 — Hero + Floating Cloud of NexoLeal Surfaces

> **How to run.** Paste Prompt 0 first, then this prompt. Prompt 1 must already be merged or applied locally.

---

## Goal

Build the opening surface: a `paper`-bg hero with a monumental serif headline that rises through a clip-mask on load, surrounded by a cloud of ~12 floating NexoLeal product surfaces (loyalty cards, stamps, QR codes, dashboard fragments, WhatsApp bubbles) drifting on independent sine paths with slight parallax to mouse position. This is the visual hook of the page.

---

## Tasks

### 1. Asset registry `src/lib/landing-assets.ts`

Export a typed array:

```ts
export type CloudItem = {
  id: string;
  src: string;          // path under /public/landing/cloud/
  alt: string;          // Spanish
  w: number;            // intrinsic width in px (no CLS)
  h: number;
  top: string;          // CSS percent, e.g. "18%"
  left: string;
  scale: number;        // 0.6 – 1.1
  rot: number;          // -8 to 8 deg
  driftSeconds: number; // 8 – 14
  driftDelay: number;   // 0 – 6
  dx: number;           // peak px X offset
  dy: number;           // peak px Y offset
  parallax: number;     // 0 (still) – 1 (full mouse coupling)
};

export const cloudItems: CloudItem[] = [/* 12 entries */];
```

Author 12 distinct entries spread across the viewport with deliberate negative space *behind* the headline (leave a roughly `60vw × 30vh` clearance centered around the headline anchor). Each entry references a placeholder SVG you create at `public/landing/cloud/`:

1. `loyalty-card.svg` — front of a NexoLeal stamp card (10-slot grid, brand colors)
2. `stamp-cluster.svg` — three coffee-cup stamps overlapping
3. `qr-code.svg` — stylized QR with rounded corners
4. `whatsapp-bubble.svg` — chat bubble with a tiny "✓✓" double-tick
5. `phone-wallet.svg` — phone outline with a loyalty card peeking out
6. `dashboard-tile.svg` — mini KPI tile reading "+18%"
7. `segment-ring.svg` — donut chart with three segments
8. `retention-arc.svg` — a line chart with one rising arc
9. `peso-coin.svg` — a coin embossed with "$"
10. `ticket.svg` — a small receipt with a perforated edge
11. `heart-check.svg` — heart with a check inside
12. `confetti-burst.svg` — five tiny celebrate streamers

Keep each SVG ≤ 4kB, two-color (use `currentColor` + one accent so they pick up the page's ink tone).

### 2. `src/components/landing/FloatingCloud.tsx`

- Absolutely positioned full-bleed inside the hero section (`absolute inset-0 pointer-events-none`).
- Renders each `CloudItem` as an `<img>` (use the native `loading="eager"` for the first 6, `loading="lazy"` for the rest, and `decoding="async"` on all).
- Inline style per item:
  ```ts
  {
    top: item.top, left: item.left,
    width: item.w, height: item.h,
    transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rot}deg)`,
    '--dx': `${item.dx}px`,
    '--dy': `${item.dy}px`,
    '--rot': `${item.rot}deg`,
    animation: `drift ${item.driftSeconds}s ${item.driftDelay}s ease-in-out infinite`,
    opacity: 0.85,
  }
  ```
- A *single* `mousemove` listener on the hero element, throttled with `requestAnimationFrame`, sets two CSS variables on the cloud container: `--mx` and `--my` (normalized -1 → 1). Each item's wrapper additionally applies `translate(calc(var(--mx) * parallaxPx), calc(var(--my) * parallaxPx))` via inline style multiplied by `item.parallax * 18`.
- Under `prefers-reduced-motion`, skip the mousemove listener and replace the `drift` animation with a static transform.

### 3. `src/components/landing/Hero.tsx`

- Section sized `min-height: 100svh`, `background: var(--paper)`, `position: relative`, `overflow: hidden`.
- Renders `<FloatingCloud />` as the first child.
- Centered headline block:
  - Eyebrow chip (Inter UPPERCASE `0.06em` `0.75rem` on `--ink-soft`) reading `NexoLeal · Fidelidad para tu negocio`.
  - H1 in Fraunces 500, `--display-xl`, `line-height: 0.95`, `letter-spacing: -0.025em`, color `--ink`, max-width `18ch`, centered, balanced (`text-wrap: balance`).
  - **Headline copy (Spanish, NexoLeal-native — do not copy from any reference site):**
    > "Hecho para volver. Una y otra vez."
  - Subhead beneath, Inter 400, `1.0625rem`, color `--ink-soft`, max-width `46ch`, centered:
    > "La plataforma de fidelidad y retención para cafés, salones y pequeños comercios en México. Sin apps. Sin tarjetas físicas. Solo conversaciones que vuelven."
- Each word of the H1 is wrapped in a `<span class="line">` (split by line, not by word) so the `line-rise` animation can stagger by 80ms per line. Use a wrapper with `overflow: hidden` so the rise reveals correctly.
- Below the subhead, two CTAs side-by-side:
  - Primary pill: dark fill (`--ink`), light text (`--paper`), `0.875rem 1.5rem`, `border-radius: 9999px`, text `Comenzar gratis →`. Links to `/signup`.
  - Secondary pill: white fill, dark text, hair border, `Ver demo en 30 s`. Links to `/wallet/demo`.
- `<ScrollToExplore />` placed at the bottom of the hero.

### 4. Wire reveal

- The hero uses `useRevealOnce` on the headline block. CSS for line rise:
  ```css
  .hero h1 .line { display: inline-block; transform: translate3d(0, 110%, 0); }
  [data-revealed="true"] .hero h1 .line {
    animation: line-rise var(--dur-rise) var(--ease-editorial) forwards;
  }
  [data-revealed="true"] .hero h1 .line:nth-child(2) { animation-delay: 80ms; }
  [data-revealed="true"] .hero h1 .line:nth-child(3) { animation-delay: 160ms; }
  ```
- The CTAs and subhead use a softer fade-up (16px → 0, opacity 0 → 1, 700ms ease-out) gated on the same `data-revealed`.

### 5. Replace landing route

- Modify `src/routes/index.tsx`: import and render `<Hero />` as the only section for now (above the existing legacy content, which stays so we don't break the page mid-build). Mark the legacy hero with a `data-legacy` attribute so the next prompts can remove it cleanly.

---

## Acceptance

- First paint shows the paper background, the cloud at low opacity, and the headline immediately if reduced-motion is on.
- With motion enabled: cloud drift starts at first frame; headline lines rise in sequence ~900ms; subhead and CTAs fade up after ~400ms delay.
- Moving the mouse across the hero shifts cloud items by up to ~18px (scaled by each item's `parallax`); items still drift on their independent sine paths.
- Resizing the window does not cause CLS — all images have explicit `width`/`height`.
- Build passes: `npx vite build --mode development`.
- Lighthouse a11y on the hero: ≥ 95.
