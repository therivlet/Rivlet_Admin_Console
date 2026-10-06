-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V11 — SAMPLING & PRODUCTION ACCESSION CODE
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ================================================================

-- 1. Add accession_code column to public.pipeline_items
alter table public.pipeline_items add column if not exists accession_code text;

-- 2. Index for rapid lookup by accession code
create index if not exists idx_pipeline_items_accession_code on public.pipeline_items(accession_code);

-- 3. Verification: Inspect pipeline_items columns
select column_name, data_type, column_default 
from information_schema.columns 
where table_schema = 'public' and table_name = 'pipeline_items'
order by ordinal_position;
