-- ================================================================
-- RIVLET ADMIN PLATFORM: SUPABASE DATABASE & STORAGE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ================================================================

-- 1. CLAUDE HTML ARTIFACTS TABLE
create table if not exists public.artifacts (
  id text primary key default ('art-' || extract(epoch from now())::bigint),
  title text not null,
  description text default '',
  category text not null default 'Operations', -- 'Calculators', 'Operations', 'Visual Pitch', 'Production', 'Marketing', 'Custom'
  tags text[] default '{}',
  html_content text not null,
  source text default 'Claude 3.7 Sonnet',
  version text default '1.0',
  is_promoted boolean default false,
  route_slug text,
  status text default 'inbox', -- 'inbox', 'approved', 'promoted', 'archived'
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. GARMENT PRICING & COSTING SHEETS TABLE
create table if not exists public.costing_sheets (
  id text primary key default ('cost-' || extract(epoch from now())::bigint),
  sku text not null,
  style_name text not null,
  season text default 'FW26',
  category text default 'Hoodie',
  currency text default '₹',
  mrp numeric(10,2) not null default 0,
  expected_margin numeric(5,2) default 25.00,
  inputs jsonb not null default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. DOCUMENT VAULT (PDFs, Word, Tech Packs, Certs)
create table if not exists public.documents (
  id text primary key default ('doc-' || extract(epoch from now())::bigint),
  title text not null,
  document_type text not null, -- 'Certificate', 'Tech Pack', 'Legal & Contract', 'Audit Report', 'Specification'
  file_name text not null,
  file_url text not null,
  file_size_bytes bigint default 0,
  file_format text default 'pdf', -- 'pdf', 'docx', 'xlsx', 'image'
  expiry_date date,
  status text default 'Active', -- 'Active', 'Expiring Soon', 'Expired', 'Draft'
  tags text[] default '{}',
  associated_vendor text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. CONFIDENTIAL BRAND KNOWLEDGE BASE & SOPs
create table if not exists public.kb_articles (
  id text primary key default ('kb-' || extract(epoch from now())::bigint),
  title text not null,
  slug text unique not null,
  category text not null, -- 'Vendors & Mills', 'Quality & AQL', 'Brand Guidelines', 'Garment Specs', 'Business Operations'
  content text not null, -- Markdown format
  is_confidential boolean default true,
  author text default 'Rivlet Executive',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.artifacts enable row level security;
alter table public.costing_sheets enable row level security;
alter table public.documents enable row level security;
alter table public.kb_articles enable row level security;

-- Open policies for development (Can be restricted to authenticated users in Step 2)
create policy "Allow all operations for anon during setup" on public.artifacts for all using (true) with check (true);
create policy "Allow all operations for anon during setup" on public.costing_sheets for all using (true) with check (true);
create policy "Allow all operations for anon during setup" on public.documents for all using (true) with check (true);
create policy "Allow all operations for anon during setup" on public.kb_articles for all using (true) with check (true);

-- 5. STORAGE BUCKET FOR DOCUMENTS & ATTACHMENTS
insert into storage.buckets (id, name, public) 
values ('vault-files', 'vault-files', true)
on conflict (id) do nothing;

create policy "Allow public read on vault-files" on storage.objects for select using (bucket_id = 'vault-files');
create policy "Allow public upload on vault-files" on storage.objects for insert with check (bucket_id = 'vault-files');
create policy "Allow public delete on vault-files" on storage.objects for delete using (bucket_id = 'vault-files');
