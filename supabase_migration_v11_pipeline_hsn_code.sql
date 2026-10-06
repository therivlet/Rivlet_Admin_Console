-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V11 — SAMPLING & PRODUCTION HSN CODE
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ================================================================

-- 1. Ensure the new hsn_code column exists
alter table public.pipeline_items add column if not exists hsn_code text;

-- 2. Optional: If any data was stored in accession_code, preserve it into hsn_code
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'pipeline_items' and column_name = 'accession_code'
  ) then
    execute 'update public.pipeline_items set hsn_code = accession_code where hsn_code is null and accession_code is not null';
  end if;
end $$;

-- 3. Drop old accession_code index and column
drop index if exists public.idx_pipeline_items_accession_code;
alter table public.pipeline_items drop column if exists accession_code cascade;

-- 4. Create index for fast lookup by HSN code
create index if not exists idx_pipeline_items_hsn_code on public.pipeline_items(hsn_code);

-- 5. Verification: Inspect pipeline_items columns to confirm accession_code is removed and hsn_code is present
select column_name, data_type, column_default 
from information_schema.columns 
where table_schema = 'public' and table_name = 'pipeline_items'
order by ordinal_position;
