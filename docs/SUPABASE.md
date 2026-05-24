# Supabase — NexoLeal

## Project

| | |
|---|---|
| **Project ID** | `lajrjnjyvbpaaspzgpvh` |
| **URL** | https://lajrjnjyvbpaaspzgpvh.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/lajrjnjyvbpaaspzgpvh |

## Schema setup

### 1. Base schema (required once)

Run [`backend/supabase-schema.sql`](../backend/supabase-schema.sql) in **SQL Editor**. Idempotent — safe to re-run.

Creates 8 tables, indexes, RLS policies, and triggers.

### 2. Incremental migrations

Apply files in [`frontend/supabase/migrations/`](../frontend/supabase/migrations/) in timestamp order:

| Migration | Adds |
|-----------|------|
| `20260523221428_…` | Initial Lovable schema sync |
| `20260523222033_…` | Additional schema adjustments |
| `20260524000000_business_brand_and_campaign_sent.sql` | `businesses.tagline`, `logo_url`, `primary_color`, `address`, `phone`; `campaigns.sent_at` |

## Tables

| Table | Purpose |
|-------|---------|
| `businesses` | Owner businesses (name, category, brand, plan) |
| `loyalty_configs` | Stamps required, reward description per business |
| `clients` | End-customer profiles (linked to Supabase Auth) |
| `client_business_loyalty` | Stamp count, status, last visit per client×business |
| `visits` | Staff-scanned visit records |
| `rewards` | Unlocked rewards (redemption tracking) |
| `campaigns` | AI-generated marketing drafts |
| `staff_keys` | Hashed staff scanner keys |

## Row Level Security

RLS is **enabled** on all tables. The backend Worker uses:

- **Service role** for admin routes (after JWT ownership check in middleware)
- **Anon key** only where end-user JWT is forwarded (rare)

Frontend uses Supabase JS with the **anon key** for auth sessions and owner business lookup (`useOwnedBusiness`).

## Keys

| Key | Where | Never commit? |
|-----|-------|---------------|
| **anon** | `frontend/.env.production`, client bundle | Public (by design) |
| **service_role** | `backend/.dev.vars`, Cloudflare secrets | **Yes — secret** |

## Verify connectivity

```bash
curl -s "https://lajrjnjyvbpaaspzgpvh.supabase.co/rest/v1/businesses?limit=1" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
```

Expected: JSON array (may be empty).
