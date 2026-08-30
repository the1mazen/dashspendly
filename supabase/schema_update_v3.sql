-- =====================================================================
-- Supabase Schema Update V3: All New Features
-- Copy and run this in Supabase SQL Editor: https://supabase.com/dashboard/project/djayknvnhlmseskklnip/sql
-- =====================================================================

-- 1. High Expense Divider: Group ID on Transactions
alter table if exists public.transactions add column if not exists group_id uuid;

-- 2. Recurring Bills: Parent Bill ID
alter table if exists public.bills add column if not exists parent_bill_id uuid references public.bills(id);

-- 3. Admin & Moderation: is_admin and is_banned on Profiles
alter table if exists public.profiles add column if not exists is_admin boolean default false;
alter table if exists public.profiles add column if not exists is_banned boolean default false;

-- 4. Persistent Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  type text not null,
  reference_id uuid,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- Policy for Notifications
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'Users manage own notifications') then
    create policy "Users manage own notifications"
      on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- 5. Helper index for performance
create index if not exists idx_transactions_group_id on public.transactions(group_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read);
create index if not exists idx_bills_parent_id on public.bills(parent_bill_id);
