import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer';
import { AppRole, AppModule, ModulePermissionSet } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
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
        return NextResponse.json({ error: 'Access denied: Only Owner or delegated admins can modify access' }, { status: 403 });
      }
    }

    // 2. Fetch target user's current profile
    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: 'Target user profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { role, status, name, permissions } = body;

    // 3. Last Owner Protection: If demoting or deactivating an owner, ensure another active owner exists
    if (targetProfile.role === 'owner' && (role && role !== 'owner' || status === 'deactivated')) {
      const { count: activeOwnerCount } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'owner')
        .eq('status', 'active')
        .neq('id', targetUserId);

      if (!activeOwnerCount || activeOwnerCount < 1) {
        return NextResponse.json({
          error: 'Security Protection: Cannot demote or deactivate the last active Owner account.',
        }, { status: 400 });
      }
    }

    // Only an owner can assign the 'owner' role to someone else
    if (role === 'owner' && callerProfile.role !== 'owner') {
      return NextResponse.json({ error: 'Only an Owner can designate another user as Owner' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const profileUpdates: any = { updated_at: now };
    if (role !== undefined) profileUpdates.role = role;
    if (status !== undefined) profileUpdates.status = status;
    if (name !== undefined) profileUpdates.name = name;

    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 4. Update permission overrides if provided
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

    // 5. Append Audit Log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: caller.id,
        actor_name: callerProfile.name || 'Admin',
        actor_email: callerProfile.email || caller.email || '',
        action: 'permission_change',
        module: 'access',
        record_id: targetUserId,
        record_title: targetProfile.email,
        changes: {
          before: {
            role: targetProfile.role,
            status: targetProfile.status,
          },
          after: {
            role: updatedProfile.role,
            status: updatedProfile.status,
            permissionsUpdated: Boolean(permissions),
          },
        },
        metadata: {
          source: 'access_management_console',
        },
      });
    } catch (auditErr) {
      console.error('Failed to log audit event:', auditErr);
    }

    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: 'User permissions and status updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const { user: caller, error: authError } = await getAuthenticatedUser(request);
  if (authError || !caller) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, status, name, email')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'owner') {
      return NextResponse.json({ error: 'Access denied: Only an Owner can delete user accounts' }, { status: 403 });
    }

    const { data: targetProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect last owner
    if (targetProfile.role === 'owner') {
      const { count: activeOwnerCount } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'owner')
        .eq('status', 'active')
        .neq('id', targetUserId);

      if (!activeOwnerCount || activeOwnerCount < 1) {
        return NextResponse.json({
          error: 'Security Protection: Cannot delete the last active Owner account.',
        }, { status: 400 });
      }
    }

    // Delete from auth.users via admin if supported
    try {
      await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    } catch (authDeleteErr) {
      console.warn('Could not delete from auth.users (may require service role):', authDeleteErr);
    }

    // Delete from user_profiles (cascades to user_permissions)
    const { error: delErr } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', targetUserId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Append Audit Log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: caller.id,
        actor_name: callerProfile.name || 'Owner',
        actor_email: callerProfile.email || caller.email || '',
        action: 'delete',
        module: 'access',
        record_id: targetUserId,
        record_title: targetProfile.email,
        changes: {
          deletedUser: {
            email: targetProfile.email,
            role: targetProfile.role,
          },
        },
        metadata: {
          source: 'access_management_console',
        },
      });
    } catch (auditErr) {
      console.error('Failed to log audit event:', auditErr);
    }

    return NextResponse.json({ success: true, message: 'User account removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
