# Floema-Inspired NexoLeal Landing — Prompt Pack

A four-prompt build pack to ship an editorial-grade landing page for NexoLeal. The design language is inspired by award-winning agency portfolio sites — slow cinematic motion, monumental serif typography, warm paper backgrounds, full-bleed photographic storytelling, lower-left section indices, and a floating citrine support bubble — translated to NexoLeal's loyalty-and-retention product domain in Spanish (LatAm neutral).

> **Important.** The visual language is inspired by reference sites; the copy, photography, illustrations, brand marks, and content are **all NexoLeal-native**. Do not copy text, images, or trademarks from any reference. Author fresh content using the prompts' guidance.

## Files

| File | Surface |
|---|---|
| `00-master-system-prompt.md` | Tokens, motion, content map, file scaffold, quality bar |
| `01-foundation-and-nav.md` | Tokens in styles.css, reveal/scroll hooks, editorial nav, citrine bubble, scroll-to-explore |
| `02-hero-and-floating-cloud.md` | Hero with monumental headline + 12-item drifting cloud of NexoLeal surfaces |
| `03-scroll-stack-five-use-cases.md` | Sticky 5-panel scroll stack (Cafetería · Retail · Salón · Restaurante · Servicios) |
| `04-about-recent-addings-footer.md` | About block with shape-outside, diary cards, recent-addings two-up, editorial footer |

## How to run

Each prompt file is **partial** by design — it expects Prompt 0 (the master) to be pasted into the agent session first, then the surface prompt. The pack is split this way so each surface can be reviewed and merged independently as its own PR.

For each surface:

1. Paste `00-master-system-prompt.md` into a fresh coding-agent session.
2. Paste the surface prompt (`01-…` then `02-…` then `03-…` then `04-…`).
3. Run `cd frontend && npx vite build --mode development 2>&1 | tail -10` to verify.
4. Commit on a dedicated branch and open a PR to `main`.

## Suggested execution order

1. **Prompt 1** — Foundation (must come first; everything else depends on tokens + hooks)
2. **Prompt 2** — Hero
3. **Prompt 3** — ScrollStack
4. **Prompt 4** — About + Recent Addings + Footer (also performs the final commit & PR)

## Branch convention

```
feat/landing-prompt-01-foundation
feat/landing-prompt-02-hero
feat/landing-prompt-03-scroll-stack
feat/landing-prompt-04-about-footer
```

Or, if running the pack end-to-end in one session, use a single branch:

```
feat/landing-floema-inspired
```

## Verification command

After every prompt, from `frontend/`:

```bash
npx vite build --mode development 2>&1 | tail -10
```

Plus a manual a11y pass: keyboard-only navigation, focus visibility, reduced-motion check (`prefers-reduced-motion: reduce`), screen-reader landmark check.

## What this pack delivers

- Editorial design tokens (`paper`, `ink`, `signal-citrine`, vertical chip tones) scoped via `data-surface="editorial"` so existing wallet/dashboard/scanner surfaces are untouched
- Fraunces (display) + Inter (UI) + JetBrains Mono (indices), all already loaded in the repo
- CSS-only motion: `line-rise`, `veil-clear`, `drift`, `citrine-pulse`, with full `prefers-reduced-motion` bypass
- A floating pill nav, lower-left scroll-to-explore wayfinder, bottom-left citrine support bubble
- A hero with monumental headline and a 12-item drifting cloud of NexoLeal product surfaces (loyalty card, stamps, QR, dashboard tiles, etc.)
- A five-panel sticky scroll-stack with peeled-edge reveals and bottom-right PDF anchor cards
- An editorial about block with `shape-outside` paragraph wrap and floating diary cards
- A two-up "Recent Addings" product showcase with chips, swatches, and "Explorar →" CTAs
- An editorial footer with an oversized wordmark and three columns of links

## What this pack does NOT do

- No backend changes — landing is fully static, CTAs deep-link to existing routes
- No new dependencies — uses only what's already in `package.json`
- No copying of any reference site's text, photography, or brand marks
