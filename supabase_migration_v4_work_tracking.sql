-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V4 — WORK TRACKING (ADO-STYLE)
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- (Safe to run regardless of whether v2/v3 have been applied yet)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. SPRINTS (ITERATIONS)
-- ----------------------------------------------------------------

create table if not exists public.sprints (
  id text primary key default ('spr-' || extract(epoch from now())::bigint),
  name text not null,
  goal text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sprints enable row level security;

do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'sprints' loop
    execute format('drop policy %I on public.sprints', pol.policyname);
  end loop;
end $$;

create policy "Authenticated users only" on public.sprints
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 2. WORK ITEMS (EPIC / FEATURE / USER STORY / TASK / BUG)
-- ----------------------------------------------------------------

create table if not exists public.work_items (
  id text primary key default ('wi-' || extract(epoch from now())::bigint),
  type text not null default 'Task', -- 'Epic', 'Feature', 'User Story', 'Task', 'Bug'
  title text not null,
  description text,
  acceptance_criteria text,
  state text not null default 'New', -- 'New', 'Active', 'In Review', 'Resolved', 'Closed'
  priority smallint not null default 2, -- 1 (highest) - 4 (lowest)
  story_points numeric(6,1),
  assignee text,
  tags text[] default '{}',
  parent_id text references public.work_items(id) on delete set null,
  sprint_id text references public.sprints(id) on delete set null,
  start_date date,
  target_date date,
  completed_date date,
  comments jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists work_items_parent_idx on public.work_items(parent_id);
create index if not exists work_items_sprint_idx on public.work_items(sprint_id);

alter table public.work_items enable row level security;

do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'work_items' loop
    execute format('drop policy %I on public.work_items', pol.policyname);
  end loop;
end $$;

create policy "Authenticated users only" on public.work_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.sprints;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.work_items;
  exception when others then null;
  end;
end $$;

-- ----------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('sprints', 'work_items')
order by tablename;
