const env = import.meta.env || {};
const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = String(env.VITE_SUPABASE_ANON_KEY || '');

export const REMOTE_CAMPAIGNS_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function rpc(name, body) {
  if (!REMOTE_CAMPAIGNS_ENABLED) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: headers(),
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

async function publishAction(action, payload, publishToken) {
  if (!REMOTE_CAMPAIGNS_ENABLED) {
    return { ok: false, error: 'Supabase is not configured for this build.' };
  }
  if (!String(publishToken || '').trim()) {
    return { ok: false, error: 'Publish token is required.' };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/publish-campaign`, {
      method: 'POST',
      headers: headers({ 'x-publish-token': String(publishToken).trim() }),
      body: JSON.stringify({ action, ...payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || `Publish request failed (${response.status}).` };
    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not reach the publish function.' };
  }
}

export function publishCampaign(manifest, publishToken) {
  return publishAction('publish', { manifest }, publishToken);
}

export function unpublishCampaign(campaignId, publishToken) {
  return publishAction('unpublish', { campaign_id: String(campaignId || '').trim().toLowerCase() }, publishToken);
}

if (typeof window !== 'undefined') {
  window.TasteprintCampaignRemote = Object.freeze({
    enabled: REMOTE_CAMPAIGNS_ENABLED,
    fetchPublishedCampaign,
    fetchPublishedCampaignIndex,
    publishCampaign,
    unpublishCampaign
  });
}
