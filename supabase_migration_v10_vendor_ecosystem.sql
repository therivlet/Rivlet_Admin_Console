-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V10 — VENDORS & MANUFACTURERS ECOSYSTEM
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ================================================================

-- 1. Multi-category classification and profile columns on public.vendors
alter table public.vendors add column if not exists category text not null default 'Manufacturer';
alter table public.vendors add column if not exists subcategory text;
alter table public.vendors add column if not exists website text;
alter table public.vendors add column if not exists health_status text default 'Good';
alter table public.vendors add column if not exists rating numeric(2,1) default 5.0;
alter table public.vendors add column if not exists stage_progress_percent integer default 0;

-- 2. Structured JSONB columns for multi-contact, commercials, logs, and docs
alter table public.vendors add column if not exists contacts jsonb default '[]'::jsonb;
alter table public.vendors add column if not exists commercials jsonb default '{}'::jsonb;
alter table public.vendors add column if not exists communication_logs jsonb default '[]'::jsonb;
alter table public.vendors add column if not exists documents jsonb default '[]'::jsonb;
alter table public.vendors add column if not exists category_specs jsonb default '{}'::jsonb;
alter table public.vendors add column if not exists total_spend_to_date numeric(14,2) default 0;

-- 3. Indexes for fast category, health, and stage queries
create index if not exists idx_vendors_category on public.vendors(category);
create index if not exists idx_vendors_health_status on public.vendors(health_status);
create index if not exists idx_vendors_stage on public.vendors(stage);

-- Verification: Inspect vendors table columns
select column_name, data_type, column_default 
from information_schema.columns 
where table_schema = 'public' and table_name = 'vendors'
order by ordinal_position;
