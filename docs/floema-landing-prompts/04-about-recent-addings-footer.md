# Prompt 4 — About Block, Recent Addings, Editorial Footer

> **How to run.** Paste Prompt 0 first, then this prompt. Prompts 1–3 must already be in place.

---

## Goal

Close the page with the three remaining editorial surfaces: the **About block** (huge ragged-right serif paragraph with a small inset image and two news cards floating right), the **Recent Addings** strip (two-up product showcase with chips, swatches, "Explore →" CTA), and the **Editorial Footer** (paper bg, oversized wordmark, two-column links, hairline divider, fine print).

---

## Tasks

### 1. `src/components/landing/AboutBlock.tsx`

Section background `var(--paper)`, top padding `clamp(4rem, 10vw, 9rem)`, bottom padding `clamp(4rem, 8vw, 7rem)`.

**Left column** (occupies ~62% of the row on desktop, full-width on mobile):

- Small kicker block, top-left:
  - "NexoLeal®" in Fraunces 500, `1.5rem`.
  - "Est." and "2025" stacked beneath in the same font, ink color, line-height 1.05.
- A small inset image (~160×220) anchored *inline at the start of the paragraph*, floated left with `shape-outside` so the body text wraps around its lower edge. Use a soft NexoLeal product photo placeholder (a phone showing a stamp card on a wood table); ship as `public/landing/about/inset.jpg`.
- The body paragraph in Fraunces 400, `--display-md`, color `--ink`, line-height 1.05, `letter-spacing: -0.015em`, max-width `28ch` for the first 2 lines (so it hugs the inset image) and expands to `36ch` thereafter. Author **fresh, NexoLeal-native** copy (do not copy from any reference site). Suggested seed (rewrite freely to match your brand voice):

  > "Construimos NexoLeal para los negocios que recuerdan el nombre de cada cliente. La fidelidad no se compra con descuentos: se gana con atención. Cada flujo, cada mensaje y cada recompensa fue diseñado para que volver sea la opción más natural."

- Wrap each sentence in a `<span class="line">` and gate with `useRevealOnce` for the line-rise animation (120ms stagger per sentence). The image inset fades in (opacity 0 → 1, 600ms) gated on the same reveal.

**Right column** (~34% on desktop, becomes a horizontal scroller on mobile):

- "Diario reciente ↓" eyebrow at the top-right of the section, Inter UPPERCASE `0.06em` `0.75rem`, color `--ink-soft`.
- Two stacked news cards (or side-by-side on tablet), each:
  - Card root: `border-radius: 18px`, hair border, background `--paper-warm`, `padding: 0` (image bleeds to corners).
  - 16:11 image at top with `border-radius: 18px 18px 0 0`. Use placeholder JPGs at `public/landing/diary/*.jpg`.
  - Body padding `1rem 1.125rem 1.25rem`:
    - Title in Fraunces 500, `1.0625rem`, `--ink`, line-height 1.2, max 2 lines (use `-webkit-line-clamp: 2`).
    - Date in Inter `0.75rem`, `--ink-soft`, top-margin `0.5rem`.
  - Whole card is a link (`<a>`) wrapping all children. Hover/focus: card rises 4px and shadow grows from `0 1px 0 var(--hair)` to `0 12px 28px -16px rgba(0,0,0,0.25)` over 220ms.
- Card content (NexoLeal-native — placeholder seeds, rewrite freely):
  1. "Cómo un café de barrio recuperó 40% de sus clientes con fidelidad en WhatsApp" — `15 de mayo, 2026`
  2. "Cuatro errores comunes al lanzar un programa de puntos (y cómo evitarlos)" — `2 de mayo, 2026`

### 2. `src/components/landing/RecentAddings.tsx`

A two-column product showcase modeled on the reference, but with NexoLeal-native subjects.

- Top eyebrow, left: "Lo nuevo en NexoLeal ↓" — Inter UPPERCASE `0.06em` `0.75rem`, `--ink-soft`.
- Two columns, equal width, generous gap `clamp(1.5rem, 4vw, 3rem)`. Each column:
  - Top row: chip (same pattern as ScrollStackPanel chips, but on `--paper` bg with hair border) + product name in Fraunces 500 `1.125rem`.
  - Featured visual centered in the column on a soft `--paper-warm` floor. Use placeholder SVG illustrations (reuse `loyalty-card.svg`, `qr-code.svg` style) sized ~360×420. The visual sits inside a `border-radius: 24px` tile with `background: linear-gradient(180deg, var(--paper-warm) 0%, var(--paper) 100%)` and a faint cast shadow beneath.
  - Bottom row (left-aligned): "Colores" label, Inter `0.75rem` UPPERCASE `0.06em`, `--ink-soft`, followed by 4 swatch dots (12×12, hair border) + a `+N` chip.
  - Bottom row (right-aligned): a pill CTA `Explorar →` — dark fill, light text, height 44px.

