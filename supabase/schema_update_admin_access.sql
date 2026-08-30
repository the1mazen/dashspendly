-- ==============================================================================
-- SUPABASE ADMIN FULL ACCESS MIGRATION
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/djayknvnhlmseskklnip/sql
-- ==============================================================================

-- 1. Helper function: Fast JWT + Profile Admin Check
create or replace function public.is_app_admin()
returns boolean
language sql
security definer
stable
as $$
  select (
    (coalesce(auth.jwt()->>'email', '') = 'themazen21@gmail.com')
    or (coalesce(auth.jwt()->'user_metadata'->>'is_admin', 'false') = 'true')
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and is_admin = true
    )
  );
$$;

-- 2. Drop existing admin policies if any
drop policy if exists "Admins have full access to profiles" on public.profiles;
drop policy if exists "Admins have full access to transactions" on public.transactions;
drop policy if exists "Admins have full access to accounts" on public.accounts;
drop policy if exists "Admins have full access to bills" on public.bills;
drop policy if exists "Admins have full access to held_funds" on public.held_funds;
drop policy if exists "Admins have full access to held_fund_history" on public.held_fund_history;
drop policy if exists "Admins have full access to categories" on public.categories;
drop policy if exists "Admins have full access to notifications" on public.notifications;

-- 3. Grant Admin RLS Access on PROFILES
create policy "Admins have full access to profiles"
  on public.profiles
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 4. Grant Admin RLS Access on TRANSACTIONS
create policy "Admins have full access to transactions"
  on public.transactions
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 5. Grant Admin RLS Access on ACCOUNTS
create policy "Admins have full access to accounts"
  on public.accounts
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 6. Grant Admin RLS Access on BILLS
create policy "Admins have full access to bills"
  on public.bills
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 7. Grant Admin RLS Access on HELD_FUNDS
create policy "Admins have full access to held_funds"
  on public.held_funds
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 8. Grant Admin RLS Access on HELD_FUND_HISTORY
create policy "Admins have full access to held_fund_history"
  on public.held_fund_history
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 9. Grant Admin RLS Access on CATEGORIES
create policy "Admins have full access to categories"
  on public.categories
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 10. Grant Admin RLS Access on NOTIFICATIONS
create policy "Admins have full access to notifications"
  on public.notifications
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());
