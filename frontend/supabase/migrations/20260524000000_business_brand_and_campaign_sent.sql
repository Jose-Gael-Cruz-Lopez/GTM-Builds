-- Brand fields on businesses + sent_at on campaigns (idempotent)
alter table public.businesses add column if not exists tagline text;
alter table public.businesses add column if not exists logo_url text;
alter table public.businesses add column if not exists primary_color text;
alter table public.businesses add column if not exists address text;
alter table public.businesses add column if not exists phone text;
alter table public.campaigns add column if not exists sent_at timestamptz;
