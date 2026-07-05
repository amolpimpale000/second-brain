-- ============================================================================
-- Second Brain — Supabase schema + seed
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is idempotent: safe to re-run (it drops & recreates the tables).
--
-- SECURITY MODEL
--   Row Level Security is ON for every table.
--   Non-sensitive tables get a public read policy so the dashboard shows real
--   data with the publishable key.  The `vault` table is LOCKED (no policy),
--   so credentials are never exposed via the public key.  When we add Supabase
--   Auth, we replace the public policies with owner-scoped ones.
-- ============================================================================

-- ---------------------------------------------------------------- transactions
drop table if exists transactions cascade;
create table transactions (
  id        text primary key,
  position  int,
  name      text not null,
  category  text,
  account   text,
  txn_date  text,
  amount    numeric not null,
  status    text default 'completed'
);
insert into transactions (id, position, name, category, account, txn_date, amount, status) values
  ('t1', 1, 'IJSRT — Publication Fees',    'Business Income', 'HDFC Current',    '05 Jul',  184000, 'completed'),
  ('t2', 2, 'AWS Cloud Hosting',           'Infrastructure',  'ICICI Business',  '04 Jul',  -42600, 'completed'),
  ('t3', 3, 'IJPS — Article Processing',   'Business Income', 'HDFC Current',    '04 Jul',   96500, 'completed'),
  ('t4', 4, 'Mutual Fund SIP',             'Investment',      'Zerodha',         '03 Jul',  -50000, 'completed'),
  ('t5', 5, 'Editorial Team Payroll',      'Salaries',        'ICICI Business',  '02 Jul', -128000, 'completed'),
  ('t6', 6, 'IJMPS — Publication Fees',    'Business Income', 'HDFC Current',    '01 Jul',  142000, 'completed'),
  ('t7', 7, 'Car Loan EMI',                'Loan Payment',    'SBI Savings',     '01 Jul',  -34500, 'pending'),
  ('t8', 8, 'Wedding Fund Transfer',       'Savings Goal',    'SBI Savings',     '30 Jun',  -75000, 'completed');

-- -------------------------------------------------------------------- holdings
drop table if exists holdings cascade;
create table holdings (
  id        bigint generated always as identity primary key,
  position  int,
  name      text not null,
  type      text,
  invested  numeric not null,
  current   numeric not null
);
insert into holdings (position, name, type, invested, current) values
  (1, 'Nifty 50 Index Fund',      'Mutual Fund',  900000, 1148000),
  (2, 'Parag Parikh Flexi Cap',   'Mutual Fund',  640000,  812000),
  (3, 'US S&P 500 FoF',           'Mutual Fund',  520000,  690000),
  (4, 'Reliance Industries',      'Stock',        340000,  398000),
  (5, 'Gold ETF',                 'ETF',          380000,  452000),
  (6, 'Fixed Deposit',            'FD',           500000,  540000),
  (7, 'Bitcoin',                  'Crypto',       200000,  220000);

-- ----------------------------------------------------------------------- loans
drop table if exists loans cascade;
create table loans (
  id           text primary key,
  position     int,
  name         text not null,
  lender       text,
  principal    numeric,
  outstanding  numeric,
  emi          numeric,
  rate         numeric,
  tenure_left  int,
  next_due     text
);
insert into loans (id, position, name, lender, principal, outstanding, emi, rate, tenure_left, next_due) values
  ('l1', 1, 'Car Loan — Fortuner',        'SBI',   1800000,  940000, 34500,  9.2, 28, '05 Aug'),
  ('l2', 2, 'Home Loan',                  'HDFC',  4200000, 1620000, 41800,  8.4, 46, '07 Aug'),
  ('l3', 3, 'Business Line of Credit',    'ICICI',  500000,  228000, 22000, 11.5, 11, '10 Aug');

-- ----------------------------------------------------------------------- goals
drop table if exists goals cascade;
create table goals (
  id        text primary key,
  position  int,
  name      text not null,
  icon      text,
  target    numeric,
  saved     numeric,
  deadline  text,
  monthly   numeric,
  color     text
);
insert into goals (id, position, name, icon, target, saved, deadline, monthly, color) values
  ('g1', 1, 'Dream Car — Porsche', 'car',    6500000, 2340000, 'Dec 2027', 120000, 'var(--c-green)'),
  ('g2', 2, 'Wedding',             'heart',  2500000, 1650000, 'Feb 2027',  90000, 'var(--c-rose)'),
  ('g3', 3, 'Europe Travel',       'plane',   900000,  640000, 'Oct 2026',  45000, 'var(--c-sky)'),
  ('g4', 4, 'Emergency Fund',      'shield', 1500000, 1500000, 'Achieved',      0, 'var(--c-teal)');

-- ------------------------------------------------------------------ businesses
drop table if exists businesses cascade;
create table businesses (
  id           text primary key,
  position     int,
  code         text not null,
  name         text,
  revenue      numeric,
  expenses     numeric,
  submissions  int,
  published    int,
  growth       numeric,
  color        text
);
insert into businesses (id, position, code, name, revenue, expenses, submissions, published, growth, color) values
  ('b1', 1, 'IJSRT', 'Intl. Journal of Sci. Research & Tech',  2140000, 940000, 1240, 820, 18.4, 'var(--c-green)'),
  ('b2', 2, 'IJPS',  'Intl. Journal of Physical Sciences',     1560000, 680000,  910, 560, 12.1, 'var(--c-teal)'),
  ('b3', 3, 'JPS',   'Journal of Pharmaceutical Sciences',     1180000, 520000,  640, 390,  9.7, 'var(--c-lime)'),
  ('b4', 4, 'IJMPS', 'Intl. Journal of Med. & Pharma Sci',     1420000, 610000,  780, 470, 15.3, 'var(--c-sky)'),
  ('b5', 5, 'IEJS',  'Intl. Engineering Journal of Science',    980000, 430000,  520, 310,  7.2, 'var(--c-amber)');