Two columns to ship:

1. **Tarjeta de Sellos · Plaza** — chip `Cafetería` (coral). Visual: oversized loyalty card. Swatches: cream, ink, signal, citrine.
2. **QR de Mostrador · Palmer** — chip `Retail` (sage). Visual: framed QR stand. Swatches: paper, ink, sage, clay.

- Each card uses `useRevealOnce` with a `stamp-cell`-style scale tick (1 → 1.02 → 1 over 380ms) on reveal — gives the page weight without being theatrical.

### 3. `src/components/landing/EditorialFooter.tsx`

Section background `var(--paper-warm)`, padding `clamp(3rem, 8vw, 6rem) clamp(1.5rem, 5vw, 5rem)`.

- Top row, left-aligned: the wordmark "NexoLeal®" rendered at an oversized display size — Fraunces 500, `clamp(3.5rem, 12vw, 9rem)`, `--ink`, `letter-spacing: -0.03em`. This is the footer's signature.
- Beneath the wordmark, a small line: "Hecho en México · 2026" in Inter `0.875rem`, `--ink-soft`.
- Two-column link list, right-aligned on desktop, stacked on mobile:
  - **Producto** — Características · Precios · Demo · Cambios
  - **Empresa** — Sobre · Diario · Contacto · Trabaja con nosotros
  - **Legal** — Términos · Privacidad · Cookies
  - Each heading: Inter UPPERCASE `0.06em` `0.75rem`, `--ink-soft`. Each link: Fraunces 400 `1rem`, `--ink`, line-height 1.8, with a 1px underline that draws in on hover (use `background-image: linear-gradient(currentColor, currentColor)` `background-size: 0 1px → 100% 1px` over 220ms `ease-editorial`).
- Hairline divider, 1px `var(--hair)`, full width, vertical margin `clamp(2rem, 5vw, 4rem)`.
- Fine print row, two columns:
  - Left: "© 2026 NexoLeal. Todos los derechos reservados."
  - Right: small social glyphs (Instagram, LinkedIn, X) — 20×20 inline SVGs, color `--ink-soft`, hover to `--ink`.
- Both fine-print columns: Inter `0.75rem`, `--ink-soft`.

### 4. Wire into route

`src/routes/index.tsx` final composition:

```
<Hero />
<ScrollStack />
<AboutBlock />
<RecentAddings />
<EditorialFooter />
```

The `<EditorialNav />` and `<CitrineBubble />` continue to live in `__root.tsx` gated on `pathname === '/'`.

---

## Acceptance

- Full page scrolls cleanly from hero → 5 use-case panels → about → recent addings → footer.
- About-block paragraph wraps around the inset image with `shape-outside`; on mobile the image moves above the paragraph and fills column width.
- News cards lift on hover/focus; full card is clickable; focus ring visible.
- Recent Addings tiles play the stamp-cell tick once on reveal.
- Footer wordmark is huge but doesn't horizontally overflow on any breakpoint.
- `npx vite build --mode development` passes.
- Lighthouse a11y on `/` ≥ 95, performance ≥ 85 on a throttled desktop run.
- Reduced-motion: every animation in this prompt is bypassed — content renders in its final state.

---

## Final commit / PR

After this prompt passes acceptance:

```bash
cd /home/user/workspace/GTM-Builds
git add -A
git commit -m "feat(landing): Floema-inspired editorial landing for NexoLeal

- Editorial design tokens scoped via data-surface=\"editorial\"
- Fraunces display + Inter UI + JetBrains Mono indices
- Floating pill nav, citrine support bubble, scroll-to-explore
- Hero with floating cloud of NexoLeal surfaces + line-rise reveal
- Five-panel scroll-stack (Cafetería / Retail / Salón / Restaurante / Servicios)
  with sticky stack, peeled-edge veil, lower-left section index, PDF anchor cards
- About block with shape-outside inset and floating diary cards
- Recent Addings two-up showcase
- Editorial footer with oversized wordmark
- All copy in Spanish (LatAm neutral), reduced-motion safe, a11y ≥ 95"
git push -u origin feat/landing-floema-inspired
gh pr create --base main --head feat/landing-floema-inspired \
  --title "feat(landing): editorial Floema-inspired landing for NexoLeal" \
  --body "..." --repo Jose-Gael-Cruz-Lopez/GTM-Builds
```
