# Agent Prompt — 02: Supabase Client

## Context

You are building the **NexoLeal Cloudflare Workers backend** — Wave 1B. Your job is to create the typed Supabase REST client and all TypeScript database type definitions. This runs in parallel with the Project Setup agent.

The backend connects to Supabase via the **PostgREST HTTP API** (not the Supabase JS SDK — that SDK does not run in Cloudflare Workers). All database operations go through `fetch` calls to `{SUPABASE_URL}/rest/v1/...`.

**Project Supabase URL**: `https://lajrjnjyvbpaaspzgpvh.supabase.co`
Use this value as `SUPABASE_URL` in `.dev.vars` and `wrangler secret put`.

A teammate is building the actual Supabase tables. Your types must match the schema described below exactly. If the teammate later changes the schema, these types will need updating.

---

## Database Schema

Your teammate is building these tables in Supabase. Use these exact column names and types.

### `businesses`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
category        text NOT NULL  -- 'barbershop' | 'salon' | 'vet' | 'cafe' | 'gym' | 'other'
owner_id        uuid NOT NULL   -- references auth.users(id)
is_active       boolean NOT NULL DEFAULT true
plan            text NOT NULL DEFAULT 'free'  -- 'free' | 'pro'
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

### `loyalty_configs`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id         uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
stamps_required     integer NOT NULL DEFAULT 10
reward_description  text NOT NULL DEFAULT 'Free service'
is_active           boolean NOT NULL DEFAULT true
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
```

### `clients`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
auth_id     uuid NOT NULL UNIQUE  -- references auth.users(id)
phone       text
email       text
full_name   text NOT NULL
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

### `client_business_loyalty`

Links a client to a business and tracks their stamp progress:

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE
business_id     uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
stamp_count     integer NOT NULL DEFAULT 0
total_visits    integer NOT NULL DEFAULT 0
total_rewards   integer NOT NULL DEFAULT 0
last_visit_at   timestamptz
status          text NOT NULL DEFAULT 'active'  -- 'active' | 'at_risk' | 'lost'
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
UNIQUE(client_id, business_id)
```

### `visits`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id           uuid NOT NULL REFERENCES clients(id)
business_id         uuid NOT NULL REFERENCES businesses(id)
staff_id            text NOT NULL  -- identifier of the staff member who scanned
token_hash          text NOT NULL  -- SHA-256 of the QR token used (for idempotency)
reward_unlocked     boolean NOT NULL DEFAULT false
notes               text
idempotency_key     text NOT NULL UNIQUE
created_at          timestamptz NOT NULL DEFAULT now()
```

### `rewards`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid NOT NULL REFERENCES clients(id)
business_id     uuid NOT NULL REFERENCES businesses(id)
visit_id        uuid NOT NULL REFERENCES visits(id)
description     text NOT NULL
redeemed        boolean NOT NULL DEFAULT false
redeemed_at     timestamptz
created_at      timestamptz NOT NULL DEFAULT now()
```

### `campaigns`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id     uuid NOT NULL REFERENCES businesses(id)
title           text NOT NULL
message_template text NOT NULL
target_segment  text NOT NULL  -- 'at_risk' | 'lost' | 'all' | 'frequent'
send_timing     text NOT NULL  -- e.g. 'Tuesday 10am', 'Monday slow hours'
expected_lift   text NOT NULL  -- e.g. '+15% visits in 7 days'
status          text NOT NULL DEFAULT 'draft'  -- 'draft' | 'active' | 'sent' | 'archived'
generated_by    text NOT NULL DEFAULT 'nvidia-nim'
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

### `staff_keys`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id     uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
key_hash        text NOT NULL  -- SHA-256 of the raw API key
label           text NOT NULL  -- e.g. "Front desk iPad"
is_active       boolean NOT NULL DEFAULT true
last_used_at    timestamptz
created_at      timestamptz NOT NULL DEFAULT now()
```

---

## Step 1 — `src/types/db.ts`

Create `/backend/src/types/db.ts` with TypeScript row types for every table. Include both the "Row" type (full DB row) and "Insert" type (omitting generated fields):

```typescript
// ─── Businesses ──────────────────────────────────────────────────────────────

export type BusinessCategory =
  | 'barbershop'
  | 'salon'
  | 'vet'
  | 'cafe'
  | 'gym'
  | 'other'

export type BusinessPlan = 'free' | 'pro'

export interface BusinessRow {
  id: string
  name: string
  category: BusinessCategory
  owner_id: string
  is_active: boolean
  plan: BusinessPlan
  created_at: string
  updated_at: string
}

export interface BusinessInsert {
  name: string
  category: BusinessCategory
  owner_id: string
  is_active?: boolean
  plan?: BusinessPlan
}

// ─── Loyalty Config ──────────────────────────────────────────────────────────

