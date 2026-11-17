import { pathToFileURL } from 'node:url';

export function validateDeploymentConfig(env) {
  const url = env.VITE_SUPABASE_URL ?? '';
  const keys = [env.VITE_SUPABASE_PUBLISHABLE_KEY, env.VITE_SUPABASE_ANON_KEY].filter(Boolean);
  if (!url && !keys.length) return 'local-only';
  if (!url || !keys.length) throw new Error('Configure both a Supabase URL and a public client key.');

  let endpoint;
  try {
    endpoint = new URL(url);
  } catch {
    throw new Error('The Supabase URL is invalid.');
  }
  if (url !== url.trim() || endpoint.protocol !== 'https:' || endpoint.username || endpoint.password
      || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) {
    throw new Error('Use the HTTPS Supabase project origin with no path or credentials.');
  }

  if (!keys.every(isPublicKey)) throw new Error('Use a Supabase publishable key or legacy anon key.');
  return 'backend-enabled';
}

function isPublicKey(key) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(key)) return false;
  try {
    return JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon';
  } catch {
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(`Tasteprint deployment mode: ${validateDeploymentConfig(process.env)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
