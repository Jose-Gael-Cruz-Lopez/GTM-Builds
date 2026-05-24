# NexoLeal — pull requests

## Open a PR

1. Branch from `main`: `docs/…`, `feat/…`, or `fix/…`
2. Keep commits focused (one concern per commit when possible)
3. Ensure CI passes: Backend CI + Frontend CI
4. Link related issues or verification steps from [`VERIFICATION.md`](VERIFICATION.md)

## Review checklist

- [ ] No secrets in diff (`.env`, `.dev.vars`, service role keys)
- [ ] Backend: `npm test` if `backend/**` changed
- [ ] Frontend: `npm run build` if `frontend/**` changed
- [ ] README or DEPLOY.md updated if deploy/env behavior changed
- [ ] Supabase migrations documented if schema changed

## Merge strategy

Use **merge commit** (default) to preserve granular commit history on `main`.
