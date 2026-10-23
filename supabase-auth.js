import {recoverAuthSession} from './auth-session-core.js';
import {
  SUPABASE_PUBLIC_ENABLED,
  SUPABASE_PUBLIC_KEY,
  SUPABASE_URL
} from './supabase-public.js';

// Keep optional account code out of the initial download in local-only builds.
const {createClient}=SUPABASE_PUBLIC_ENABLED?await import('./supabase-sdk.js'):{createClient:null};

export const AUTH_STORAGE_KEY = 'tasteprint.auth.v1';

// Exactly one Auth-enabled Supabase client is shared across Passport sync, Campaign
// Workspace and authenticated publishing. This avoids competing GoTrue clients racing
// over the same refresh token/localStorage key when several modules are loaded together.
export const supabaseAuthClient = SUPABASE_PUBLIC_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY
      }
    })
  : null;

export async function currentSupabaseSession() {
  if (!supabaseAuthClient) return null;
  try {
    return await recoverAuthSession(supabaseAuthClient.auth);
  } catch {
    return null;
  }
}

export async function currentSupabaseUser() {
  const session = await currentSupabaseSession();
  return session?.user || null;
}
