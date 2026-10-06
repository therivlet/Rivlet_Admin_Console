-- ================================================================
-- RIVLET ADMIN PLATFORM: MIGRATION V13 — DURABLE AUDIT LOGS, NOTIFICATIONS & ACTIVITIES
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
--
-- This migration establishes:
-- 1. public.audit_logs: Immutable, append-only security & business event trail
-- 2. Trigger revoking UPDATE and DELETE on audit_logs
-- 3. public.notifications: Persistent notification center and read tracking
-- 4. public.reminders: Durable scheduled follow-ups and milestone alerts
-- 5. public.vendor_activities: Structured timeline for vendor relationship management
-- 6. RPC: public.log_audit_event(...) for trusted server/client activity attribution
-- ================================================================

-- 1. AUDIT LOGS TABLE (Append-Only)
create table if not exists public.audit_logs (
  id text primary key default ('aud-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  actor_id uuid not null references auth.users(id),
  actor_name text not null default '',
  actor_email text not null default '',
  action text not null, -- 'create', 'update', 'delete', 'approve', 'invite', 'permission_change', 'export', 'stage_transition', 'login'
  module text not null, -- 'vendors', 'pipeline', 'calculator', 'budget', 'documents', 'work', 'knowledge', 'artifacts', 'access', 'profile'
  record_id text,
  record_title text,
  changes jsonb default '{}'::jsonb, -- minimal redacted diff
  metadata jsonb default '{}'::jsonb, -- user agent, IP or context
  created_at timestamptz not null default now()
);

-- Fast indexes for audit filtering
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_module on public.audit_logs(module);
create index if not exists idx_audit_logs_record on public.audit_logs(record_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- IMMUTABILITY ENFORCEMENT TRIGGER (Strictly forbids UPDATE and DELETE)
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

-- Revoke update and delete privileges from authenticated and anon
revoke update, delete on public.audit_logs from authenticated, anon;

-- 2. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id text primary key default ('notif-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info', -- 'info', 'warning', 'success', 'reminder', 'approval', 'security'
  module text not null,
  link text,
  is_read boolean not null default false,
  read_at timestamptz,
  priority text not null default 'normal', -- 'low', 'normal', 'high', 'urgent'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);

-- 3. REMINDERS TABLE
create table if not exists public.reminders (
  id text primary key default ('rem-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  module text not null,
  record_id text,
  priority text not null default 'medium', -- 'low', 'medium', 'high', 'urgent'
  status text not null default 'pending', -- 'pending', 'completed', 'snoozed', 'dismissed'
  snoozed_until timestamptz,
  completed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reminders_user_due on public.reminders(user_id, status, due_at asc);

-- 4. VENDOR ACTIVITIES TABLE (Structured Relationship Timeline)
create table if not exists public.vendor_activities (
  id text primary key default ('vact-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::text),
  vendor_id text not null references public.vendors(id) on delete cascade,
  contact_person text,
  channel text not null default 'Phone', -- 'Phone', 'Email', 'WhatsApp', 'Visit', 'Video Call', 'Factory Audit'
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

-- 5. RPC: SECURE AUDIT EVENT LOGGER
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
  if v_actor_id is null then
    return null;
  end if;

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

-- 6. ROW LEVEL SECURITY POLICIES
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.reminders enable row level security;
alter table public.vendor_activities enable row level security;

-- Drop legacy policies
do $$
declare
  pol record;
  target_tables text[] := array['audit_logs', 'notifications', 'reminders', 'vendor_activities'];
  t text;
begin
  foreach t in array target_tables loop
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
  end loop;
end $$;

-- audit_logs policies:
-- Reading audit logs requires view permission on 'audit' (Owner or granted Admin)
create policy "audit_logs_select" on public.audit_logs
  for select using (
    public.has_permission(auth.uid(), 'audit', 'view')
  );

-- Inserting is permitted for current authenticated user recording their own operation
create policy "audit_logs_insert" on public.audit_logs
  for insert with check (
    auth.uid() is not null and actor_id = auth.uid()
  );

-- notifications policies:
create policy "notifications_select" on public.notifications
  for select using (
    user_id = auth.uid()
  );

create policy "notifications_insert" on public.notifications
  for insert with check (
    auth.uid() is not null
  );

create policy "notifications_update" on public.notifications
  for update using (
    user_id = auth.uid()
  ) with check (
    user_id = auth.uid()
  );

create policy "notifications_delete" on public.notifications
  for delete using (
    user_id = auth.uid()
  );

-- reminders policies:
create policy "reminders_select" on public.reminders
  for select using (
    user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'view')
  );

create policy "reminders_insert" on public.reminders
  for insert with check (
    auth.uid() is not null
  );

create policy "reminders_update" on public.reminders
  for update using (
    user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'edit')
  ) with check (
    user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'edit')
  );

create policy "reminders_delete" on public.reminders
  for delete using (
    user_id = auth.uid() or public.has_permission(auth.uid(), 'notifications', 'delete')
  );

-- vendor_activities policies:
create policy "vendor_activities_select" on public.vendor_activities
  for select using (
    public.has_permission(auth.uid(), 'vendors', 'view')
  );

create policy "vendor_activities_insert" on public.vendor_activities
  for insert with check (
    public.has_permission(auth.uid(), 'vendors', 'edit')
  );

create policy "vendor_activities_update" on public.vendor_activities
  for update using (
    public.has_permission(auth.uid(), 'vendors', 'edit')
  ) with check (
    public.has_permission(auth.uid(), 'vendors', 'edit')
  );

create policy "vendor_activities_delete" on public.vendor_activities
  for delete using (
    public.has_permission(auth.uid(), 'vendors', 'delete')
  );

-- ----------------------------------------------------------------
-- Verification query
-- ----------------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('audit_logs', 'notifications', 'reminders', 'vendor_activities')
order by tablename, cmd;
