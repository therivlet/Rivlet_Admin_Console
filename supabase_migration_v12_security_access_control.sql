-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V12 — ENTERPRISE ACCESS CONTROL & RLS
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
--
-- This migration establishes:
-- 1. public.user_profiles and public.user_permissions tables
-- 2. Preserves and auto-bootstraps the existing Supabase Owner
-- 3. Trigger preventing deletion, demotion or deactivation of the last Owner
-- 4. Central security function: public.has_permission(uid, module, action)
-- 5. Strict database-level RLS policies on ALL 13 business tables and Storage
-- ================================================================

-- 1. USER PROFILES TABLE
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null check (role in ('owner', 'admin', 'manager', 'member')),
  status text not null default 'active' check (status in ('active', 'deactivated')),
  metadata jsonb default '{}'::jsonb,
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  last_active_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast user and status lookup
create index if not exists idx_user_profiles_role_status on public.user_profiles(role, status);
create index if not exists idx_user_profiles_email on public.user_profiles(email);

-- 2. PER-USER MODULE PERMISSION OVERRIDES TABLE
create table if not exists public.user_permissions (
  id text primary key default ('perm-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  module text not null check (module in (
    'dashboard', 'work', 'vendors', 'pipeline', 'documents',
    'calculator', 'budget', 'knowledge', 'artifacts', 'profile',
    'access', 'audit', 'notifications'
  )),
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_export boolean not null default false,
  can_approve boolean not null default false,
  can_manage_access boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, module)
);

create index if not exists idx_user_permissions_user_module on public.user_permissions(user_id, module);

-- 3. AUTOMATIC OWNER PRESERVATION & BOOTSTRAP LOGIC
-- If auth.users already has any user, bind the earliest created user as the permanent Owner
do $$
declare
  first_auth_user record;
begin
  select id, email, raw_user_meta_data->>'full_name' as name
  into first_auth_user
  from auth.users
  order by created_at asc
  limit 1;

  if first_auth_user.id is not null then
    insert into public.user_profiles (id, email, name, role, status)
    values (
      first_auth_user.id,
      first_auth_user.email,
      coalesce(first_auth_user.name, split_part(first_auth_user.email, '@', 1), 'Rivlet Owner'),
      'owner',
      'active'
    )
    on conflict (id) do update set role = 'owner', status = 'active';
  end if;
end $$;

-- Callable function for client bootstrap or claim: ensures current user gets recognized
create or replace function public.claim_or_bootstrap_owner()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_uid uuid;
  current_user_email text;
  current_user_name text;
  active_owner_count int;
  user_prof record;
  assigned_role text;
begin
  current_uid := auth.uid();
  if current_uid is null then
    return jsonb_build_object('success', false, 'error', 'No authenticated session');
  end if;

  select email, raw_user_meta_data->>'full_name'
  into current_user_email, current_user_name
  from auth.users
  where id = current_uid;

  select count(*) into active_owner_count from public.user_profiles where role = 'owner' and status = 'active';
  select * into user_prof from public.user_profiles where id = current_uid;

  if user_prof.id is not null then
    -- If no active owner exists in the database, promote current active user
    if active_owner_count = 0 and user_prof.status = 'active' then
      update public.user_profiles set role = 'owner', updated_at = now() where id = current_uid;
      return jsonb_build_object('success', true, 'role', 'owner', 'message', 'Promoted to Owner');
    end if;
    return jsonb_build_object('success', true, 'role', user_prof.role, 'status', user_prof.status);
  end if;

  -- Create profile: First user becomes Owner; subsequent users default to 'member'
  assigned_role := case when active_owner_count = 0 then 'owner' else 'member' end;

  insert into public.user_profiles (id, email, name, role, status)
  values (
    current_uid,
    coalesce(current_user_email, 'admin@therivlet.com'),
    coalesce(current_user_name, split_part(current_user_email, '@', 1), 'Rivlet Executive'),
    assigned_role,
    'active'
  );

  return jsonb_build_object('success', true, 'role', assigned_role, 'bootstrapped', true);
end;
$$;

