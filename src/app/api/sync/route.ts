import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedTables = searchParams.get('tables')?.split(',').map((t) => t.trim()).filter(Boolean);

    const tablesToFetch = requestedTables && requestedTables.length > 0
      ? requestedTables
      : [
          'vendors', 'pipeline_items', 'budget_items', 'budget_settings',
          'sprints', 'work_items', 'artifacts', 'costing_sheets',
          'documents', 'kb_articles', 'team_members', 'work_settings'
        ];

    const results: Record<string, any[]> = {};

    await Promise.all(
      tablesToFetch.map(async (table) => {
        try {
          const query = supabaseAdmin.from(table).select('*');
          const orderedQuery = (table === 'work_settings' || table === 'budget_settings')
            ? query
            : query.order('created_at', { ascending: false });

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
