import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getAuthenticatedUser } from '@/lib/supabaseServer';

// Sensitive keys to always redact from audit before/after values
const REDACTED_KEYS = new Set([
  'password', 'token', 'access_token', 'refresh_token',
  'secret', 'service_role', 'service_key', 'apikey', 'auth_token'
]);

function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (REDACTED_KEYS.has(key.toLowerCase()) || key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = redactSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export async function GET(request: NextRequest) {
  const { user: caller, error: authError } = await getAuthenticatedUser(request);
  if (authError || !caller) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Verify caller has view access on 'audit' module or is owner
    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, status')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.status !== 'active') {
      return NextResponse.json({ error: 'Access denied: Active user profile required' }, { status: 403 });
    }

    if (callerProfile.role !== 'owner') {
      const { data: perm } = await supabaseAdmin
        .from('user_permissions')
        .select('can_view')
        .eq('user_id', caller.id)
        .eq('module', 'audit')
        .single();

      if (!perm?.can_view) {
        return NextResponse.json({ error: 'Access denied: Requires permission to view audit history' }, { status: 403 });
      }
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const module = searchParams.get('module');
    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const recordId = searchParams.get('recordId');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (module && module !== 'all') {
      query = query.eq('module', module);
    }
    if (action && action !== 'all') {
      query = query.eq('action', action);
    }
    if (actorId) {
      query = query.eq('actor_id', actorId);
    }
    if (recordId) {
      query = query.eq('record_id', recordId);
    }

    const { data: logs, count, error: queryErr } = await query;

    if (queryErr) {
      return NextResponse.json({ error: queryErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: (logs || []).map((l: any) => ({
        id: l.id,
        actorId: l.actor_id,
        actorName: l.actor_name,
        actorEmail: l.actor_email,
        action: l.action,
        module: l.module,
        recordId: l.record_id,
        recordTitle: l.record_title,
        changes: l.changes,
        metadata: l.metadata,
        createdAt: l.created_at,
      })),
      totalCount: count || 0,
      limit,
      offset,
    });
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
    const { data: callerProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('name, email, role, status')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.status !== 'active') {
      return NextResponse.json({ error: 'Access denied: Active user profile required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, module, recordId, recordTitle, changes, metadata } = body;

    if (!action || !module) {
      return NextResponse.json({ error: 'Action and module are required for audit logging' }, { status: 400 });
    }

    const logId = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const safeChanges = redactSensitiveData(changes || {});
    const safeMetadata = redactSensitiveData({
      ...(metadata || {}),
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const { error: insertErr } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        id: logId,
        actor_id: caller.id, // Strictly derived from verified session token
        actor_name: callerProfile.name || 'User',
        actor_email: callerProfile.email || caller.email || '',
        action,
        module,
        record_id: recordId || null,
        record_title: recordTitle || null,
        changes: safeChanges,
        metadata: safeMetadata,
        created_at: new Date().toISOString(),
      });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: logId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