-- 4. TRIGGER: PREVENT DEMOTION, DEACTIVATION OR DELETION OF THE LAST ACTIVE OWNER
create or replace function public.protect_last_owner()
returns trigger
language plpgsql
as $$
declare
  remaining_active_owners int;
begin
  if (TG_OP = 'DELETE' and OLD.role = 'owner') then
    select count(*) into remaining_active_owners
    from public.user_profiles
    where role = 'owner' and status = 'active' and id != OLD.id;

    if remaining_active_owners < 1 then
      raise exception 'Security Violation: Cannot delete the last active Owner account.';
    end if;
    return OLD;
  end if;

  if (TG_OP = 'UPDATE' and OLD.role = 'owner') then
    if (NEW.role != 'owner' or NEW.status != 'active') then
      select count(*) into remaining_active_owners
      from public.user_profiles
      where role = 'owner' and status = 'active' and id != OLD.id;

      if remaining_active_owners < 1 then
        raise exception 'Security Violation: Cannot demote or deactivate the last active Owner account.';
      end if;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_protect_last_owner on public.user_profiles;
create trigger trg_protect_last_owner
before update or delete on public.user_profiles
for each row execute function public.protect_last_owner();

-- 5. CENTRAL SECURITY DEFINER PERMISSION EVALUATION ENGINE
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
  if lookup_uid is null then
    return false;
  end if;

  select role, status into prof
  from public.user_profiles
  where id = lookup_uid;

  if not found or prof.status != 'active' then
    return false;
  end if;

  -- 1. Owner Template: Unconditional unrestricted access
  if prof.role = 'owner' then
    return true;
  end if;

  -- 2. Per-User Explicit Overrides take precedence over template defaults
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

  -- 3. Administrator Template:
  if prof.role = 'admin' then
    -- Administrator cannot manage access unless explicitly granted override
    if target_action = 'manage_access' then
      return false;
    end if;
    -- Audit logs export or write restricted
    if target_module = 'audit' and target_action != 'view' then
      return false;
    end if;
    return true;
  end if;

  -- 4. Manager Template:
  if prof.role = 'manager' then
    if target_module in ('access', 'audit') then
      return false;
    end if;
    if target_action in ('delete', 'manage_access') then
      return false;
    end if;
    return true;
  end if;

  -- 5. Team Member Template (Default deny except assigned view):
  if prof.role = 'member' then
    if target_module in ('access', 'audit', 'budget', 'calculator') then
      return false;
    end if;
    if target_action in ('create', 'edit', 'delete', 'export', 'approve', 'manage_access') then
      return false;
    end if;
    if target_action = 'view' and target_module in ('dashboard', 'work', 'pipeline', 'documents', 'knowledge', 'profile', 'notifications') then
      return true;
    end if;
    return false;
  end if;

  return false;
end;
$$;

-- 6. ENABLE ROW LEVEL SECURITY ON PROFILES & PERMISSIONS
alter table public.user_profiles enable row level security;
alter table public.user_permissions enable row level security;

-- Drop legacy policies
do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'user_profiles' loop
    execute format('drop policy %I on public.user_profiles', pol.policyname);
  end loop;
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'user_permissions' loop
    execute format('drop policy %I on public.user_permissions', pol.policyname);
  end loop;
end $$;

-- user_profiles policies
create policy "Read user profiles" on public.user_profiles
  for select using (
    id = auth.uid() or public.has_permission(auth.uid(), 'access', 'view')
  );

create policy "Insert user profiles" on public.user_profiles
  for insert with check (
    id = auth.uid() or public.has_permission(auth.uid(), 'access', 'manage_access')
  );

create policy "Update user profiles" on public.user_profiles
  for update using (
    id = auth.uid() or public.has_permission(auth.uid(), 'access', 'manage_access')
  ) with check (
    id = auth.uid() or public.has_permission(auth.uid(), 'access', 'manage_access')
  );

create policy "Delete user profiles" on public.user_profiles
  for delete using (
    public.has_permission(auth.uid(), 'access', 'manage_access')
  );

-- user_permissions policies
create policy "Read user permissions" on public.user_permissions
  for select using (
    user_id = auth.uid() or public.has_permission(auth.uid(), 'access', 'view')
  );

