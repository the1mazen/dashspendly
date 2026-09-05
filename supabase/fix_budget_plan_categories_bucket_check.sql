-- ==============================================================================
-- DashSpendly - Fix budget_plan_categories bucket check constraint
-- Run this in your Supabase SQL Editor to allow 'bills' bucket in budget_plan_categories
-- ==============================================================================

ALTER TABLE public.budget_plan_categories
  DROP CONSTRAINT IF EXISTS budget_plan_categories_bucket_check;

ALTER TABLE public.budget_plan_categories
  ADD CONSTRAINT budget_plan_categories_bucket_check
  CHECK (bucket IN ('bills', 'needs', 'wants', 'savings'));
