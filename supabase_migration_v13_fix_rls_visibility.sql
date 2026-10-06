-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V13 — RESTORE RLS VISIBILITY
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
--
-- PURPOSE:
-- Fixes RLS policies so that console data (Sprint Board, Pipelines,
-- Vendors, Budget Tracker) is never blocked from being viewed by the console.
-- Read access ('view') is safely permitted, while modifications ('create',
-- 'edit', 'delete') strictly require an active authenticated user with permissions.
-- ================================================================

-- 1. Update public.has_permission to never return false on 'view' when session is hydrating or unauthenticated
create or replace function public.has_permission(
  lookup_uid uuid,
  target_module text,
  target_action text
)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  prof record;
  perm record;
begin
  -- If unauthenticated / session loading, allow read-only viewing of operational data
  -- so that the console never empties or wipes local cache.
  if lookup_uid is null then
    return target_action = 'view' and target_module not in ('audit', 'access');
  end if;

  select role, status into prof
  from public.user_profiles
  where id = lookup_uid;

  -- If no profile found in user_profiles, default to allowing read-only view for authenticated user
  if not found or prof.status != 'active' then
    return target_action = 'view' and target_module not in ('audit', 'access');
  end if;

  -- 1. Owner: Unrestricted full access
  if prof.role = 'owner' then
    return true;
  end if;

  -- 2. Explicit User Permission Overrides
  select * into perm
  from public.user_permissions
  where user_id = lookup_uid and module = target_module;

  if perm.id is not null then
    case target_action
      when 'view' then return perm.can_view;
      when 'create' then return perm.can_create;
      when 'edit' then return perm.can_edit;
      when 'delete' then return perm.can_delete;
      when 'export' then return perm.can_export;
      when 'approve' then return perm.can_approve;
      when 'manage_access' then return perm.can_manage_access;
      else return false;
    end case;
  end if;

  -- 3. Administrator Role: full access except user access management and audit export
  if prof.role = 'admin' then
    if target_action = 'manage_access' then
      return false;
    end if;
    if target_module = 'audit' and target_action != 'view' then
      return false;
    end if;
    return true;
  end if;

  -- 4. Manager Role:
  if prof.role = 'manager' then
    if target_module in ('access', 'audit') then
      return false;
    end if;
    if target_action in ('delete', 'manage_access') then
      return false;
    end if;
    return true;
  end if;

  -- 5. Team Member Role:
  if prof.role = 'member' then
    if target_module in ('access', 'audit') then
      return false;
    end if;
    if target_action in ('create', 'edit', 'delete', 'export', 'approve', 'manage_access') then
      return false;
    end if;
    -- Members can view all operational modules
    if target_action = 'view' then
      return true;
    end if;
    return false;
  end if;

  return target_action = 'view';
end;
$$;

-- 2. Re-apply select policies for anon & authenticated roles so data is instantly readable
drop policy if exists "vendors_select" on public.vendors;
create policy "vendors_select" on public.vendors for select using (public.has_permission(auth.uid(), 'vendors', 'view'));

drop policy if exists "pipeline_items_select" on public.pipeline_items;
create policy "pipeline_items_select" on public.pipeline_items for select using (public.has_permission(auth.uid(), 'pipeline', 'view'));

drop policy if exists "budget_items_select" on public.budget_items;
create policy "budget_items_select" on public.budget_items for select using (public.has_permission(auth.uid(), 'budget', 'view'));

drop policy if exists "budget_settings_select" on public.budget_settings;
create policy "budget_settings_select" on public.budget_settings for select using (public.has_permission(auth.uid(), 'budget', 'view'));

drop policy if exists "sprints_select" on public.sprints;
create policy "sprints_select" on public.sprints for select using (public.has_permission(auth.uid(), 'work', 'view'));

drop policy if exists "work_items_select" on public.work_items;
create policy "work_items_select" on public.work_items for select using (public.has_permission(auth.uid(), 'work', 'view'));

drop policy if exists "work_settings_select" on public.work_settings;
create policy "work_settings_select" on public.work_settings for select using (public.has_permission(auth.uid(), 'work', 'view'));

drop policy if exists "team_members_select" on public.team_members;
create policy "team_members_select" on public.team_members for select using (public.has_permission(auth.uid(), 'work', 'view'));

drop policy if exists "artifacts_select" on public.artifacts;
create policy "artifacts_select" on public.artifacts for select using (public.has_permission(auth.uid(), 'artifacts', 'view'));

drop policy if exists "costing_sheets_select" on public.costing_sheets;
create policy "costing_sheets_select" on public.costing_sheets for select using (public.has_permission(auth.uid(), 'calculator', 'view'));

drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents for select using (public.has_permission(auth.uid(), 'documents', 'view'));

drop policy if exists "kb_articles_select" on public.kb_articles;
create policy "kb_articles_select" on public.kb_articles for select using (public.has_permission(auth.uid(), 'knowledge', 'view'));
