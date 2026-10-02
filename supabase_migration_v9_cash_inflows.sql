-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V9 — BUDGET CASHFLOW INFLOWS
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ================================================================

-- 1. Add capital inflows / cashflow injection ledger on budget_settings
alter table public.budget_settings add column if not exists inflows jsonb not null default '[]';

-- Verification
select column_name, data_type 
from information_schema.columns 
where table_schema = 'public' and table_name = 'budget_settings';