create policy "Modify user permissions" on public.user_permissions
  for all using (
    public.has_permission(auth.uid(), 'access', 'manage_access')
  ) with check (
    public.has_permission(auth.uid(), 'access', 'manage_access')
  );

-- 7. MIGRATE ALL BUSINESS TABLES TO FINE-GRAINED ACTION-BASED RLS POLICIES
do $$
declare
  pol record;
  target_tables text[] := array[
    'artifacts', 'costing_sheets', 'documents', 'kb_articles',
    'vendors', 'pipeline_items', 'budget_items', 'budget_settings',
    'sprints', 'work_items', 'team_members', 'work_settings'
  ];
  t text;
begin
  foreach t in array target_tables loop
    if to_regclass('public.' || t) is not null then
      for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
        execute format('drop policy %I on public.%I', pol.policyname, t);
      end loop;
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- Apply granular policies per module
-- ARTIFACTS (Module: artifacts)
create policy "artifacts_select" on public.artifacts for select using (public.has_permission(auth.uid(), 'artifacts', 'view'));
create policy "artifacts_insert" on public.artifacts for insert with check (public.has_permission(auth.uid(), 'artifacts', 'create'));
create policy "artifacts_update" on public.artifacts for update using (public.has_permission(auth.uid(), 'artifacts', 'edit')) with check (public.has_permission(auth.uid(), 'artifacts', 'edit'));
create policy "artifacts_delete" on public.artifacts for delete using (public.has_permission(auth.uid(), 'artifacts', 'delete'));

-- COSTING SHEETS (Module: calculator)
create policy "costing_sheets_select" on public.costing_sheets for select using (public.has_permission(auth.uid(), 'calculator', 'view'));
create policy "costing_sheets_insert" on public.costing_sheets for insert with check (public.has_permission(auth.uid(), 'calculator', 'create'));
create policy "costing_sheets_update" on public.costing_sheets for update using (public.has_permission(auth.uid(), 'calculator', 'edit')) with check (public.has_permission(auth.uid(), 'calculator', 'edit'));
create policy "costing_sheets_delete" on public.costing_sheets for delete using (public.has_permission(auth.uid(), 'calculator', 'delete'));

-- DOCUMENTS (Module: documents)
create policy "documents_select" on public.documents for select using (public.has_permission(auth.uid(), 'documents', 'view'));
create policy "documents_insert" on public.documents for insert with check (public.has_permission(auth.uid(), 'documents', 'create'));
create policy "documents_update" on public.documents for update using (public.has_permission(auth.uid(), 'documents', 'edit')) with check (public.has_permission(auth.uid(), 'documents', 'edit'));
create policy "documents_delete" on public.documents for delete using (public.has_permission(auth.uid(), 'documents', 'delete'));

-- KB ARTICLES (Module: knowledge)
create policy "kb_articles_select" on public.kb_articles for select using (public.has_permission(auth.uid(), 'knowledge', 'view'));
create policy "kb_articles_insert" on public.kb_articles for insert with check (public.has_permission(auth.uid(), 'knowledge', 'create'));
create policy "kb_articles_update" on public.kb_articles for update using (public.has_permission(auth.uid(), 'knowledge', 'edit')) with check (public.has_permission(auth.uid(), 'knowledge', 'edit'));
create policy "kb_articles_delete" on public.kb_articles for delete using (public.has_permission(auth.uid(), 'knowledge', 'delete'));

-- VENDORS (Module: vendors)
create policy "vendors_select" on public.vendors for select using (public.has_permission(auth.uid(), 'vendors', 'view'));
create policy "vendors_insert" on public.vendors for insert with check (public.has_permission(auth.uid(), 'vendors', 'create'));
create policy "vendors_update" on public.vendors for update using (public.has_permission(auth.uid(), 'vendors', 'edit')) with check (public.has_permission(auth.uid(), 'vendors', 'edit'));
create policy "vendors_delete" on public.vendors for delete using (public.has_permission(auth.uid(), 'vendors', 'delete'));

