-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V14 — BUDGET ITEM ORDER COLUMN
-- Run in Supabase SQL Editor if you want database-level persistence
-- of custom category drag order.
-- ================================================================

do $$
begin
  begin
    alter table public.budget_items add column if not exists "order" numeric;
  exception when others then null;
  end;
end $$;

-- Create index on order for fast ledger queries
create index if not exists budget_items_order_idx on public.budget_items("order");

-- Verify column addition
select column_name, data_type 
from information_schema.columns 
where table_schema = 'public' 
  and table_name = 'budget_items' 
  and column_name = 'order';