export interface LoyaltyConfigRow {
  id: string
  business_id: string
  stamps_required: number
  reward_description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoyaltyConfigInsert {
  business_id: string
  stamps_required?: number
  reward_description?: string
  is_active?: boolean
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface ClientRow {
  id: string
  auth_id: string
  phone: string | null
  email: string | null
  full_name: string
  created_at: string
  updated_at: string
}

export interface ClientInsert {
  auth_id: string
  phone?: string | null
  email?: string | null
  full_name: string
}

// ─── Client-Business Loyalty ─────────────────────────────────────────────────

export type ClientStatus = 'active' | 'at_risk' | 'lost'

export interface ClientBusinessLoyaltyRow {
  id: string
  client_id: string
  business_id: string
  stamp_count: number
  total_visits: number
  total_rewards: number
  last_visit_at: string | null
  status: ClientStatus
  created_at: string
  updated_at: string
}

export interface ClientBusinessLoyaltyInsert {
  client_id: string
  business_id: string
  stamp_count?: number
  total_visits?: number
  total_rewards?: number
  last_visit_at?: string | null
  status?: ClientStatus
}

// ─── Visits ──────────────────────────────────────────────────────────────────

export interface VisitRow {
  id: string
  client_id: string
  business_id: string
  staff_id: string
  token_hash: string
  reward_unlocked: boolean
  notes: string | null
  idempotency_key: string
  created_at: string
}

export interface VisitInsert {
  client_id: string
  business_id: string
  staff_id: string
  token_hash: string
  reward_unlocked?: boolean
  notes?: string | null
  idempotency_key: string
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface RewardRow {
  id: string
  client_id: string
  business_id: string
  visit_id: string
  description: string
  redeemed: boolean
  redeemed_at: string | null
  created_at: string
}

export interface RewardInsert {
  client_id: string
  business_id: string
  visit_id: string
  description: string
  redeemed?: boolean
  redeemed_at?: string | null
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export type CampaignTargetSegment = 'at_risk' | 'lost' | 'all' | 'frequent'
export type CampaignStatus = 'draft' | 'active' | 'sent' | 'archived'

export interface CampaignRow {
  id: string
  business_id: string
  title: string
  message_template: string
  target_segment: CampaignTargetSegment
  send_timing: string
  expected_lift: string
  status: CampaignStatus
  generated_by: string
  created_at: string
  updated_at: string
}

export interface CampaignInsert {
  business_id: string
  title: string
  message_template: string
  target_segment: CampaignTargetSegment
  send_timing: string
  expected_lift: string
  status?: CampaignStatus
  generated_by?: string
}

// ─── Staff Keys ───────────────────────────────────────────────────────────────

export interface StaffKeyRow {
  id: string
  business_id: string
  key_hash: string
  label: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface StaffKeyInsert {
  business_id: string
  key_hash: string
  label: string
  is_active?: boolean
}

// ─── Database type map (for generic helpers) ─────────────────────────────────

export interface Database {
  businesses: { Row: BusinessRow; Insert: BusinessInsert }
  loyalty_configs: { Row: LoyaltyConfigRow; Insert: LoyaltyConfigInsert }
  clients: { Row: ClientRow; Insert: ClientInsert }
  client_business_loyalty: { Row: ClientBusinessLoyaltyRow; Insert: ClientBusinessLoyaltyInsert }
  visits: { Row: VisitRow; Insert: VisitInsert }
  rewards: { Row: RewardRow; Insert: RewardInsert }
  campaigns: { Row: CampaignRow; Insert: CampaignInsert }
  staff_keys: { Row: StaffKeyRow; Insert: StaffKeyInsert }
}
```

---

## Step 2 — `src/lib/supabase.ts`

Create `/backend/src/lib/supabase.ts`. This is the typed HTTP client for Supabase PostgREST. It must support GET, POST, PATCH, DELETE, and RPC calls with full TypeScript type inference.

```typescript
import type { Env } from '../types/env'
import type { Database } from '../types/db'
import { err } from '../types/api'
import type { ErrorCode } from '../types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type TableName = keyof Database
type Row<T extends TableName> = Database[T]['Row']
type Insert<T extends TableName> = Database[T]['Insert']
type Update<T extends TableName> = Partial<Insert<T>>

type AuthMode = 'anon' | 'service'

interface QueryOptions {
  select?: string         // PostgREST select clause e.g. 'id,name,clients(*)'
  filters?: FilterClause[]
  order?: string          // e.g. 'created_at.desc'
  limit?: number
  offset?: number
  single?: boolean        // adds Accept: application/vnd.pgsuite.object+json
  count?: 'exact' | 'planned' | 'estimated'
}

interface FilterClause {
  column: string
  operator: PostgRESTOperator
  value: string | number | boolean | null
}

// PostgREST filter operators
type PostgRESTOperator =
  | 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte'
  | 'like' | 'ilike' | 'is' | 'in' | 'cs' | 'cd'
  | 'ov' | 'sl' | 'sr' | 'nxr' | 'nxl' | 'adj'

interface SupabaseClient {
  get<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T>[]>
  getOne<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T> | null>
  post<T extends TableName>(table: T, body: Insert<T> | Insert<T>[]): Promise<Row<T>[]>
  patch<T extends TableName>(table: T, updates: Update<T>, filters: FilterClause[]): Promise<Row<T>[]>
  delete<T extends TableName>(table: T, filters: FilterClause[]): Promise<void>
  rpc<TArgs extends Record<string, unknown>, TResult>(fn: string, args: TArgs): Promise<TResult>
}

// ─── PostgREST error shape ────────────────────────────────────────────────────

interface PostgRESTError {
  code: string
  details: string | null
  hint: string | null
  message: string
}

// ─── Internal error class ─────────────────────────────────────────────────────

export class SupabaseError extends Error {
  constructor(
    public readonly pgCode: string,
    public readonly pgMessage: string,
    public readonly statusCode: number
  ) {
    super(`Supabase error ${pgCode}: ${pgMessage}`)
    this.name = 'SupabaseError'
  }
}

// ─── Client factory ───────────────────────────────────────────────────────────

export function createSupabaseClient(env: Env, mode: AuthMode = 'anon'): SupabaseClient {
  const baseUrl = `${env.SUPABASE_URL}/rest/v1`
  const apiKey = mode === 'service' ? env.SUPABASE_SERVICE_KEY : env.SUPABASE_ANON_KEY

  function buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Prefer': 'return=representation',
      ...extra,
    }
  }

  function buildUrl(table: string, options?: QueryOptions): string {
    const url = new URL(`${baseUrl}/${table}`)

    if (options?.select) url.searchParams.set('select', options.select)
    if (options?.order) url.searchParams.set('order', options.order)
    if (options?.limit != null) url.searchParams.set('limit', String(options.limit))
    if (options?.offset != null) url.searchParams.set('offset', String(options.offset))

    options?.filters?.forEach(({ column, operator, value }) => {
      const stringValue = value === null ? 'null' : String(value)
      url.searchParams.set(column, `${operator}.${stringValue}`)
    })

    return url.toString()
  }

  async function fetchWithRetry(
    url: string,
    init: RequestInit,
    retries = 2
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, init)
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
        }
      }
    }

