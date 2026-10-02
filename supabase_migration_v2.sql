-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V2
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- (Run AFTER supabase_schema.sql has already been applied once)
--
-- This migration:
--   1. Locks down RLS + Storage policies to authenticated users only
--      (closes the "anyone with the public anon key can read/write/
--      delete everything, including confidential KB content" hole)
--   2. Adds three new tables for the vendor CRM, sampling/production
--      pipeline, and launch budget tracker
-- ================================================================

-- ----------------------------------------------------------------
-- 1. SECURITY: replace wide-open "anon during setup" policies
-- ----------------------------------------------------------------

drop policy if exists "Allow all operations for anon during setup" on public.artifacts;
drop policy if exists "Allow all operations for anon during setup" on public.costing_sheets;
drop policy if exists "Allow all operations for anon during setup" on public.documents;
drop policy if exists "Allow all operations for anon during setup" on public.kb_articles;

create policy "Authenticated users only" on public.artifacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users only" on public.costing_sheets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users only" on public.documents
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users only" on public.kb_articles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage bucket: only signed-in users may upload/delete; reads still
-- need the bucket to stay readable for signed document URLs, but we
-- scope it to authenticated sessions too since this app has no public
-- share links today.
drop policy if exists "Allow public read on vault-files" on storage.objects;
drop policy if exists "Allow public upload on vault-files" on storage.objects;
drop policy if exists "Allow public delete on vault-files" on storage.objects;

create policy "Authenticated read on vault-files" on storage.objects
  for select using (bucket_id = 'vault-files' and auth.role() = 'authenticated');
create policy "Authenticated upload on vault-files" on storage.objects
  for insert with check (bucket_id = 'vault-files' and auth.role() = 'authenticated');
create policy "Authenticated delete on vault-files" on storage.objects
  for delete using (bucket_id = 'vault-files' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 2. VENDOR / MANUFACTURER OUTREACH CRM
-- ----------------------------------------------------------------

create table if not exists public.vendors (
  id text primary key default ('ven-' || extract(epoch from now())::bigint),
  name text not null,
  location text default 'Manufacturing Facility',
  contact_name text,
  contact_email text,
  contact_phone text,
  is_vertically_integrated boolean,
  specialty text,
  stage text not null default 'Prospect',
  moq_offered numeric(10,0),
  moq_target numeric(10,0) default 175,
  payment_terms_offered text,
  payment_terms_target text default '30% advance / 50% pre-shipment / 20% on delivery',
  sampling_fee numeric(10,2),
  certifications text[] default '{}',
  last_contacted_at date,
  next_follow_up_at date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendors enable row level security;
create policy "Authenticated users only" on public.vendors
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 3. SAMPLING & PRODUCTION PIPELINE
-- ----------------------------------------------------------------

create table if not exists public.pipeline_items (
  id text primary key default ('pip-' || extract(epoch from now())::bigint),
  style_name text not null,
  sku text,
  category text not null default 'Women''s Activewear',
  colorway text,
  drop_name text default 'Drop 1',
  vendor_id text references public.vendors(id) on delete set null,
  stage text not null default 'Design Finalized',
  target_quantity numeric(10,0),
  target_date date,
  actual_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pipeline_items enable row level security;
create policy "Authenticated users only" on public.pipeline_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 4. LAUNCH BUDGET TRACKER
-- ----------------------------------------------------------------

create table if not exists public.budget_items (
  id text primary key default ('bud-' || extract(epoch from now())::bigint),
  category text not null,
  planned_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2) not null default 0,
  currency text default '₹',
  phase text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.budget_items enable row level security;
create policy "Authenticated users only" on public.budget_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- Realtime: make sure new tables broadcast changes like the rest.
-- Wrapped so this is a no-op if the publication already covers all
-- tables (Supabase default) or the table was already added.
-- ----------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.vendors;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.pipeline_items;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.budget_items;
  exception when others then null;
  end;
end $$;
