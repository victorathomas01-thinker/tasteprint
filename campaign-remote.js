import { currentSupabaseSession } from './supabase-auth.js';
import {
  SUPABASE_PUBLIC_ENABLED,
  SUPABASE_PUBLIC_KEY,
  supabasePublicHeaders,
  supabasePublicURL
} from './supabase-public.js';

export const REMOTE_CAMPAIGNS_ENABLED = SUPABASE_PUBLIC_ENABLED;
export const AUTHENTICATED_PUBLISHING = REMOTE_CAMPAIGNS_ENABLED;

async function rpc(name, body) {
  if (!REMOTE_CAMPAIGNS_ENABLED) return null;
  try {
    const response = await fetch(supabasePublicURL(`rest/v1/rpc/${name}`), {
      method: 'POST',
      headers: supabasePublicHeaders(),
      body: JSON.stringify(body || {})
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchPublishedCampaign(id) {
  const key = String(id || '').trim().toLowerCase();
  if (!key) return null;
  const result = await rpc('tasteprint_public_campaign', { p_campaign_id: key });
  return result && typeof result === 'object' && result.id ? result : null;
}

export async function fetchPublishedCampaignIndex() {
  const result = await rpc('tasteprint_public_campaign_index', {});
  return Array.isArray(result) ? result : [];
}

function workspaceId() {
  try {
    const value = new URL(location.href).searchParams.get('workspace') || '';
    return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value) ? value : '';
  } catch {
    return '';
  }
}

async function publishAction(action, payload) {
  if (!REMOTE_CAMPAIGNS_ENABLED) {
    return { ok: false, error: 'Supabase is not configured for this build.' };
  }

  const team = workspaceId();
  if (!team) {
    return { ok: false, error: 'Open Campaign Studio from an authenticated Workspace before publishing.' };
  }

  const session = await currentSupabaseSession();
  if (!session?.access_token) {
    return { ok: false, error: 'Sign in to Campaign Workspace before publishing.' };
  }

  try {
    const response = await fetch(supabasePublicURL('functions/v1/publish-campaign'), {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLIC_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, workspace_id: team, ...payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || `Publish request failed (${response.status}).` };
    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not reach the publish function.' };
  }
}

// publishToken is retained as an ignored compatibility argument so old Studio code does
// not break. Secrets are no longer accepted from the browser. Publishing authorization
// comes from the signed-in user's JWT plus server-side workspace membership.
export function publishCampaign(manifest, _publishToken = '') {
  return publishAction('publish', { manifest });
}

export function unpublishCampaign(campaignId, _publishToken = '') {
  return publishAction('unpublish', { campaign_id: String(campaignId || '').trim().toLowerCase() });
}

if (typeof window !== 'undefined') {
  window.TasteprintCampaignRemote = Object.freeze({
    enabled: REMOTE_CAMPAIGNS_ENABLED,
    authenticatedPublishing: AUTHENTICATED_PUBLISHING,
    fetchPublishedCampaign,
    fetchPublishedCampaignIndex,
    publishCampaign,
    unpublishCampaign
  });
}
