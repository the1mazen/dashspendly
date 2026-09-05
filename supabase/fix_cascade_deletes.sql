-- =====================================================================
-- Supabase Schema Migration: Cascade Deletes for Accounts, Bills & Held Funds
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/djayknvnhlmseskklnip/sql
-- =====================================================================

-- 1. Transactions: Cascade delete when account is deleted
do \$\$ begin
  -- Drop existing account_id foreign key if present
  alter table if exists public.transactions drop constraint if exists transactions_account_id_fkey;
  alter table if exists public.transactions drop constraint if exists fk_transactions_account;
  -- Re-add with ON DELETE CASCADE
  alter table if exists public.transactions 
    add constraint transactions_account_id_fkey 
    foreign key (account_id) references public.accounts(id) on delete cascade;

  -- Drop existing destination_account_id foreign key if present
  alter table if exists public.transactions drop constraint if exists transactions_destination_account_id_fkey;
  alter table if exists public.transactions drop constraint if exists fk_transactions_destination_account;
  -- Re-add with ON DELETE CASCADE
  alter table if exists public.transactions 
    add constraint transactions_destination_account_id_fkey 
    foreign key (destination_account_id) references public.accounts(id) on delete cascade;
exception when others then
  raise notice 'Could not update transactions foreign keys: %', SQLERRM;
end \$\$;

-- 2. Bills: Cascade delete when account or parent bill is deleted
do \$\$ begin
  alter table if exists public.bills drop constraint if exists bills_account_id_fkey;
  alter table if exists public.bills 
    add constraint bills_account_id_fkey 
    foreign key (account_id) references public.accounts(id) on delete cascade;

  alter table if exists public.bills drop constraint if exists bills_destination_account_id_fkey;
  alter table if exists public.bills 
    add constraint bills_destination_account_id_fkey 
    foreign key (destination_account_id) references public.accounts(id) on delete cascade;

  alter table if exists public.bills drop constraint if exists bills_parent_bill_id_fkey;
  alter table if exists public.bills 
    add constraint bills_parent_bill_id_fkey 
    foreign key (parent_bill_id) references public.bills(id) on delete cascade;
exception when others then
  raise notice 'Could not update bills foreign keys: %', SQLERRM;
end \$\$;

-- 3. Held Funds & History: Cascade delete
do \$\$ begin
  alter table if exists public.held_funds drop constraint if exists held_funds_account_id_fkey;
  alter table if exists public.held_funds 
    add constraint held_funds_account_id_fkey 
    foreign key (account_id) references public.accounts(id) on delete cascade;

  alter table if exists public.held_fund_history drop constraint if exists held_fund_history_held_fund_id_fkey;
  alter table if exists public.held_fund_history 
    add constraint held_fund_history_held_fund_id_fkey 
    foreign key (held_fund_id) references public.held_funds(id) on delete cascade;
exception when others then
  raise notice 'Could not update held funds foreign keys: %', SQLERRM;
end \$\$;
