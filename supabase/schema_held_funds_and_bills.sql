-- =====================================================================
-- Supabase Schema Migration: Transactions Fee Column, Held Funds & Bills
-- Copy and run this in Supabase SQL Editor: https://supabase.com/dashboard/project/djayknvnhlmseskklnip/sql
-- =====================================================================

-- 0. Ensure fee_pair_id column exists on transactions
alter table if exists public.transactions add column if not exists fee_pair_id text;

-- 1. Held Funds Table
create table if not exists public.held_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  account_id uuid references public.accounts(id) not null,
  name text not null,
  type text not null check (type in ('person', 'fund')),
  balance_cents bigint not null default 0,
  created_at timestamptz default now()
);

-- 2. Held Fund History Table
create table if not exists public.held_fund_history (
  id uuid primary key default gen_random_uuid(),
  held_fund_id uuid references public.held_funds(id) not null,
  user_id uuid references auth.users(id) not null,
  amount_cents bigint not null,
  direction text not null check (direction in ('deposit', 'withdrawal')),
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- 3. Enable RLS on Held Funds & History
alter table public.held_funds enable row level security;
alter table public.held_fund_history enable row level security;

-- Policies for Held Funds
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'held_funds' and policyname = 'Users manage own held funds') then
    create policy "Users manage own held funds"
      on public.held_funds for all using (auth.uid() = user_id);
  end if;
end $$;

-- Policies for Held Fund History
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'held_fund_history' and policyname = 'Users manage own held fund history') then
    create policy "Users manage own held fund history"
      on public.held_fund_history for all using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Bills Table
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  account_id uuid references public.accounts(id) not null,
  destination_account_id uuid references public.accounts(id),
  category_id uuid references public.categories(id),
  amount_cents bigint not null,
  fee_amount_cents bigint not null default 0,
  fee_type text check (fee_type in ('flat', 'percentage', 'instapay')),
  due_date date not null,
  recurrence text not null check (recurrence in ('one-off', 'daily', 'monthly', 'custom')),
  recurrence_days int,
  is_completed boolean not null default false,
  created_at timestamptz default now()
);

-- Enable RLS on Bills
alter table public.bills enable row level security;

-- Policy for Bills
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'bills' and policyname = 'Users manage own bills') then
    create policy "Users manage own bills"
      on public.bills for all using (auth.uid() = user_id);
  end if;
end $$;
