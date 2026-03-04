-- ============================================================
-- Wedding Site - Cota (quota) updates
-- Adds cota_value and cotas_paid to support partial contributions
-- ============================================================

-- cota_value: the price per single quota unit (e.g. R$200)
-- When is_cota = true, total cotas = ceil(price / cota_value)
alter table gifts
  add column if not exists cota_value numeric(10,2),
  add column if not exists cotas_paid integer not null default 0;
