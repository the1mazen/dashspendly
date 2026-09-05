-- ==============================================================================
-- DashSpendly - Category Grouping Migration (Needs / Wants / Savings / Bills / Ungrouped)
-- Copy and run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/djayknvnhlmseskklnip/sql
-- ==============================================================================

-- 1. Add "group" column to categories
alter table if exists public.categories 
  add column if not exists "group" text check ("group" in ('needs', 'wants', 'savings', 'bills', 'ungrouped'));

-- 2. Index for filtering categories by group
create index if not exists idx_categories_group on public.categories("group");
