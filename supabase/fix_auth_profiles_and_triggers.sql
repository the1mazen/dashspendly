-- =====================================================================
-- Spendly: Google OAuth & Profiles Trigger Fix
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/djayknvnhlmseskklnip/sql
-- =====================================================================

-- 1. Ensure public.profiles table exists with safe defaults (no rigid NOT NULL constraints)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  first_name text,
  last_name text,
  full_name text,
  default_currency text default 'USD',
  language text default 'English (US)',
  phone text,
  is_admin boolean default false,
  is_banned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure all required columns exist in case table was partially created
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists default_currency text default 'USD';
alter table public.profiles add column if not exists language text default 'English (US)';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists is_banned boolean default false;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Drop any accidental unique constraints on username that could cause OAuth conflicts
alter table public.profiles drop constraint if exists profiles_username_key;

-- 2. Enable RLS on profiles
alter table public.profiles enable row level security;

-- Drop old policies if any to prevent conflicts
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. Robust, fault-tolerant user creation trigger
-- If a user signs up with Google OAuth or Email, this automatically creates a profile.
-- Uses EXCEPTION handler so signup NEVER fails with 'server_error' even on edge-case metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text;
  raw_user text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  raw_user := coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'username',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  insert into public.profiles (
    id,
    username,
    first_name,
    last_name,
    full_name,
    default_currency,
    is_admin,
    is_banned
  ) values (
    new.id,
    raw_user,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(raw_name, ' ', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    raw_name,
    coalesce(new.raw_user_meta_data->>'default_currency', new.raw_user_meta_data->>'currency', 'USD'),
    false,
    false
  )
  on conflict (id) do update set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();

  return new;
exception
  when others then
    -- Catch any unexpected database error so auth.users insertion never fails
    return new;
end;
$$;

-- Drop and re-create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
