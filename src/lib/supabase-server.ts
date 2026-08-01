import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client backed by the SERVICE ROLE key.
// This key MUST stay server-side (never NEXT_PUBLIC_*). It bypasses RLS,
// so it is only used inside authenticated API route handlers.
// Falls back to the anon client so existing deployments keep working until
// SUPABASE_SERVICE_ROLE_KEY is configured.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseUrl.startsWith('https://'));
};

export const serverSupabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || anonKey || 'placeholder'
);
