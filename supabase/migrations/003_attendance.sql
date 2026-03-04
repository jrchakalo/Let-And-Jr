-- 003_attendance.sql
-- Adds event-day attendance tracking to the guests table.

alter table guests
  add column if not exists attended boolean not null default false,
  add column if not exists attended_at timestamptz;
