import {lazyAuthClient} from './lazy-auth-client.js';
import {watchAuthReturns} from './auth-return-core.js';
import {recoverAuthSession} from './auth-session-core.js';
import {
  SUPABASE_PUBLIC_ENABLED,
  SUPABASE_PUBLIC_KEY,
  SUPABASE_URL
} from './supabase-public.js';

// Capture and remove only failed returns before the SDK examines the URL. A
// reused/expired link must not hide its error or overwrite an existing session.
export let AUTH_RETURN_FAILED=false;
if(SUPABASE_PUBLIC_ENABLED)watchAuthReturns({
 href:()=>location.href,
 replace:value=>history.replaceState(history.state,'',value),
 reload:()=>location.reload(),
 notify:()=>{AUTH_RETURN_FAILED=true;window.dispatchEvent(new CustomEvent('tasteprint:auth-return-error'));},
 listen:handler=>window.addEventListener('hashchange',handler)
});

export const AUTH_STORAGE_KEY = 'tasteprint.auth.v1';

// Exactly one Auth-enabled Supabase client is shared across Passport sync, Campaign
// Workspace and authenticated publishing. This avoids competing GoTrue clients racing
// over the same refresh token/localStorage key when several modules are loaded together.
export const supabaseAuthClient = SUPABASE_PUBLIC_ENABLED
  ? lazyAuthClient({loadSdk:()=>import('./supabase-sdk.js'),create:({createClient})=>createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY
      }
    })})
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
