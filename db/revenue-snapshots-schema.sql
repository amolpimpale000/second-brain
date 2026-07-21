-- Revenue snapshots schema (run once in Supabase SQL Editor).
-- Stores daily-cached Razorpay captured-income data per journal per month.
-- Populated by the /api/journals/revenue-sync cron route and read by
-- the dashboard (monthlyRevenueByBusiness) and consolidated PnL.
-- Service-role key bypasses RLS; RLS is enabled so anon/public keys can't touch these.

create table if not exists razorpay_revenue_snapshots (
  journal_code  text        not null,  -- IJPS | IJSRT | IJMPS | IJES | JPS
  month_key     text        not null,  -- "YYYY-MM"
  amount        integer     not null,  -- rupees (Razorpay paise / 100, summed)
  payment_count integer     not null default 0,
  fetched_at    timestamptz not null default now(),
  primary key (journal_code, month_key)
);

alter table razorpay_revenue_snapshots enable row level security;
