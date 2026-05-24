# Remaining Frontend Prompts

These are the prompts not yet executed in PR #3. Each file is self-contained — it includes the Master System Prompt (Prompt 0) followed by the surface-specific prompt — so you can paste any single file into a fresh coding-agent session and run it independently.

## Files

- [`prompt-05-onboarding-completion-brand-step-join-qr.md`](./prompt-05-onboarding-completion-brand-step-join-qr.md) — Prompt 5: Onboarding Completion (Brand step, Join QR)
- [`prompt-07-staff-scanner-scan.md`](./prompt-07-staff-scanner-scan.md) — Prompt 7: Staff Scanner (`/scan`)
- [`prompt-08-business-owner-dashboard-dashboardbusinessid.md`](./prompt-08-business-owner-dashboard-dashboardbusinessid.md) — Prompt 8: Business Owner Dashboard (`/dashboard/$businessId`)
- [`prompt-09-client-list-visit-feed-sub-pages.md`](./prompt-09-client-list-visit-feed-sub-pages.md) — Prompt 9: Client List & Visit Feed Sub-pages
- [`prompt-10-settings-settingsbusinessid.md`](./prompt-10-settings-settingsbusinessid.md) — Prompt 10: Settings (`/settings/$businessId`)
- [`prompt-11-campaigns-revamp-campaignsbusinessid.md`](./prompt-11-campaigns-revamp-campaignsbusinessid.md) — Prompt 11: Campaigns Revamp (`/campaigns/$businessId`)
- [`prompt-12-quality-pass-a11y-motion-empty-states-errors.md`](./prompt-12-quality-pass-a11y-motion-empty-states-errors.md) — Prompt 12: Quality Pass: A11y, Motion, Empty States, Errors

## Suggested execution order

1. **Prompt 7** — Staff Scanner (`/scan`)
2. **Prompt 8** — Owner Dashboard (`/dashboard/$businessId`)
3. **Prompt 5** — Onboarding completion (brand step, join QR)
4. **Prompt 10** — Settings hub (`/settings/$businessId`)
5. **Prompt 11** — Campaigns revamp (`/campaigns/$businessId`)
6. **Prompt 9** — Clients & Visits sub-pages (with mis-mounted-backend fallback)
7. **Prompt 12** — Quality pass (a11y, motion, empty states, errors, CI)

## Branch convention

Each prompt should be run on its own branch off `main` and opened as a separate PR:

```
feat/frontend-revamp-prompt-07-scanner
feat/frontend-revamp-prompt-08-dashboard
feat/frontend-revamp-prompt-05-onboarding
feat/frontend-revamp-prompt-10-settings
feat/frontend-revamp-prompt-11-campaigns
feat/frontend-revamp-prompt-09-clients-visits
feat/frontend-revamp-prompt-12-quality
```

## Verification command

After each prompt, run from `frontend/`:

```bash
npx vite build --mode development 2>&1 | tail -10
```
