import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isServiceRoleConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  !serviceRoleKey.includes('your-service-role')
);

/**
 * Server-only privileged Supabase Client.
 * Uses the Service Role Key to perform administrative Auth operations
 * (such as inviting users, listing profiles, bypass RLS for admin maintenance).
 * Never expose this client or its key to the browser.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  isServiceRoleConfigured ? serviceRoleKey : anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Validates the caller's JWT Bearer token and returns the authenticated user object.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { user: null, error: 'Missing authorization token' };
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid or expired session token' };
    }
    return { user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Authentication failed' };
  }
}