    throw lastError ?? new Error('Fetch failed after retries')
  }

  async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return [] as unknown as T

    const text = await response.text()
    let body: unknown

    try {
      body = JSON.parse(text)
    } catch {
      throw new SupabaseError('PARSE_ERROR', `Failed to parse response: ${text}`, response.status)
    }

    if (!response.ok) {
      const pgErr = body as PostgRESTError
      throw new SupabaseError(pgErr.code ?? 'UNKNOWN', pgErr.message ?? 'Unknown error', response.status)
    }

    return body as T
  }

  return {
    async get<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T>[]> {
      const url = buildUrl(table, options)
      const headers = buildHeaders(
        options?.count ? { 'Prefer': `count=${options.count}` } : undefined
      )
      const response = await fetchWithRetry(url, { method: 'GET', headers })
      return handleResponse<Row<T>[]>(response)
    },

    async getOne<T extends TableName>(table: T, options?: QueryOptions): Promise<Row<T> | null> {
      const url = buildUrl(table, { ...options, limit: 1 })
      const headers = buildHeaders({ 'Accept': 'application/vnd.pgsuite.object+json' })
      const response = await fetchWithRetry(url, { method: 'GET', headers })

      if (response.status === 406) return null // no rows matched + single mode
      if (response.status === 200 && response.headers.get('content-length') === '0') return null

      const rows = await handleResponse<Row<T>[]>(response)
      return rows[0] ?? null
    },

    async post<T extends TableName>(table: T, body: Insert<T> | Insert<T>[]): Promise<Row<T>[]> {
      const url = `${baseUrl}/${table}`
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      return handleResponse<Row<T>[]>(response)
    },

    async patch<T extends TableName>(
      table: T,
      updates: Update<T>,
      filters: FilterClause[]
    ): Promise<Row<T>[]> {
      const url = buildUrl(table, { filters })
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
      })
      return handleResponse<Row<T>[]>(response)
    },

    async delete<T extends TableName>(table: T, filters: FilterClause[]): Promise<void> {
      const url = buildUrl(table, { filters })
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, { method: 'DELETE', headers })
      if (!response.ok && response.status !== 204) {
        const text = await response.text()
        throw new SupabaseError('DELETE_ERROR', text, response.status)
      }
    },

    async rpc<TArgs extends Record<string, unknown>, TResult>(fn: string, args: TArgs): Promise<TResult> {
      const url = `${baseUrl}/rpc/${fn}`
      const headers = buildHeaders()
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(args),
      })
      return handleResponse<TResult>(response)
    },
  }
}

// ─── Convenience: map SupabaseError to API error code ────────────────────────

export function mapSupabaseError(error: unknown): { code: ErrorCode; message: string; status: number } {
  if (error instanceof SupabaseError) {
    // Unique constraint violation
    if (error.pgCode === '23505') {
      return { code: 'VISIT_DUPLICATE', message: 'A record with this key already exists', status: 409 }
    }
    return { code: 'SUPABASE_ERROR', message: error.pgMessage, status: error.statusCode >= 500 ? 502 : error.statusCode }
  }
  return { code: 'INTERNAL_ERROR', message: 'Unexpected error', status: 500 }
}
```

---

## Step 3 — Verify

After writing both files, check TypeScript compiles:

```bash
cd /backend
npx tsc --noEmit
```

Fix any type errors before finishing. There should be zero errors.
