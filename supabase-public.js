const env = import.meta.env || {};

export const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
export const SUPABASE_PUBLIC_KEY = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '');
export const SUPABASE_PUBLIC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);
export const SUPABASE_KEY_KIND = SUPABASE_PUBLIC_KEY.startsWith('sb_publishable_') ? 'publishable' : SUPABASE_PUBLIC_KEY ? 'legacy-public' : 'none';

export function supabasePublicHeaders(extra = {}) {
  const headers = {
    apikey: SUPABASE_PUBLIC_KEY,
    'Content-Type': 'application/json',
    ...extra
  };

  // Legacy anon keys are JWTs. Current publishable keys are API keys, not user JWTs,
  // and should not be copied into the Authorization bearer slot.
  if (SUPABASE_PUBLIC_KEY && SUPABASE_KEY_KIND === 'legacy-public') {
    headers.Authorization = `Bearer ${SUPABASE_PUBLIC_KEY}`;
  }
  return headers;
}

export function supabasePublicURL(path = '') {
  const clean = String(path || '').replace(/^\/+/, '');
  return SUPABASE_URL ? `${SUPABASE_URL}/${clean}` : '';
}
