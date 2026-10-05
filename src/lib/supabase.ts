import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project')
);

// Fallback gracefully if Supabase env credentials are not yet entered
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const VAULT_BUCKET = 'vault-files';

/**
 * Storage RLS is locked to authenticated sessions only (see supabase_migration_v2/v3),
 * so the plain public URL returned by getPublicUrl() at upload time no longer resolves  - 
 * <img>/<object>/fetch() requests to it carry no auth token and get rejected. Resolve a
 * short-lived signed URL instead whenever a stored file actually needs to be displayed.
 * Non-Supabase URLs (local blob: fallback, external links) are returned unchanged.
 */
export async function resolveDocumentUrl(fileUrl: string): Promise<string> {
  if (!fileUrl || fileUrl === '#' || !supabase) return fileUrl;

  const marker = `/storage/v1/object/public/${VAULT_BUCKET}/`;
  const markerIdx = fileUrl.indexOf(marker);
  if (markerIdx === -1) return fileUrl; // not a vault-files public URL (blob:, external, etc.)

  const path = decodeURIComponent(fileUrl.slice(markerIdx + marker.length).split('?')[0]);

  try {
    const { data, error } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return fileUrl;
    return data.signedUrl;
  } catch {
    return fileUrl;
  }
}
