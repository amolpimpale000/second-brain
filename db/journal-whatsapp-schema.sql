-- WhatsApp alert dedup schema (run once in Supabase SQL Editor).
-- Tracks which WhatsApp alerts (Interakt) have already been sent so the
-- hourly cron check never double-sends. Service-role key bypasses RLS; RLS
-- is enabled so anon/public keys can't touch this.

create table if not exists journal_whatsapp_sent (
  alert_key           text primary key,       -- e.g. "IJPS:google_ads_low", "IJPS:plagiarism_submission:249"
  template            text not null default '',
  journal_code        text not null default '',
  phone               text not null default '',
  last_sent_at        timestamptz not null default now(),
  message_id          text,                   -- Interakt's message id, used to match webhook callbacks
  delivery_status      text,                  -- Sent | Delivered | Read | Failed, set by the webhook
  delivery_updated_at timestamptz
);

-- If journal_whatsapp_sent already exists with real data, do NOT re-run the
-- create table above — instead just run:
-- alter table journal_whatsapp_sent add column if not exists message_id text;
-- alter table journal_whatsapp_sent add column if not exists delivery_status text;
-- alter table journal_whatsapp_sent add column if not exists delivery_updated_at timestamptz;

alter table journal_whatsapp_sent enable row level security;
