/**
 * Client-to-Server Sync Utilities
 *
 * Direct Supabase anon client calls are subject to Postgres Row-Level Security (RLS).
 * When RLS policies disallow anonymous DELETE or INSERT, PostgREST returns 200/204 with 0 affected rows,
 * leading to phantom "resurrections" upon page reload.
 *
 * These utilities route write and delete operations through the Next.js server route `/api/sync`,
 * which uses the privileged `supabaseAdmin` (Service Role Key) to guarantee persistence and deletion.
 */

export async function syncDeleteFromServer(table: string, id: string): Promise<boolean> {
  if (typeof window === 'undefined' || !id) return false;

  try {
    const res = await fetch('/api/sync', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });

    if (!res.ok) {
      console.warn(`Sync delete server responded with status ${res.status} for ${table}:${id}`);
      return false;
    }

    const data = await res.json();
    return Boolean(data?.success);
  } catch (err) {
    console.warn(`Sync delete network failure for ${table}:${id}:`, err);
    return false;
  }
}

export async function syncUpsertToServer(table: string, data: any): Promise<boolean> {
  if (typeof window === 'undefined' || !data) return false;

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, action: 'upsert', data }),
    });

    if (!res.ok) {
      console.warn(`Sync upsert server responded with status ${res.status} for ${table}`);
      return false;
    }

    const resData = await res.json();
    return Boolean(resData?.success);
  } catch (err) {
    console.warn(`Sync upsert network failure for ${table}:`, err);
    return false;
  }
}

export async function syncUpdateToServer(table: string, id: string, data: any): Promise<boolean> {
  if (typeof window === 'undefined' || !id || !data) return false;

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, action: 'update', id, data }),
    });

    if (!res.ok) {
      console.warn(`Sync update server responded with status ${res.status} for ${table}:${id}`);
      return false;
    }

    const resData = await res.json();
    return Boolean(resData?.success);
  } catch (err) {
    console.warn(`Sync update network failure for ${table}:${id}:`, err);
    return false;
  }
}
