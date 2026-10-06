import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getAuthenticatedUser, isServiceRoleConfigured } from '@/lib/supabaseServer';
import { AppRole, AppModule, ModulePermissionSet, UserPermissionMap } from '@/lib/types';
import { getRoleTemplateDefaults } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const { user: caller, error: authError } = await getAuthenticatedUser(request);
  if (authError || !caller) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Verify caller has view access on 'access' module or is owner
    const { data: callerProfile, error: profErr } = await supabaseAdmin
      .from('user_profiles')
      .select('role, status')
      .eq('id', caller.id)
      .single();

    if (profErr || !callerProfile || callerProfile.status !== 'active') {
      return NextResponse.json({ error: 'Access denied: Active user profile required' }, { status: 403 });
    }

    if (callerProfile.role !== 'owner' && callerProfile.role !== 'admin') {
      // Check explicit permission
      const { data: perm } = await supabaseAdmin
        .from('user_permissions')
        .select('can_view')
        .eq('user_id', caller.id)
        .eq('module', 'access')
        .single();

      if (!perm?.can_view) {
        return NextResponse.json({ error: 'Access denied: Requires permission to view access management' }, { status: 403 });
      }
    }

    // 2. Fetch all user profiles
    const { data: profiles, error: listErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    // 3. Fetch all custom permissions overrides
    const { data: allPermissions, error: permErr } = await supabaseAdmin
      .from('user_permissions')
      .select('*');

    if (permErr) {
      return NextResponse.json({ error: permErr.message }, { status: 500 });
    }

    // Group permissions by user_id
    const permissionsByUser: Record<string, Partial<Record<AppModule, ModulePermissionSet>>> = {};
    (allPermissions || []).forEach((p: any) => {
      if (!permissionsByUser[p.user_id]) {
        permissionsByUser[p.user_id] = {};
      }
      const mod = p.module as AppModule;
      permissionsByUser[p.user_id][mod] = {
        view: Boolean(p.can_view),
        create: Boolean(p.can_create),
        edit: Boolean(p.can_edit),
        delete: Boolean(p.can_delete),
        export: Boolean(p.can_export),
        approve: Boolean(p.can_approve),
        manage_access: Boolean(p.can_manage_access),
      };
    });

    // Merge into complete response
    const usersWithPermissions = (profiles || []).map((prof: any) => ({
      id: prof.id,
      email: prof.email,
      name: prof.name,
      role: prof.role as AppRole,
      status: prof.status,
      invitedBy: prof.invited_by,
      invitedAt: prof.invited_at,
      lastActiveAt: prof.last_active_at,
      createdAt: prof.created_at,
      updatedAt: prof.updated_at,
      permissions: permissionsByUser[prof.id] || {},
    }));

    return NextResponse.json({ success: true, users: usersWithPermissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user: caller, error: authError } = await getAuthenticatedUser(request);
  if (authError || !caller) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Verify caller has manage_access on 'access' module or is owner
    const { data: callerProfile, error: profErr } = await supabaseAdmin
      .from('user_profiles')
      .select('role, status, name, email')
      .eq('id', caller.id)
      .single();

    if (profErr || !callerProfile || callerProfile.status !== 'active') {
      return NextResponse.json({ error: 'Access denied: Active user profile required' }, { status: 403 });
    }

    if (callerProfile.role !== 'owner') {
      const { data: perm } = await supabaseAdmin
        .from('user_permissions')
        .select('can_manage_access')
        .eq('user_id', caller.id)
        .eq('module', 'access')
        .single();

      if (!perm?.can_manage_access) {
        return NextResponse.json({ error: 'Access denied: Only Owner or delegated admins can invite users' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { email, name, role = 'member', permissions } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Target role cannot be elevated to 'owner' via invitation
    if (role === 'owner' && callerProfile.role !== 'owner') {
      return NextResponse.json({ error: 'Only an Owner can designate another Owner' }, { status: 403 });
    }

    let targetUserId: string | null = null;

    if (!isServiceRoleConfigured) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY is required in .env.local to send invitation emails via Supabase Auth. Please copy your service_role secret from Supabase Dashboard -> Project Settings -> API into .env.local.',
      }, { status: 503 });
    }

    // 2. Send invitation email via Supabase Auth Admin
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      {
        data: {
          full_name: (name || '').trim(),
        },
      }
    );

    if (inviteErr) {
      // If user already exists in auth.users, fetch their ID
      if (inviteErr.message.toLowerCase().includes('already been registered') || inviteErr.message.toLowerCase().includes('already exists')) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
        if (found) {
          targetUserId = found.id;
        } else {
          return NextResponse.json({ error: inviteErr.message }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: inviteErr.message }, { status: 400 });
      }
    } else if (inviteData?.user) {
      targetUserId = inviteData.user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Failed to obtain user identity for invitation' }, { status: 500 });
    }

    // 3. Insert or update user profile
    const now = new Date().toISOString();
    const { data: createdProfile, error: createProfErr } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: targetUserId,
        email: email.trim().toLowerCase(),
        name: (name || '').trim() || email.split('@')[0],
        role,
        status: 'active',
        invited_by: caller.id,
        invited_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (createProfErr) {
      return NextResponse.json({ error: createProfErr.message }, { status: 500 });
    }

    // 4. If custom permission overrides were provided, upsert them
    if (permissions && typeof permissions === 'object') {
      const permInserts = Object.entries(permissions).map(([module, p]: [string, any]) => ({
        user_id: targetUserId,
        module,
        can_view: Boolean(p.canView),
        can_create: Boolean(p.canCreate),
        can_edit: Boolean(p.canEdit),
        can_delete: Boolean(p.canDelete),
        can_export: Boolean(p.canExport),
        can_approve: Boolean(p.canApprove),
        can_manage_access: Boolean(p.canManageAccess),
        updated_at: now,
      }));

      if (permInserts.length > 0) {
        await supabaseAdmin.from('user_permissions').upsert(permInserts, { onConflict: 'user_id,module' });
      }
    }

    // 5. Append Audit Log Entry
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: caller.id,
        actor_name: callerProfile.name || 'Admin',
        actor_email: callerProfile.email || caller.email || '',
        action: 'invite',
        module: 'access',
        record_id: targetUserId,
        record_title: email,
        changes: {
          email,
          role,
          name,
        },
        metadata: {
          source: 'access_management_console',
        },
      });
    } catch (auditErr) {
      console.error('Failed to append audit log for invite:', auditErr);
    }

    return NextResponse.json({
      success: true,
      user: createdProfile,
      message: `Invitation successfully sent to ${email}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
