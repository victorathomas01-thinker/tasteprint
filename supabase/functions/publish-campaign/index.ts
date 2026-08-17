import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-publish-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function normalizeId(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
}

function validateManifest(manifest: any) {
  const errors: string[] = [];
  const id = normalizeId(manifest?.id);
  if (!id) errors.push('Campaign id is required.');
  if (!String(manifest?.name || '').trim()) errors.push('Campaign name is required.');
  if (!String(manifest?.copy?.title || '').trim()) errors.push('Landing title is required.');
  if (!String(manifest?.copy?.lede || '').trim()) errors.push('Landing description is required.');
  if (!Array.isArray(manifest?.catalog) || !manifest.catalog.length) errors.push('Catalog must contain at least one item.');

  const seen = new Set<string>();
  for (const item of manifest?.catalog || []) {
    const itemId = String(item?.id || '').trim();
    if (!itemId) errors.push('Every catalog item needs an id.');
    if (itemId && seen.has(itemId)) errors.push(`Duplicate catalog id: ${itemId}.`);
    if (itemId) seen.add(itemId);
    if (!String(item?.name || '').trim()) errors.push(`Catalog item ${itemId || '(unnamed)'} needs a name.`);
    if (!String(item?.description || '').trim()) errors.push(`Catalog item ${itemId || '(unnamed)'} needs a description.`);
    if (!Array.isArray(item?.modes) || !item.modes.length) errors.push(`Catalog item ${itemId || '(unnamed)'} needs at least one travel mode.`);
    if (item?.href && !/^https:\/\//i.test(String(item.href))) errors.push(`Catalog item ${itemId || '(unnamed)'} must use HTTPS.`);
  }
  return { id, errors };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const expectedToken = Deno.env.get('TASTEPRINT_PUBLISH_TOKEN') || '';
  const suppliedToken = request.headers.get('x-publish-token') || '';
  if (!safeEqual(suppliedToken, expectedToken)) return json({ error: 'Publish authorization failed.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server publish environment is incomplete.' }, 500);

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  if (body?.action === 'unpublish') {
    const campaignId = normalizeId(body?.campaign_id);
    if (!campaignId) return json({ error: 'Campaign id is required.' }, 400);
    const { error } = await db
      .from('tasteprint_campaigns')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('campaign_id', campaignId);
    if (error) return json({ error: error.message }, 500);
    return json({ campaign_id: campaignId, status: 'archived' });
  }

  if (body?.action !== 'publish') return json({ error: 'Unknown publish action.' }, 400);

  const manifest = body?.manifest;
  const { id, errors } = validateManifest(manifest);
  if (errors.length) return json({ error: errors[0], errors }, 400);

  const cleanManifest = structuredClone(manifest);
  cleanManifest.id = id;
  delete cleanManifest.localDraft;
  delete cleanManifest.published;
  delete cleanManifest.publishedAt;
  delete cleanManifest.publishedVersion;

  const { data: existing, error: readError } = await db
    .from('tasteprint_campaigns')
    .select('version')
    .eq('campaign_id', id)
    .maybeSingle();
  if (readError) return json({ error: readError.message }, 500);

  const nextVersion = Math.max(1, Number(existing?.version || 0) + 1);
  const now = new Date().toISOString();
  const { error } = await db.from('tasteprint_campaigns').upsert({
    campaign_id: id,
    manifest: cleanManifest,
    status: 'published',
    version: nextVersion,
    updated_at: now,
    published_at: now
  }, { onConflict: 'campaign_id' });

  if (error) return json({ error: error.message }, 500);
  return json({ campaign_id: id, status: 'published', version: nextVersion, published_at: now });
});
