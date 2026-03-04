-- ============================================================
-- Invite short links for families
-- ============================================================

alter table if exists families
  add column if not exists short_code text;

alter table if exists families
  alter column short_code set default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

update families
set short_code = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where short_code is null;

alter table if exists families
  alter column short_code set not null;

create unique index if not exists idx_families_short_code on families(short_code);
