-- ==============================================================================
-- DashSpendly - Budget Planner Schema
-- ==============================================================================

-- 1. Budget plans (named, saveable, switchable)
create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  total_amount_cents bigint not null,
  account_id uuid references public.accounts(id),
  period text not null check (period in ('weekly', 'monthly', 'custom')),
  custom_days int,
  start_date date not null,
  framework text not null check (framework in ('50/30/20', 'suggested')),
  is_active boolean default false,
  is_repeating boolean default true,
  deselected_bill_ids uuid[] default '{}',
  indicator_account_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- Migration support for existing budget_plans table
alter table public.budget_plans add column if not exists deselected_bill_ids uuid[] default '{}';
alter table public.budget_plans add column if not exists indicator_account_ids uuid[] default '{}';

-- 2. Category allocations per plan
create table if not exists public.budget_plan_categories (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.budget_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  category_id uuid references public.categories(id) not null,
  bucket text not null check (bucket in ('needs', 'wants', 'savings')),
  allocated_amount_cents bigint not null
);

-- 3. Period performance snapshots (for carry-over and comparison)
create table if not exists public.budget_plan_history (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.budget_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  period_start date not null,
  period_end date not null,
  total_planned_cents bigint not null,
  total_actual_cents bigint not null,
  created_at timestamptz default now()
);

-- 4. Per-category performance per period
create table if not exists public.budget_plan_category_history (
  id uuid primary key default gen_random_uuid(),
  plan_history_id uuid references public.budget_plan_history(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  category_id uuid references public.categories(id) not null,
  planned_amount_cents bigint not null,
  actual_amount_cents bigint not null
);

-- Enable RLS
alter table public.budget_plans enable row level security;
alter table public.budget_plan_categories enable row level security;
alter table public.budget_plan_history enable row level security;
alter table public.budget_plan_category_history enable row level security;

-- Policies
create policy "Users manage own budget plans" on public.budget_plans for all using (auth.uid() = user_id);
create policy "Users manage own plan categories" on public.budget_plan_categories for all using (auth.uid() = user_id);
create policy "Users manage own plan history" on public.budget_plan_history for all using (auth.uid() = user_id);
create policy "Users manage own plan category history" on public.budget_plan_category_history for all using (auth.uid() = user_id);
