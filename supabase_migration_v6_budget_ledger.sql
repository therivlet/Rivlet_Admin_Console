-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V6 — BUDGET SPEND LEDGER
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Per-category spend ledger on budget_items
-- ----------------------------------------------------------------

alter table public.budget_items add column if not exists spend_log jsonb not null default '[]';

-- ----------------------------------------------------------------
-- 2. Budget settings (singleton row: fixed total planned override)
-- ----------------------------------------------------------------

create table if not exists public.budget_settings (
  id text primary key default 'default',
  total_planned_override numeric(12,2),
  updated_at timestamptz default now()
);

alter table public.budget_settings enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'budget_settings' loop
    execute format('drop policy %I on public.budget_settings', pol.policyname);
  end loop;
end $$;

create policy "Authenticated users only" on public.budget_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

do $$
begin
  begin
    alter publication supabase_realtime add table public.budget_settings;
  exception when others then null;
  end;
end $$;

-- ----------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'budget_settings';
