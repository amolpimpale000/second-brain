-- Personal Finances schema (run once in Supabase SQL Editor).
-- Service-role key bypasses RLS; RLS is enabled so anon/public keys can't touch these.

create table finance_accounts (
  id text primary key,
  name text not null,
  institution text not null default 'other', -- hdfc | sbi | icici | cash | other
  type text not null default 'Savings',
  last4 text not null default '',
  balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table finance_transactions (
  id text primary key,
  type text not null, -- income | expense
  category text not null,
  description text not null default '',
  amount numeric not null,
  date date not null,
  mode text not null default 'UPI',
  account_id text,
  created_at timestamptz not null default now()
);

create table finance_goals (
  id text primary key,
  name text not null,
  icon text not null default 'piggy', -- plane | bike | shield | piggy | home | gift
  color text not null default '#8b5cf6',
  target numeric not null,
  saved numeric not null default 0,
  created_at timestamptz not null default now()
);

create table finance_loans (
  id text primary key,
  name text not null,
  kind text not null default 'personal', -- home | personal | vehicle | education
  lender text not null default '',
  principal numeric not null,
  outstanding numeric not null,
  rate numeric not null default 0,
  emi numeric not null default 0,
  created_at timestamptz not null default now()
);

create table finance_investments (
  id text primary key,
  name text not null,
  type text not null default 'Mutual Funds', -- Mutual Funds | Stocks | PPF | Gold | FD | Crypto | Other
  invested numeric not null,
  current_value numeric not null,
  created_at timestamptz not null default now()
);

create table finance_bills (
  id text primary key,
  name text not null,
  amount numeric not null,
  due_day integer not null default 1, -- day of month (1-31)
  created_at timestamptz not null default now()
);

create table finance_dues (
  id text primary key,
  person text not null,
  amount numeric not null,
  direction text not null default 'to', -- to = I owe them, from = they owe me
  due_date date,
  status text not null default 'pending', -- pending | settled
  created_at timestamptz not null default now()
);

create table finance_budgets (
  id text primary key,
  category text not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

alter table finance_accounts enable row level security;
alter table finance_transactions enable row level security;
alter table finance_goals enable row level security;
alter table finance_loans enable row level security;
alter table finance_investments enable row level security;
alter table finance_bills enable row level security;
alter table finance_dues enable row level security;
alter table finance_budgets enable row level security;
