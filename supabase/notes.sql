-- ============================================================================
-- Second Brain — live Notes + Reminders tables
-- Idempotent. Run in the Supabase SQL Editor (or applied via Management API).
--
-- These back the Notes page. Rows are read/written directly from the browser
-- with the publishable key, so RLS is open (personal app). Lock these down to
-- owner-only once Supabase Auth is added.
-- ============================================================================

create table if not exists user_notes (
  id          text primary key,
  title       text not null,
  body        text,
  items_label text,
  items       jsonb,
  list_style  text,
  category    text,
  tags        jsonb default '[]'::jsonb,
  color       text default 'white',
  time        text,
  pinned      boolean default false,
  starred     boolean default false,
  trashed     boolean default false,
  sort        bigint default 0,
  updated_at  timestamptz default now()
);

create table if not exists note_reminders (
  id     text primary key,
  title  text not null,
  time   text,
  color  text,
  done   boolean default false,
  sort   bigint default 0
);

alter table user_notes     enable row level security;
alter table note_reminders enable row level security;

-- Open policies (anon key can read/write). Replace with owner-scoped policies
-- after Supabase Auth is wired up.
drop policy if exists "public all" on user_notes;
drop policy if exists "public all" on note_reminders;
create policy "public all" on user_notes     for all using (true) with check (true);
create policy "public all" on note_reminders for all using (true) with check (true);
