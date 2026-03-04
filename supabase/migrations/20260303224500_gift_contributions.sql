-- ============================================================
-- Contributions log for gift gifting history
-- ============================================================

create table if not exists gift_contributions (
  id                       uuid primary key default gen_random_uuid(),
  gift_id                  uuid not null references gifts(id) on delete cascade,
  contributor_name         text not null,
  contributor_email        text,
  contribution_type        text not null
                            check (contribution_type in (
                              'MERCADOPAGO_GIFT',
                              'MERCADOPAGO_COTA',
                              'MANUAL_CLAIM',
                              'STORE_CONFIRM',
                              'MANUAL_COTA'
                            )),
  quantity                 integer not null default 1,
  amount                   numeric(10,2),
  status                   text not null default 'CONFIRMED'
                            check (status in ('CONFIRMED')),
  mercadopago_payment_id   text,
  created_at               timestamptz not null default now()
);

create index if not exists idx_gift_contributions_gift_id
  on gift_contributions(gift_id);

create index if not exists idx_gift_contributions_created_at
  on gift_contributions(created_at desc);

create unique index if not exists idx_gift_contributions_mp_payment_id
  on gift_contributions(mercadopago_payment_id)
  where mercadopago_payment_id is not null;

alter table gift_contributions enable row level security;

create policy "public_read_gift_contributions"
  on gift_contributions for select using (true);

create policy "service_all_gift_contributions"
  on gift_contributions for all using (true) with check (true);
