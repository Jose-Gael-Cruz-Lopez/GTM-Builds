# Changelog

All notable changes to NexoLeal are documented here.

## 2026-05-24

### Fixed
- **Sidebar auth** — Dashboard nav no longer redirects to `/login` on client-side navigation (PR #7).
- **Visitas API 500** — `GET /visits/business-visits` route ordering fixed; no longer captured by `/:visitId`.
- **Business GET 404** — `GET /businesses/:id` uses service role after auth validation.
- **Supabase env in production** — `.env.production` + `wrangler.jsonc` vars; CI builds no longer ship empty config.

### Changed
- Frontend CI bumped to Node.js 22.
- README and deploy docs updated for live Cloudflare Workers URLs.

## 2026-05-23

### Added
- Full frontend revamp (prompts 05–12): onboarding brand, settings hub, campaigns IA, clients/visits/redemptions, staff scanner, owner dashboard.
- Repo cleanup: archived prompts, root `.gitignore`, nested git removed.

### Added (backend)
- Brand fields on `businesses` (`tagline`, `logo_url`, `primary_color`, `address`, `phone`).
- Campaign `sent_at` + `status: sent` support.
- Rewards list/patch endpoints for redemptions page.
