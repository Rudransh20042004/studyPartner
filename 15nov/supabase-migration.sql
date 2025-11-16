-- Profiles table for registered users
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  student_id text,
  full_name text,
  created_at timestamptz default now()
);

-- Ensure each student_id is unique when provided (allow NULLs)
do $$
begin
  if not exists (
    select 1 from pg_indexes 
    where schemaname = 'public' and indexname = 'uniq_profiles_student_id_nonnull'
  ) then
    create unique index uniq_profiles_student_id_nonnull
      on public.profiles ((lower(student_id)))
      where student_id is not null and length(trim(student_id)) > 0;
  end if;
end$$;

-- Sessions table for active sessions (syncing info)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  student_id text,
  course_code text,
  working_on text,
  location text,
  status text,
  last_active timestamptz default now()
);

-- Index last_active for fast sorting
create index if not exists idx_sessions_last_active on public.sessions (last_active desc);
-- Ensure one row per user (prevents duplicates)
create unique index if not exists uniq_sessions_user on public.sessions (user_id);

-- Messages table (simple direct messaging)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references auth.users(id) on delete cascade,
  to_user uuid references auth.users(id) on delete cascade,
  text text not null,
  image_url text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Optional denormalized names to avoid joins
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'messages' and column_name = 'from_name'
  ) then
    alter table public.messages add column from_name text;
  end if;
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'messages' and column_name = 'to_name'
  ) then
    alter table public.messages add column to_name text;
  end if;
end$$;

create index if not exists idx_messages_to_user on public.messages (to_user, read, created_at desc);
create index if not exists idx_messages_from_user on public.messages (from_user, created_at desc);

alter table public.messages enable row level security;

-- Messaging policies:
-- Read: a user can see messages sent to them or by them
drop policy if exists "Messages: read own inbox/outbox" on public.messages;
create policy "Messages: read own inbox/outbox" on public.messages
  for select using (auth.uid() = to_user or auth.uid() = from_user);

-- Insert: a user can send a message with themselves as sender
drop policy if exists "Messages: insert as sender" on public.messages;
create policy "Messages: insert as sender" on public.messages
  for insert with check (auth.uid() = from_user);

-- Update: a user can mark as read only messages sent to them
drop policy if exists "Messages: mark own inbox read" on public.messages;
create policy "Messages: mark own inbox read" on public.messages
  for update using (auth.uid() = to_user)
  with check (auth.uid() = to_user);

-- Enable Row Level Security (RLS) - adjust policies as needed
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

-- Basic policies: allow authenticated users to read all, insert their own
create policy "Allow authenticated users to read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert profiles" on public.profiles
  for insert with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to read sessions" on public.sessions
  for select using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert sessions" on public.sessions
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Allow authenticated users to update sessions" on public.sessions;
create policy "Allow users to update own session" on public.sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Safe delete: users can delete ONLY their own sessions
drop policy if exists "Allow authenticated users to delete own sessions" on public.sessions;
create policy "Allow authenticated users to delete own sessions" on public.sessions
  for delete using (auth.uid() = user_id);

-- Ensure tables are part of the realtime publication
do $$
begin
  perform 1
  from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions';
  if not found then
    alter publication supabase_realtime add table public.sessions;
  end if;
  perform 1
  from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages';
  if not found then
    alter publication supabase_realtime add table public.messages;
  end if;
end$$;
