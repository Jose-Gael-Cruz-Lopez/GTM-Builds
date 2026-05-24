# Frontend Revamp Prompts (completed)

These prompts were executed in [PR #5](https://github.com/Jose-Gael-Cruz-Lopez/GTM-Builds/pull/5) and merged to `main` on 2026-05-24.

Kept here for historical reference only — do not re-run unless rebuilding from scratch.

## Prompts

| Prompt | Surface | Status |
|--------|---------|--------|
| 05 | Onboarding brand step + join QR | ✅ Shipped |
| 07 | Staff scanner `/scan` | ✅ Shipped |
| 08 | Owner dashboard | ✅ Shipped |
| 09 | Clients & visits sub-pages | ✅ Shipped |
| 10 | Settings hub | ✅ Shipped |
| 11 | Campaigns revamp | ✅ Shipped |
| 12 | Quality pass (PWA, a11y, CI) | ✅ Shipped |

## Verification

```bash
cd frontend && npm ci && npm run lint && npx tsc --noEmit && npm run build
```
