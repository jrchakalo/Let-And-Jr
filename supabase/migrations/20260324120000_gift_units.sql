-- ============================================================
-- Gift units support
-- Allows more than one unit for the same gift item
-- ============================================================

alter table gifts
  add column if not exists units_total integer not null default 1,
  add column if not exists units_remaining integer not null default 1;

update gifts
set units_total = 1
where units_total is null or units_total < 1;

update gifts
set units_remaining = least(greatest(coalesce(units_remaining, units_total, 1), 0), units_total)
where units_remaining is null
   or units_total is null
   or units_remaining > units_total
   or units_remaining < 0;

alter table gifts
  drop constraint if exists gifts_units_total_check;

alter table gifts
  add constraint gifts_units_total_check
  check (units_total >= 1);

alter table gifts
  drop constraint if exists gifts_units_remaining_check;

alter table gifts
  add constraint gifts_units_remaining_check
  check (units_remaining >= 0 and units_remaining <= units_total);
