-- Journal Alerts panel schema (run once in Supabase SQL Editor).
-- The alerts themselves are computed live from the read-only journal databases;
-- these two tables only hold app-owned state: which alerts were dismissed, and
-- which employees are tracked per journal for the "no paper in 24h" rule.
-- Service-role key bypasses RLS; RLS is enabled so anon/public keys can't touch these.

create table if not exists journal_alert_dismissals (
  alert_key    text primary key,           -- stable id, e.g. "IJPS:revision_overdue:260405010"
  rule         text not null default '',
  journal_code text not null default '',
  dismissed_at timestamptz not null default now()
);

create table if not exists journal_alert_settings (
  journal_code         text primary key,   -- IJPS | IJSRT | IJMPS | IJES | JPS
  tracked_employee_ids jsonb not null default '[]'::jsonb, -- explicit tracked ids; no row = track all active staff
  updated_at           timestamptz not null default now()
);

alter table journal_alert_dismissals enable row level security;
alter table journal_alert_settings   enable row level security;