-- PIPELINE ITEMS (Module: pipeline)
create policy "pipeline_items_select" on public.pipeline_items for select using (public.has_permission(auth.uid(), 'pipeline', 'view'));
create policy "pipeline_items_insert" on public.pipeline_items for insert with check (public.has_permission(auth.uid(), 'pipeline', 'create'));
create policy "pipeline_items_update" on public.pipeline_items for update using (public.has_permission(auth.uid(), 'pipeline', 'edit')) with check (public.has_permission(auth.uid(), 'pipeline', 'edit'));
create policy "pipeline_items_delete" on public.pipeline_items for delete using (public.has_permission(auth.uid(), 'pipeline', 'delete'));

-- BUDGET (Module: budget)
create policy "budget_items_select" on public.budget_items for select using (public.has_permission(auth.uid(), 'budget', 'view'));
create policy "budget_items_insert" on public.budget_items for insert with check (public.has_permission(auth.uid(), 'budget', 'create'));
create policy "budget_items_update" on public.budget_items for update using (public.has_permission(auth.uid(), 'budget', 'edit')) with check (public.has_permission(auth.uid(), 'budget', 'edit'));
create policy "budget_items_delete" on public.budget_items for delete using (public.has_permission(auth.uid(), 'budget', 'delete'));

create policy "budget_settings_select" on public.budget_settings for select using (public.has_permission(auth.uid(), 'budget', 'view'));
create policy "budget_settings_insert" on public.budget_settings for insert with check (public.has_permission(auth.uid(), 'budget', 'edit'));
create policy "budget_settings_update" on public.budget_settings for update using (public.has_permission(auth.uid(), 'budget', 'edit')) with check (public.has_permission(auth.uid(), 'budget', 'edit'));

-- WORK TRACKING (Module: work)
create policy "sprints_select" on public.sprints for select using (public.has_permission(auth.uid(), 'work', 'view'));
create policy "sprints_insert" on public.sprints for insert with check (public.has_permission(auth.uid(), 'work', 'create'));
create policy "sprints_update" on public.sprints for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));
create policy "sprints_delete" on public.sprints for delete using (public.has_permission(auth.uid(), 'work', 'delete'));

create policy "work_items_select" on public.work_items for select using (public.has_permission(auth.uid(), 'work', 'view'));
create policy "work_items_insert" on public.work_items for insert with check (public.has_permission(auth.uid(), 'work', 'create'));
create policy "work_items_update" on public.work_items for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));
create policy "work_items_delete" on public.work_items for delete using (public.has_permission(auth.uid(), 'work', 'delete'));

create policy "team_members_select" on public.team_members for select using (public.has_permission(auth.uid(), 'work', 'view'));
create policy "team_members_insert" on public.team_members for insert with check (public.has_permission(auth.uid(), 'work', 'create'));
create policy "team_members_update" on public.team_members for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));
create policy "team_members_delete" on public.team_members for delete using (public.has_permission(auth.uid(), 'work', 'delete'));

create policy "work_settings_select" on public.work_settings for select using (public.has_permission(auth.uid(), 'work', 'view'));
create policy "work_settings_insert" on public.work_settings for insert with check (public.has_permission(auth.uid(), 'work', 'edit'));
create policy "work_settings_update" on public.work_settings for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));

-- 8. STORAGE RLS POLICIES FOR VAULT BUCKET
do $$
declare
  pol record;
begin
  if to_regclass('storage.objects') is not null then
    for pol in
      select policyname from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
        and (policyname ilike '%vault%files%' or policyname in ('vault_files_select', 'vault_files_insert', 'vault_files_delete'))
    loop
      execute format('drop policy %I on storage.objects', pol.policyname);
    end loop;
  end if;
end $$;

create policy "vault_files_select" on storage.objects
  for select using (bucket_id = 'vault-files' and public.has_permission(auth.uid(), 'documents', 'view'));

create policy "vault_files_insert" on storage.objects
  for insert with check (bucket_id = 'vault-files' and public.has_permission(auth.uid(), 'documents', 'create'));

create policy "vault_files_delete" on storage.objects
  for delete using (bucket_id = 'vault-files' and public.has_permission(auth.uid(), 'documents', 'delete'));

-- ----------------------------------------------------------------
-- Verification queries
-- ----------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('user_profiles', 'user_permissions', 'artifacts', 'vendors', 'costing_sheets')
order by tablename, cmd;
