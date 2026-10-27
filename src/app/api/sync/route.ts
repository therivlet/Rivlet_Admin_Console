import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ALLOWED_TABLES = [
  'vendors',
  'pipeline_items',
  'budget_items',
  'budget_settings',
  'sprints',
  'work_items',
  'artifacts',
  'costing_sheets',
  'documents',
  'kb_articles',
  'team_members',
  'work_settings',
  'compliance_workflows',
  'calendar_events',
  'credential_vault',
  'customs_declarations',
  'dsc_registry',
  'gst_reconciliation_invoices',
  'gst_settings',
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedTables = searchParams.get('tables')?.split(',').map((t) => t.trim()).filter(Boolean);

    const tablesToFetch = requestedTables && requestedTables.length > 0
      ? requestedTables.filter((t) => ALLOWED_TABLES.includes(t))
      : [
          'vendors', 'pipeline_items', 'budget_items', 'budget_settings',
          'sprints', 'work_items', 'artifacts', 'costing_sheets',
          'documents', 'kb_articles', 'team_members', 'work_settings',
          'compliance_workflows', 'calendar_events', 'credential_vault'
        ];

    const results: Record<string, any[]> = {};

    await Promise.all(
      tablesToFetch.map(async (table) => {
        try {
          const query = supabaseAdmin.from(table).select('*');
          let orderedQuery = query;

          if (table === 'compliance_workflows' || table === 'calendar_events') {
            orderedQuery = query.order('created_at', { ascending: false });
          } else if (table !== 'work_settings' && table !== 'budget_settings' && table !== 'gst_settings') {
            orderedQuery = query.order('created_at', { ascending: false });
          }

          const { data, error } = await orderedQuery;
          if (!error && data) {
            results[table] = data;
          } else {
            results[table] = [];
          }
        } catch {
          results[table] = [];
        }
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to sync data' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { table, id } = body;

    if (!table || !id) {
      return NextResponse.json(
        { success: false, error: 'Parameters "table" and "id" are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { success: false, error: `Table "${table}" is not permitted for deletion` },
        { status: 403 }
      );
    }

    const { error, count } = await supabaseAdmin
      .from(table)
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error(`[API /sync DELETE] Error deleting from ${table}:`, error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count, table, id });
  } catch (err: any) {
    console.error('[API /sync DELETE] Exception:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error during delete' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { table, action = 'upsert', data, id } = body;

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Parameter "table" is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { success: false, error: `Table "${table}" is not permitted` },
        { status: 403 }
      );
    }

    if (action === 'delete') {
      const targetId = id || data?.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'id required for delete' }, { status: 400 });
      }
      const { error, count } = await supabaseAdmin.from(table).delete({ count: 'exact' }).eq('id', targetId);
      if (error) throw error;
      return NextResponse.json({ success: true, count });
    }

    if (action === 'update' && id) {
      const { error, data: updatedData } = await supabaseAdmin
        .from(table)
        .update(data)
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data: updatedData });
    }

    // Default: upsert
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Parameter "data" is required for upsert' },
        { status: 400 }
      );
    }

    const { error, data: upsertedData } = await supabaseAdmin
      .from(table)
      .upsert(data)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data: upsertedData });
  } catch (err: any) {
    console.error('[API /sync POST] Exception:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error during sync' },
      { status: 500 }
    );
  }
}
