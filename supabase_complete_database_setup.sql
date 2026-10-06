-- ================================================================
-- RIVLET ADMIN PLATFORM: COMPLETE CONSOLIDATED DATABASE SETUP
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
--
-- This script idempotently creates/verifies ALL 18 business & governance tables,
-- columns, indexes, functions, triggers, and Row Level Security (RLS) policies.
-- Safe to run on both FRESH environments and EXISTING databases.
-- ================================================================

-- 1. CLAUDE HTML ARTIFACTS
create table if not exists public.artifacts (
  id text primary key default ('art-' || extract(epoch from now())::bigint),
  title text not null,
  description text default '',
  category text not null default 'Operations',
  tags text[] default '{}',
  html_content text not null,
  source text default 'Claude 3.7 Sonnet',
  version text default '1.0',
  is_promoted boolean default false,
  route_slug text,
  status text default 'inbox',
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. GARMENT PRICING & COSTING SHEETS
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

-- 3. DOCUMENT VAULT
create table if not exists public.documents (
  id text primary key default ('doc-' || extract(epoch from now())::bigint),
  title text not null,
  document_type text not null,
  file_name text not null,
  file_url text not null,
  file_size_bytes bigint default 0,
  file_format text default 'pdf',
  expiry_date date,
  status text default 'Active',
  tags text[] default '{}',
  associated_vendor text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. BRAND KNOWLEDGE BASE & SOPS
create table if not exists public.kb_articles (
  id text primary key default ('kb-' || extract(epoch from now())::bigint),
  title text not null,
  slug text unique not null,
  category text not null,
  content text not null,
  is_confidential boolean default true,
  author text default 'Rivlet Executive',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. VENDORS / MANUFACTURERS
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
  next_follow_up_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure vendor ecosystem columns exist
alter table public.vendors add column if not exists tier text default 'Tier 2 (Evaluating)';
alter table public.vendors add column if not exists credit_period_days int default 30;
alter table public.vendors add column if not exists sampling_lead_time_days int default 14;
alter table public.vendors add column if not exists bulk_lead_time_days int default 45;
alter table public.vendors add column if not exists commercial_terms jsonb default '{}'::jsonb;

-- 6. SAMPLING & PRODUCTION PIPELINE
create table if not exists public.pipeline_items (
  id text primary key default ('pipe-' || extract(epoch from now())::bigint),
  style_id text not null,
  name text not null,
  season text not null default 'FW26',
  stage text not null default 'Tech Pack Pending',
  factory text,
  units int not null default 0,
  target_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure HSN code column exists and remove legacy accession_code if present
alter table public.pipeline_items add column if not exists hsn_code text default '6109.10.00';
alter table public.pipeline_items drop column if exists accession_code;

-- 7. BUDGET ITEMS & SETTINGS
create table if not exists public.budget_items (
  id text primary key default ('bud-' || extract(epoch from now())::bigint),
  category text not null,
  subcategory text not null default '',
  planned_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2) not null default 0,
  status text not null default 'Planned',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.budget_settings (
  id text primary key default 'singleton',
  total_planned_override numeric(12,2),
  season text default 'FW26',
  contingency_pct numeric(5,2) default 10.00,
  inflows jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.budget_settings add column if not exists inflows jsonb default '[]'::jsonb;

-- 8. SPRINTS & WORK TRACKING
create table if not exists public.sprints (
  id text primary key default ('spr-' || extract(epoch from now())::bigint),
  name text not null,
  season text default 'FW26',
  start_date date not null,
  end_date date not null,
  goal text,
  status text not null default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.work_items (
  id text primary key default ('wi-' || extract(epoch from now())::bigint),
  title text not null,
  type text not null default 'Task',
  state text not null default 'Active',
  assigned_to text,
  priority text default 'Medium',
  season text default 'FW26',
  sprint_id text,
  target_date date,
  description text,
  order_index int default 0,
  work_item_id text,
  style_id text,
  vendor_id text,
  costing_sheet_id text,
  doc_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.work_items add column if not exists order_index int default 0;

-- 9. TEAM MEMBERS & WORK SETTINGS
create table if not exists public.team_members (
  id text primary key default ('tm-' || extract(epoch from now())::bigint),
  name text not null,
  email text,
  role text not null default 'Member',
  avatar text,
  color text default '#cda052',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.work_settings (
  id text primary key default 'singleton',
  task_types jsonb default '["Task", "Milestone", "Bug", "Decision", "Blocker"]'::jsonb,
  states jsonb default '["New", "Active", "Resolved", "Closed"]'::jsonb,
  priorities jsonb default '["Low", "Medium", "High", "Critical"]'::jsonb,
  updated_at timestamptz default now()
);

-- 10. USER PROFILES & PERMISSIONS (Governance & Access Control)
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

create index if not exists idx_user_profiles_role_status on public.user_profiles(role, status);
create index if not exists idx_user_profiles_email on public.user_profiles(email);

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

-- Auto-bootstrap Owner: First created user in auth.users is bound as Owner
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

-- Callable function for client bootstrap:
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
    if active_owner_count = 0 and user_prof.status = 'active' then
      update public.user_profiles set role = 'owner', updated_at = now() where id = current_uid;
      return jsonb_build_object('success', true, 'role', 'owner', 'message', 'Promoted to Owner');
    end if;
    return jsonb_build_object('success', true, 'role', user_prof.role, 'status', user_prof.status);
  end if;

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

-- Protect Last Active Owner Trigger
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

-- Permission Check Engine
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

  if prof.role = 'owner' then
    return true;
  end if;

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

  if prof.role = 'admin' then
    if target_action = 'manage_access' then return false; end if;
    if target_module = 'audit' and target_action != 'view' then return false; end if;
    return true;
  end if;

  if prof.role = 'manager' then
    if target_module in ('access', 'audit') then return false; end if;
    if target_action in ('delete', 'manage_access') then return false; end if;
    return true;
  end if;

  if prof.role = 'member' then
    if target_module in ('access', 'audit', 'budget', 'calculator') then return false; end if;
    if target_action in ('create', 'edit', 'delete', 'export', 'approve', 'manage_access') then return false; end if;
    if target_action = 'view' and target_module in ('dashboard', 'work', 'pipeline', 'documents', 'knowledge', 'profile', 'notifications') then return true; end if;
    return false;
  end if;

  return false;
end;
$$;

-- 11. AUDIT LOGS, NOTIFICATIONS, REMINDERS & VENDOR ACTIVITIES
create table if not exists public.audit_logs (
  id text primary key default ('aud-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  actor_id uuid not null references auth.users(id),
  actor_name text not null default '',
  actor_email text not null default '',
  action text not null,
  module text not null,
  record_id text,
  record_title text,
  changes jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_module on public.audit_logs(module);
create index if not exists idx_audit_logs_record on public.audit_logs(record_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

create or replace function public.forbid_audit_modification()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Security Violation: Rivlet Audit Logs are strictly append-only and cannot be updated or deleted.';
end;
$$;

drop trigger if exists trg_audit_logs_immutable on public.audit_logs;
create trigger trg_audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function public.forbid_audit_modification();

revoke update, delete on public.audit_logs from authenticated, anon;

create table if not exists public.notifications (
  id text primary key default ('notif-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  module text not null,
  link text,
  is_read boolean not null default false,
  read_at timestamptz,
  priority text not null default 'normal',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);

create table if not exists public.reminders (
  id text primary key default ('rem-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  module text not null,
  record_id text,
  priority text not null default 'medium',
  status text not null default 'pending',
  snoozed_until timestamptz,
  completed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reminders_user_due on public.reminders(user_id, status, due_at asc);

create table if not exists public.vendor_activities (
  id text primary key default ('vact-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  vendor_id text not null references public.vendors(id) on delete cascade,
  contact_person text,
  channel text not null default 'Phone',
  touch_date date not null default current_date,
  outcome text not null,
  notes text,
  owner_id uuid references auth.users(id),
  owner_name text,
  next_action text,
  next_action_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendor_activities_vendor_date on public.vendor_activities(vendor_id, touch_date desc);

-- RPC for logging audit events
create or replace function public.log_audit_event(
  p_action text,
  p_module text,
  p_record_id text default null,
  p_record_title text default null,
  p_changes jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid;
  v_actor_name text;
  v_actor_email text;
  v_log_id text;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null then return null; end if;

  select coalesce(name, split_part(email, '@', 1), 'User'), email
  into v_actor_name, v_actor_email
  from public.user_profiles
  where id = v_actor_id;

  if v_actor_email is null then
    select coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'), email
    into v_actor_name, v_actor_email
    from auth.users
    where id = v_actor_id;
  end if;

  v_log_id := 'aud-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text;

  insert into public.audit_logs (
    id, actor_id, actor_name, actor_email, action, module, record_id, record_title, changes, metadata, created_at
  ) values (
    v_log_id, v_actor_id, coalesce(v_actor_name, 'Authenticated User'), coalesce(v_actor_email, ''),
    p_action, p_module, p_record_id, p_record_title, p_changes, p_metadata, now()
  );

  return v_log_id;
end;
$$;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES ON ALL TABLES
do $$
declare
  pol record;
  target_tables text[] := array[
    'artifacts', 'costing_sheets', 'documents', 'kb_articles',
    'vendors', 'pipeline_items', 'budget_items', 'budget_settings',
    'sprints', 'work_items', 'team_members', 'work_settings',
    'user_profiles', 'user_permissions', 'audit_logs', 'notifications',
    'reminders', 'vendor_activities'
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

  -- User Profiles
  if to_regclass('public.user_profiles') is not null then
    create policy "Read user profiles" on public.user_profiles for select using (id = auth.uid() or public.has_permission(auth.uid(), 'access', 'view'));
    create policy "Insert user profiles" on public.user_profiles for insert with check (id = auth.uid() or public.has_permission(auth.uid(), 'access', 'manage_access'));
    create policy "Update user profiles" on public.user_profiles for update using (id = auth.uid() or public.has_permission(auth.uid(), 'access', 'manage_access')) with check (id = auth.uid() or public.has_permission(auth.uid(), 'access', 'manage_access'));
    create policy "Delete user profiles" on public.user_profiles for delete using (public.has_permission(auth.uid(), 'access', 'manage_access'));
  end if;

  -- User Permissions
  if to_regclass('public.user_permissions') is not null then
    create policy "Read user permissions" on public.user_permissions for select using (user_id = auth.uid() or public.has_permission(auth.uid(), 'access', 'view'));
    create policy "Modify user permissions" on public.user_permissions for all using (public.has_permission(auth.uid(), 'access', 'manage_access')) with check (public.has_permission(auth.uid(), 'access', 'manage_access'));
  end if;

  -- Artifacts
  if to_regclass('public.artifacts') is not null then
    create policy "artifacts_select" on public.artifacts for select using (public.has_permission(auth.uid(), 'artifacts', 'view'));
    create policy "artifacts_insert" on public.artifacts for insert with check (public.has_permission(auth.uid(), 'artifacts', 'create'));
    create policy "artifacts_update" on public.artifacts for update using (public.has_permission(auth.uid(), 'artifacts', 'edit')) with check (public.has_permission(auth.uid(), 'artifacts', 'edit'));
    create policy "artifacts_delete" on public.artifacts for delete using (public.has_permission(auth.uid(), 'artifacts', 'delete'));
  end if;

  -- Costing Sheets
  if to_regclass('public.costing_sheets') is not null then
    create policy "costing_sheets_select" on public.costing_sheets for select using (public.has_permission(auth.uid(), 'calculator', 'view'));
    create policy "costing_sheets_insert" on public.costing_sheets for insert with check (public.has_permission(auth.uid(), 'calculator', 'create'));
    create policy "costing_sheets_update" on public.costing_sheets for update using (public.has_permission(auth.uid(), 'calculator', 'edit')) with check (public.has_permission(auth.uid(), 'calculator', 'edit'));
    create policy "costing_sheets_delete" on public.costing_sheets for delete using (public.has_permission(auth.uid(), 'calculator', 'delete'));
  end if;

  -- Documents
  if to_regclass('public.documents') is not null then
    create policy "documents_select" on public.documents for select using (public.has_permission(auth.uid(), 'documents', 'view'));
    create policy "documents_insert" on public.documents for insert with check (public.has_permission(auth.uid(), 'documents', 'create'));
    create policy "documents_update" on public.documents for update using (public.has_permission(auth.uid(), 'documents', 'edit')) with check (public.has_permission(auth.uid(), 'documents', 'edit'));
    create policy "documents_delete" on public.documents for delete using (public.has_permission(auth.uid(), 'documents', 'delete'));
  end if;

  -- KB Articles
  if to_regclass('public.kb_articles') is not null then
    create policy "kb_articles_select" on public.kb_articles for select using (public.has_permission(auth.uid(), 'knowledge', 'view'));
    create policy "kb_articles_insert" on public.kb_articles for insert with check (public.has_permission(auth.uid(), 'knowledge', 'create'));
    create policy "kb_articles_update" on public.kb_articles for update using (public.has_permission(auth.uid(), 'knowledge', 'edit')) with check (public.has_permission(auth.uid(), 'knowledge', 'edit'));
    create policy "kb_articles_delete" on public.kb_articles for delete using (public.has_permission(auth.uid(), 'knowledge', 'delete'));
  end if;

  -- Vendors
  if to_regclass('public.vendors') is not null then
    create policy "vendors_select" on public.vendors for select using (public.has_permission(auth.uid(), 'vendors', 'view'));
    create policy "vendors_insert" on public.vendors for insert with check (public.has_permission(auth.uid(), 'vendors', 'create'));
    create policy "vendors_update" on public.vendors for update using (public.has_permission(auth.uid(), 'vendors', 'edit')) with check (public.has_permission(auth.uid(), 'vendors', 'edit'));
    create policy "vendors_delete" on public.vendors for delete using (public.has_permission(auth.uid(), 'vendors', 'delete'));
  end if;

  -- Pipeline Items
  if to_regclass('public.pipeline_items') is not null then
    create policy "pipeline_items_select" on public.pipeline_items for select using (public.has_permission(auth.uid(), 'pipeline', 'view'));
    create policy "pipeline_items_insert" on public.pipeline_items for insert with check (public.has_permission(auth.uid(), 'pipeline', 'create'));
    create policy "pipeline_items_update" on public.pipeline_items for update using (public.has_permission(auth.uid(), 'pipeline', 'edit')) with check (public.has_permission(auth.uid(), 'pipeline', 'edit'));
    create policy "pipeline_items_delete" on public.pipeline_items for delete using (public.has_permission(auth.uid(), 'pipeline', 'delete'));
  end if;

  -- Budget Items & Settings
  if to_regclass('public.budget_items') is not null then
    create policy "budget_items_select" on public.budget_items for select using (public.has_permission(auth.uid(), 'budget', 'view'));
    create policy "budget_items_insert" on public.budget_items for insert with check (public.has_permission(auth.uid(), 'budget', 'create'));
    create policy "budget_items_update" on public.budget_items for update using (public.has_permission(auth.uid(), 'budget', 'edit')) with check (public.has_permission(auth.uid(), 'budget', 'edit'));
    create policy "budget_items_delete" on public.budget_items for delete using (public.has_permission(auth.uid(), 'budget', 'delete'));
  end if;

  if to_regclass('public.budget_settings') is not null then
    create policy "budget_settings_select" on public.budget_settings for select using (public.has_permission(auth.uid(), 'budget', 'view'));
    create policy "budget_settings_insert" on public.budget_settings for insert with check (public.has_permission(auth.uid(), 'budget', 'edit'));
    create policy "budget_settings_update" on public.budget_settings for update using (public.has_permission(auth.uid(), 'budget', 'edit')) with check (public.has_permission(auth.uid(), 'budget', 'edit'));
  end if;

  -- Sprints & Work Items
  if to_regclass('public.sprints') is not null then
    create policy "sprints_select" on public.sprints for select using (public.has_permission(auth.uid(), 'work', 'view'));
    create policy "sprints_insert" on public.sprints for insert with check (public.has_permission(auth.uid(), 'work', 'create'));
    create policy "sprints_update" on public.sprints for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));
    create policy "sprints_delete" on public.sprints for delete using (public.has_permission(auth.uid(), 'work', 'delete'));
  end if;

  if to_regclass('public.work_items') is not null then
    create policy "work_items_select" on public.work_items for select using (public.has_permission(auth.uid(), 'work', 'view'));
    create policy "work_items_insert" on public.work_items for insert with check (public.has_permission(auth.uid(), 'work', 'create'));
    create policy "work_items_update" on public.work_items for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));
    create policy "work_items_delete" on public.work_items for delete using (public.has_permission(auth.uid(), 'work', 'delete'));
  end if;

  -- Team Members & Settings
  if to_regclass('public.team_members') is not null then
    create policy "team_members_select" on public.team_members for select using (public.has_permission(auth.uid(), 'work', 'view'));
    create policy "team_members_insert" on public.team_members for insert with check (public.has_permission(auth.uid(), 'work', 'create'));
    create policy "team_members_update" on public.team_members for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));
    create policy "team_members_delete" on public.team_members for delete using (public.has_permission(auth.uid(), 'work', 'delete'));
  end if;

  if to_regclass('public.work_settings') is not null then
    create policy "work_settings_select" on public.work_settings for select using (public.has_permission(auth.uid(), 'work', 'view'));
    create policy "work_settings_insert" on public.work_settings for insert with check (public.has_permission(auth.uid(), 'work', 'edit'));
    create policy "work_settings_update" on public.work_settings for update using (public.has_permission(auth.uid(), 'work', 'edit')) with check (public.has_permission(auth.uid(), 'work', 'edit'));
  end if;

  -- Audit Logs (Append-Only)
  if to_regclass('public.audit_logs') is not null then
    create policy "audit_logs_select" on public.audit_logs for select using (public.has_permission(auth.uid(), 'audit', 'view'));
    create policy "audit_logs_insert" on public.audit_logs for insert with check (auth.uid() is not null and actor_id = auth.uid());
  end if;

  -- Notifications
  if to_regclass('public.notifications') is not null then
    create policy "notifications_select" on public.notifications for select using (user_id = auth.uid());
    create policy "notifications_insert" on public.notifications for insert with check (auth.uid() is not null);
    create policy "notifications_update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
    create policy "notifications_delete" on public.notifications for delete using (user_id = auth.uid());
  end if;

  -- Reminders
  if to_regclass('public.reminders') is not null then
    create policy "reminders_select" on public.reminders for select using (user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'view'));
    create policy "reminders_insert" on public.reminders for insert with check (auth.uid() is not null);
    create policy "reminders_update" on public.reminders for update using (user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'edit')) with check (user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'edit'));
    create policy "reminders_delete" on public.reminders for delete using (user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'delete'));
  end if;

  -- Vendor Activities
  if to_regclass('public.vendor_activities') is not null then
    create policy "vendor_activities_select" on public.vendor_activities for select using (public.has_permission(auth.uid(), 'vendors', 'view'));
    create policy "vendor_activities_insert" on public.vendor_activities for insert with check (public.has_permission(auth.uid(), 'vendors', 'edit'));
    create policy "vendor_activities_update" on public.vendor_activities for update using (public.has_permission(auth.uid(), 'vendors', 'edit')) with check (public.has_permission(auth.uid(), 'vendors', 'edit'));
    create policy "vendor_activities_delete" on public.vendor_activities for delete using (public.has_permission(auth.uid(), 'vendors', 'delete'));
  end if;
end $$;

-- 13. STORAGE BUCKET & RLS FOR VAULT FILES
insert into storage.buckets (id, name, public) 
values ('vault-files', 'vault-files', false)
on conflict (id) do update set public = false;

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

    create policy "vault_files_select" on storage.objects
      for select using (bucket_id = 'vault-files' and public.has_permission(auth.uid(), 'documents', 'view'));

    create policy "vault_files_insert" on storage.objects
      for insert with check (bucket_id = 'vault-files' and public.has_permission(auth.uid(), 'documents', 'create'));

    create policy "vault_files_delete" on storage.objects
      for delete using (bucket_id = 'vault-files' and public.has_permission(auth.uid(), 'documents', 'delete'));
  end if;
end $$;

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
select table_name 
from information_schema.tables 
where table_schema = 'public' 
order by table_name;
