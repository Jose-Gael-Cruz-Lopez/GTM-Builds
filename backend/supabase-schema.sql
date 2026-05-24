-- ═══════════════════════════════════════════════════════════════════════════════
-- NexoLeal — Supabase Schema
-- ═══════════════════════════════════════════════════════════════════════════════
-- Target project: https://lajrjnjyvbpaaspzgpvh.supabase.co
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is idempotent — safe to re-run.
--
-- After running, you'll have:
--   • All 8 application tables (businesses, loyalty_configs, clients,
--     client_business_loyalty, visits, rewards, campaigns, staff_keys)
--   • Row-Level Security (RLS) enabled and policy stubs that the Workers
--     backend (service-role key) will bypass automatically.
--   • Indexes on every foreign key + hot query path.
--   • An updated_at trigger that auto-bumps modified rows.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";  -- for gen_random_uuid()
create extension if not exists "uuid-ossp"; -- legacy uuid helpers (optional)

-- ─── updated_at trigger helper ─────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. businesses
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.businesses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text not null check (category in ('barbershop','salon','vet','cafe','gym','other')),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  is_active       boolean not null default true,
  plan            text not null default 'free' check (plan in ('free','pro')),
  tagline         text,
  logo_url        text,
  primary_color   text,
  address         text,
  phone           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_businesses_owner_id on public.businesses(owner_id);
create index if not exists idx_businesses_is_active on public.businesses(is_active);

drop trigger if exists trg_businesses_updated_at on public.businesses;
create trigger trg_businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. loyalty_configs
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.loyalty_configs (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  stamps_required     integer not null default 10 check (stamps_required between 1 and 100),
  reward_description  text not null default 'Free service',
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_loyalty_configs_business_id on public.loyalty_configs(business_id);
-- Only one active config per business at a time
create unique index if not exists uq_loyalty_configs_business_active
  on public.loyalty_configs(business_id) where is_active = true;

drop trigger if exists trg_loyalty_configs_updated_at on public.loyalty_configs;
create trigger trg_loyalty_configs_updated_at
  before update on public.loyalty_configs
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. clients (end-customer profiles)
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid not null unique references auth.users(id) on delete cascade,
  phone       text,
  email       text,
  full_name   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_clients_auth_id on public.clients(auth_id);
create index if not exists idx_clients_phone on public.clients(phone) where phone is not null;
create index if not exists idx_clients_email on public.clients(email) where email is not null;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. client_business_loyalty (one row per client+business pair)
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.client_business_loyalty (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  business_id     uuid not null references public.businesses(id) on delete cascade,
  stamp_count     integer not null default 0 check (stamp_count >= 0),
  total_visits    integer not null default 0 check (total_visits >= 0),
  total_rewards   integer not null default 0 check (total_rewards >= 0),
  last_visit_at   timestamptz,
  status          text not null default 'active' check (status in ('active','at_risk','lost')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, business_id)
);

create index if not exists idx_cbl_client_id on public.client_business_loyalty(client_id);
create index if not exists idx_cbl_business_id on public.client_business_loyalty(business_id);
create index if not exists idx_cbl_status on public.client_business_loyalty(business_id, status);
create index if not exists idx_cbl_last_visit on public.client_business_loyalty(business_id, last_visit_at desc);

drop trigger if exists trg_cbl_updated_at on public.client_business_loyalty;
create trigger trg_cbl_updated_at
  before update on public.client_business_loyalty
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. visits
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.visits (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  business_id       uuid not null references public.businesses(id) on delete cascade,
  staff_id          text not null,
  token_hash        text not null,
  reward_unlocked   boolean not null default false,
  notes             text,
  idempotency_key   text not null unique,
  created_at        timestamptz not null default now()
);

create index if not exists idx_visits_client_id on public.visits(client_id, created_at desc);
create index if not exists idx_visits_business_id on public.visits(business_id, created_at desc);
create index if not exists idx_visits_token_hash on public.visits(token_hash);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. rewards
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.rewards (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  business_id   uuid not null references public.businesses(id) on delete cascade,
  visit_id      uuid not null references public.visits(id) on delete cascade,
  description   text not null,
  redeemed      boolean not null default false,
  redeemed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_rewards_client_id on public.rewards(client_id, created_at desc);
create index if not exists idx_rewards_business_id on public.rewards(business_id, created_at desc);
create index if not exists idx_rewards_unredeemed on public.rewards(business_id) where redeemed = false;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. campaigns (AI-generated)
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.campaigns (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  title             text not null,
  message_template  text not null,
  target_segment    text not null check (target_segment in ('at_risk','lost','all','frequent')),
  send_timing       text not null,
  expected_lift     text not null,
  status            text not null default 'draft' check (status in ('draft','active','sent','archived')),
  generated_by      text not null default 'nvidia-nim',
  sent_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_campaigns_business_id on public.campaigns(business_id, created_at desc);
create index if not exists idx_campaigns_status on public.campaigns(business_id, status);

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. staff_keys (hashed API keys for in-store staff)
-- ═══════════════════════════════════════════════════════════════════════════════
create table if not exists public.staff_keys (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  key_hash      text not null,
  label         text not null,
  is_active     boolean not null default true,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- Looking up by (business_id, key_hash) is the hot path for every visit scan
create unique index if not exists uq_staff_keys_business_hash
  on public.staff_keys(business_id, key_hash);
create index if not exists idx_staff_keys_active
  on public.staff_keys(business_id) where is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════════
-- The Cloudflare Workers backend uses the SERVICE_ROLE key, which bypasses RLS.
-- We enable RLS so any other client (anon key, browser, etc.) is locked down by
-- default. Add additional policies if/when you ever expose direct REST access.
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.businesses                enable row level security;
alter table public.loyalty_configs           enable row level security;
alter table public.clients                   enable row level security;
alter table public.client_business_loyalty   enable row level security;
alter table public.visits                    enable row level security;
alter table public.rewards                   enable row level security;
alter table public.campaigns                 enable row level security;
alter table public.staff_keys                enable row level security;

-- ─── Policy: business owners can read their own business row ───────────────────
drop policy if exists "Owners can read own business" on public.businesses;
create policy "Owners can read own business"
  on public.businesses for select
  using (auth.uid() = owner_id);

-- ─── Policy: clients can read their own client profile ─────────────────────────
drop policy if exists "Clients can read own profile" on public.clients;
create policy "Clients can read own profile"
  on public.clients for select
  using (auth.uid() = auth_id);

drop policy if exists "Clients can update own profile" on public.clients;
create policy "Clients can update own profile"
  on public.clients for update
  using (auth.uid() = auth_id);

-- ─── Policy: clients can read their own loyalty + visits + rewards ─────────────
drop policy if exists "Clients can read own loyalty" on public.client_business_loyalty;
create policy "Clients can read own loyalty"
  on public.client_business_loyalty for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_business_loyalty.client_id
        and c.auth_id = auth.uid()
    )
  );

drop policy if exists "Clients can read own visits" on public.visits;
create policy "Clients can read own visits"
  on public.visits for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = visits.client_id
        and c.auth_id = auth.uid()
    )
  );

