-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V8 — WORK ITEM ORDER & EXTENDED METADATA
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
--
-- Adds direct columns for board ordering, operation category,
-- and multi-style pipeline linking.
-- ================================================================

do $$
begin
  begin
    alter table public.work_items add column if not exists "order" numeric;
  exception when others then null;
  end;
  begin
    alter table public.work_items add column if not exists operation_category text;
  exception when others then null;
  end;
  begin
    alter table public.work_items add column if not exists linked_pipeline_item_ids text[] default '{}';
  exception when others then null;
  end;
end $$;

-- Create index on order for fast sprint board sorting
create index if not exists work_items_order_idx on public.work_items("order");

-- Verification
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'work_items'
  and column_name in ('order', 'operation_category', 'linked_pipeline_item_ids');
