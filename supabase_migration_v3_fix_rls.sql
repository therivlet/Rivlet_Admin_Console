-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V3 — RLS LOCKDOWN FIX
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
--
-- v2's DROP POLICY IF EXISTS didn't match the actual policy name on
-- your project ("Allow all operations for anon" vs the script's
-- "...during setup"), so the old wide-open policy stayed active
-- alongside the new authenticated-only one. Since Postgres RLS
-- policies are OR'd together, the old permissive policy still won
-- and anon reads kept working.
--
-- This version doesn't guess policy names — it dynamically drops
-- EVERY existing policy on each table, then creates exactly one
-- clean "Authenticated users only" policy. Safe to re-run anytime.
-- ================================================================

do $$
declare
  pol record;
  target_tables text[] := array['artifacts', 'costing_sheets', 'documents', 'kb_articles', 'vendors', 'pipeline_items', 'budget_items'];
  t text;
begin
  foreach t in array target_tables loop
    -- Skip tables that don't exist yet (e.g. if v2 wasn't run at all)
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    for pol in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;

    execute format(
      'create policy %I on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      'Authenticated users only', t
    );
  end loop;
end $$;

-- Storage bucket: same dynamic-drop treatment for vault-files policies
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname ilike '%vault-files%'
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "Authenticated read on vault-files" on storage.objects
  for select using (bucket_id = 'vault-files' and auth.role() = 'authenticated');
create policy "Authenticated upload on vault-files" on storage.objects
  for insert with check (bucket_id = 'vault-files' and auth.role() = 'authenticated');
create policy "Authenticated delete on vault-files" on storage.objects
  for delete using (bucket_id = 'vault-files' and auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- Verification: run this after the block above — every row should
-- show exactly one policy named "Authenticated users only" per table.
-- ----------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('artifacts', 'costing_sheets', 'documents', 'kb_articles', 'vendors', 'pipeline_items', 'budget_items')
order by tablename;