drop policy if exists "Clients can read own rewards" on public.rewards;
create policy "Clients can read own rewards"
  on public.rewards for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = rewards.client_id
        and c.auth_id = auth.uid()
    )
  );

-- ─── Policy: business owners can read everything tied to their business ────────
-- (Used if the dashboard ever queries Supabase directly; the Workers backend
--  goes through the service role and is unaffected.)
drop policy if exists "Owners can read business loyalty" on public.client_business_loyalty;
create policy "Owners can read business loyalty"
  on public.client_business_loyalty for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = client_business_loyalty.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read business visits" on public.visits;
create policy "Owners can read business visits"
  on public.visits for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = visits.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read business rewards" on public.rewards;
create policy "Owners can read business rewards"
  on public.rewards for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = rewards.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read business campaigns" on public.campaigns;
create policy "Owners can read business campaigns"
  on public.campaigns for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = campaigns.business_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read business loyalty_configs" on public.loyalty_configs;
create policy "Owners can read business loyalty_configs"
  on public.loyalty_configs for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = loyalty_configs.business_id
        and b.owner_id = auth.uid()
    )
  );

-- staff_keys: never expose to anyone except service role.
-- (No SELECT/INSERT/UPDATE policies → only service role can access.)

-- ═══════════════════════════════════════════════════════════════════════════════
-- Schema upgrades (idempotent — safe on existing projects)
-- ═══════════════════════════════════════════════════════════════════════════════
alter table public.businesses add column if not exists tagline text;
alter table public.businesses add column if not exists logo_url text;
alter table public.businesses add column if not exists primary_color text;
alter table public.businesses add column if not exists address text;
alter table public.businesses add column if not exists phone text;
alter table public.campaigns add column if not exists sent_at timestamptz;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Done.
-- ═══════════════════════════════════════════════════════════════════════════════
-- Verify with:
--   select table_name from information_schema.tables where table_schema = 'public';
-- You should see all 8 tables.
-- ═══════════════════════════════════════════════════════════════════════════════
