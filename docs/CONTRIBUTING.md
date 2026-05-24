# Contributing

## Branch workflow

1. Create a feature branch from `main`: `git checkout -b feat/my-change`
2. Make focused commits with [Conventional Commits](https://www.conventionalcommits.org/) prefixes: `feat:`, `fix:`, `docs:`, `chore:`
3. Run checks before pushing:

```bash
cd backend && npm test && npx tsc --noEmit
cd ../frontend && npm run lint && npx tsc --noEmit && npm run build
```

4. Open a PR against `main`. CI runs automatically for `frontend/**` and `backend/**` changes.

## Deploy

- **Frontend:** merges to `main` auto-deploy `tanstack-start-app` via GitHub Actions.
- **Backend:** CI deploys `nexoleal-backend-production` on main; live frontend uses `nexoleal-backend` — run `npx wrangler deploy` in `backend/` after API changes.

See [`docs/VERIFICATION.md`](VERIFICATION.md) after deploy.

## Secrets

Never commit `.env`, `.dev.vars`, or service role keys. The Supabase **anon** key in `frontend/.env.production` is intentionally public (same as client bundle).
