-- ============================================================
-- Wedding Site - Initial Schema
-- ============================================================

-- FAMILIES: one magic_token per family group
create table if not exists families (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  magic_token text        not null unique default gen_random_uuid()::text,
  created_at  timestamptz not null default now()
);

-- GUESTS: each guest belongs to a family
create table if not exists guests (
  id          uuid        primary key default gen_random_uuid(),
  family_id   uuid        not null references families(id) on delete cascade,
  name        text        not null,
  rsvp_status text        not null default 'PENDING'
                          check (rsvp_status in ('PENDING', 'CONFIRMED', 'DECLINED')),
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- GIFTS: items on the gift list
create table if not exists gifts (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  price             numeric(10,2) not null default 0,
  image_url         text,
  store_url         text,
  status            text        not null default 'AVAILABLE'
                               check (status in ('AVAILABLE', 'RESERVED', 'PAID', 'CLAIMED_MANUALLY')),
  is_cota           boolean     not null default false,
  reserved_by_name  text,
  reserved_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_guests_family_id on guests(family_id);
create index if not exists idx_families_magic_token on families(magic_token);

-- Trigger to auto-update updated_at on guests
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger guests_updated_at
  before update on guests
  for each row execute function update_updated_at();

-- Row Level Security
alter table families enable row level security;
alter table guests   enable row level security;
alter table gifts    enable row level security;

-- Public read policies (site is publicly accessible via token)
create policy "public_read_families"  on families for select using (true);
create policy "public_read_guests"    on guests   for select using (true);
create policy "public_read_gifts"     on gifts    for select using (true);

-- Update policies (site logic uses service role key in API routes)
create policy "service_all_families"  on families for all using (true) with check (true);
create policy "service_all_guests"    on guests   for all using (true) with check (true);
create policy "service_all_gifts"     on gifts    for all using (true) with check (true);
