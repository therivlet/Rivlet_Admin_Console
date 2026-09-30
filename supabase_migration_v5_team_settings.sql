-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V5 — TEAM ROSTER & WORK SETTINGS
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TEAM MEMBERS (assignee roster)
-- ----------------------------------------------------------------

create table if not exists public.team_members (
  id text primary key default ('tm-' || extract(epoch from now())::bigint),
  name text not null,
  role text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.team_members enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'team_members' loop
    execute format('drop policy %I on public.team_members', pol.policyname);
  end loop;
end $$;

create policy "Authenticated users only" on public.team_members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 2. WORK SETTINGS (singleton row: sprint cadence, etc.)
-- ----------------------------------------------------------------

create table if not exists public.work_settings (
  id text primary key default 'default',
  default_sprint_length_days integer not null default 14,
  updated_at timestamptz default now()
);

alter table public.work_settings enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'work_settings' loop
    execute format('drop policy %I on public.work_settings', pol.policyname);
  end loop;
end $$;

create policy "Authenticated users only" on public.work_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 3. Cross-link columns on work_items (manufacturer / pipeline style)
-- ----------------------------------------------------------------

do $$
begin
  begin
    alter table public.work_items add column if not exists linked_vendor_id text references public.vendors(id) on delete set null;
  exception when others then null;
  end;
  begin
    alter table public.work_items add column if not exists linked_pipeline_item_id text references public.pipeline_items(id) on delete set null;
  exception when others then null;
  end;
end $$;

-- ----------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.team_members;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.work_settings;
  exception when others then null;
  end;
end $$;

-- ----------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('team_members', 'work_settings')
order by tablename;
