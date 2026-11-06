-- ============================================================
-- RLS Hardening
-- ------------------------------------------------------------
-- Fixes: previous migrations shipped "service_all_*" policies
-- (for all, using (true) with check (true)) which grant the
-- PUBLIC anon key, exposed in the site JavaScript, full
-- SELECT/INSERT/UPDATE/DELETE over:
--   * families  -> leaks magic_token / short_code invite links
--   * guests    -> leaks guest names and RSVP statuses
--   * gifts     -> allows anyone to mark gifts PAID / RESERVED
--   * gift_contributions -> leaks contributor names and emails
--
-- All application reads/writes go through API routes running
-- with the service role key (which bypasses RLS), so the anon
-- role needs zero write access. Realtime on `gifts` stays
-- available via the public select policy.
-- ============================================================

-- Remove the blanket "service" policies (they matched every role)
drop policy if exists "service_all_families" on families;
drop policy if exists "service_all_guests"   on guests;
drop policy if exists "service_all_gifts"    on gifts;

-- Remove public reads that leak personal data
drop policy if exists "public_read_families" on families;
drop policy if exists "public_read_guests"   on guests;

drop policy if exists "service_all_gift_contributions" on gift_contributions;
drop policy if exists "public_read_gift_contributions" on gift_contributions;

-- Keep the public gift list readable (public page + realtime)
-- The "public_read_gifts" policy (select, using (true)) from
-- 001_initial.sql already covers this.
alter table families enable row level security;
alter table guests   enable row level security;
alter table gifts    enable row level security;
alter table gift_contributions enable row level security;