-- ----------------------------------------------------------------------- tasks
drop table if exists tasks cascade;
create table tasks (
  id        text primary key,
  position  int,
  title     text not null,
  project   text,
  due       text,
  priority  text default 'medium',
  done      boolean default false
);
insert into tasks (id, position, title, project, due, priority, done) values
  ('k1', 1, 'Approve IJSRT July issue proofs',       'IJSRT',      'Today',    'high',   false),
  ('k2', 2, 'Renew DOI membership (Crossref)',       'Operations', 'Tomorrow', 'high',   false),
  ('k3', 3, 'Review 12 pending submissions — IJMPS', 'IJMPS',      '08 Jul',   'medium', false),
  ('k4', 4, 'Q2 GST filing',                         'Finance',    '12 Jul',   'high',   false),
  ('k5', 5, 'Onboard 2 new peer reviewers',          'JPS',        '15 Jul',   'low',    false),
  ('k6', 6, 'Rebalance investment portfolio',        'Personal',   '18 Jul',   'medium', true),
  ('k7', 7, 'Book wedding venue advance',            'Personal',   '20 Jul',   'medium', false);

-- ----------------------------------------------------------------------- notes
drop table if exists notes cascade;
create table notes (
  id        text primary key,
  position  int,
  title     text not null,
  preview   text,
  tag       text,
  color     text,
  updated   text,
  pinned    boolean default false
);
insert into notes (id, position, title, preview, tag, color, updated, pinned) values
  ('n1', 1, '2026 Growth Strategy',            'Expand IJSRT indexing to Scopus. Target 40% YoY submission growth across all journals…', 'Strategy', 'var(--c-green)',  '2h ago', true),
  ('n2', 2, 'Editorial Board Ideas',           'Potential invitees for IJMPS medical board — Dr. Rao, Dr. Kulkarni. Draft invite emails.', 'IJMPS',   'var(--c-sky)',    '1d ago', false),
  ('n3', 3, 'Tax Planning FY26',               'Section 80C maxed. Explore 80D + business deductions. Consult CA before 15 Jul.',         'Finance',  'var(--c-amber)',  '2d ago', true),
  ('n4', 4, 'Wedding Checklist',               'Venue shortlist, catering quotes, photographer bookings. Budget cap ₹25L.',               'Personal', 'var(--c-rose)',   '3d ago', false),
  ('n5', 5, 'New Journal Concept — AI & Ethics','Market gap for an open-access AI ethics journal. Validate demand, pricing model.',       'Idea',     'var(--c-violet)', '4d ago', false),
  ('n6', 6, 'Server Migration Plan',           'Move OJS instances to managed hosting. Reduce downtime, automate backups.',               'Ops',      'var(--c-teal)',   '5d ago', false);

-- ----------------------------------------------------------------------- vault
-- LOCKED: RLS on, no public policy. Replace sample secrets with real ones only
-- AFTER Supabase Auth + owner-scoped policies are in place.
drop table if exists vault cascade;
create table vault (
  id          text primary key,
  position    int,
  name        text not null,
  category    text,
  identifier  text,
  secret      text,
  updated     text,
  strength    text
);
insert into vault (id, position, name, category, identifier, secret, updated, strength) values
  ('v1', 1, 'HDFC Net Banking',     'Bank',       'amol.p',                    'REPLACE_ME', '12 Jun', 'strong'),
  ('v2', 2, 'ICICI Business',       'Bank',       'ijsrt.corp',                'REPLACE_ME', '02 Jul', 'strong'),
  ('v3', 3, 'SBI ATM PIN',          'ATM / Card', '•••• 4821',                 'REPLACE_ME', '01 Jan', 'weak'),
  ('v4', 4, 'HDFC Debit Card',      'ATM / Card', '•••• 7790',                 'REPLACE_ME', '20 May', 'medium'),
  ('v5', 5, 'Gmail — Personal',     'Email',      'amolpimpale000@gmail.com',  'REPLACE_ME', '18 Jun', 'strong'),
  ('v6', 6, 'IJSRT Editor Portal',  'Business',   'editor@ijsrt.org',          'REPLACE_ME', '28 Jun', 'medium'),
  ('v7', 7, 'Crossref DOI Account', 'Business',   'doi-admin',                 'REPLACE_ME', '10 Jun', 'strong');

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table transactions enable row level security;
alter table holdings     enable row level security;
alter table loans        enable row level security;
alter table goals        enable row level security;
alter table businesses   enable row level security;
alter table tasks        enable row level security;
alter table notes        enable row level security;
alter table vault        enable row level security;

-- Public (anon) read for non-sensitive tables.
create policy "public read" on transactions for select using (true);
create policy "public read" on holdings     for select using (true);
create policy "public read" on loans        for select using (true);
create policy "public read" on goals        for select using (true);
create policy "public read" on businesses   for select using (true);
create policy "public read" on tasks        for select using (true);
create policy "public read" on notes        for select using (true);

-- NOTE: `vault` intentionally has NO policy → the publishable key cannot read it.
