import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function readNamedKey(envName: string, legacyName: string) {
  const modern = Deno.env.get(envName) || '';
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      if (parsed && typeof parsed === 'object') {
        const first = Object.values(parsed).find((value) => typeof value === 'string' && value);
        if (typeof first === 'string') return first;
      }
    } catch {
      // Fall through to legacy/default environment value.
    }
  }
  return Deno.env.get(legacyName) || '';
}

function allowedOrigins() {
  const configured = (Deno.env.get('TASTEPRINT_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([
    'https://victorathomas01-thinker.github.io',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...configured
  ]);
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
  if (origin && allowedOrigins().has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function normalizeId(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

function validUUID(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

const SENSITIVE_KEYS = [
  'age','race','ethnicity','religion','sex','gender','sexuality','orientation','disability',
  'health','medical','pregnancy','income','politics','precise_location','zipcode','postal_code',
  'biometric','contacts','email','phone','user_id','install_id','owner_hash','session_id'
];

function hasSensitiveKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  for (const [rawKey, child] of Object.entries(value as Record<string, unknown>)) {
    const key = rawKey.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    // leadCapture.collectName is a configuration boolean, not collected contact data.
    if (key !== 'collectname' && SENSITIVE_KEYS.some((term) => key === term || key.startsWith(`${term}_`) || key.endsWith(`_${term}`))) {
      return true;
    }
    if (child && typeof child === 'object' && hasSensitiveKey(child)) return true;
  }
  return false;
}

function containsUnsafeMarkup(value: unknown): boolean {
  if (typeof value === 'string') return /<\s*script|javascript\s*:/i.test(value);
  if (Array.isArray(value)) return value.some(containsUnsafeMarkup);
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).some(containsUnsafeMarkup);
  return false;
}

function validateManifest(manifest: any) {
  const errors: string[] = [];
  const id = normalizeId(manifest?.id);
  if (!id) errors.push('Campaign id is required.');
  if (!String(manifest?.name || '').trim()) errors.push('Campaign name is required.');
  if (!String(manifest?.copy?.title || '').trim()) errors.push('Landing title is required.');
  if (!String(manifest?.copy?.lede || '').trim()) errors.push('Landing description is required.');
  if (!Array.isArray(manifest?.catalog) || !manifest.catalog.length) errors.push('Catalog must contain at least one item.');

  let encoded = '';
  try { encoded = JSON.stringify(manifest); } catch { errors.push('Campaign manifest must be valid JSON.'); }
  if (encoded.length > 250_000) errors.push('Campaign manifest is too large.');
  if (hasSensitiveKey(manifest)) errors.push('Campaign manifests cannot contain sensitive identity/contact targeting fields.');
  if (containsUnsafeMarkup(manifest)) errors.push('Campaign manifest contains unsafe script/URL markup.');

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

  const lead = manifest?.leadCapture;
  if (lead?.enabled) {
    if (!String(lead?.title || '').trim()) errors.push('Lead capture title is required.');
    if (!String(lead?.consentText || '').trim()) errors.push('Lead capture consent text is required.');
    if (!lead?.demoOnly && !/^https:\/\//i.test(String(lead?.privacyUrl || ''))) {
      errors.push('Lead capture privacy URL must use HTTPS for non-demo campaigns.');
    }
  }

  return { id, errors };
}

function cleanManifestForStorage(manifest: any, id: string) {
  const cleanManifest = structuredClone(manifest);
  cleanManifest.id = id;
  delete cleanManifest.localDraft;
  delete cleanManifest.published;
  delete cleanManifest.publishedAt;
  delete cleanManifest.publishedVersion;
  delete cleanManifest.workspace_id;
  delete cleanManifest.workspaceId;
  delete cleanManifest.owner;
  delete cleanManifest.user;
  return cleanManifest;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed.' }, 405);

  const origin = request.headers.get('origin') || '';
  if (origin && !allowedOrigins().has(origin)) return json(request, { error: 'Origin not allowed.' }, 403);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const publicKey = readNamedKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const secretKey = readNamedKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !publicKey || !secretKey) return json(request, { error: 'Server publish environment is incomplete.' }, 500);

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json(request, { error: 'Authentication required.' }, 401);

  const callerClient = createClient(supabaseUrl, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(request, { error: 'Invalid or expired user session.' }, 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'Invalid JSON body.' }, 400);
  }

  const workspaceId = String(body?.workspace_id || '').trim();
  if (!validUUID(workspaceId)) return json(request, { error: 'A valid workspace id is required.' }, 400);

  const db = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: membership, error: membershipError } = await db
    .from('tasteprint_workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (membershipError) return json(request, { error: 'Could not verify workspace membership.' }, 500);
  if (!membership || !['owner', 'admin'].includes(String(membership.role))) {
    return json(request, { error: 'Owner or admin permission is required to publish.' }, 403);
  }

  if (body?.action === 'unpublish') {
    const campaignId = normalizeId(body?.campaign_id);
    if (!campaignId) return json(request, { error: 'Campaign id is required.' }, 400);

    const { data: existing, error: readError } = await db
      .from('tasteprint_campaigns')
      .select('workspace_id')
      .eq('campaign_id', campaignId)
      .maybeSingle();
    if (readError) return json(request, { error: readError.message }, 500);
    if (!existing || existing.workspace_id !== workspaceId) {
      return json(request, { error: 'Campaign does not belong to this workspace.' }, 403);
    }

    const now = new Date().toISOString();
    const { error } = await db
      .from('tasteprint_campaigns')
      .update({ status: 'archived', updated_at: now, updated_by: user.id })
      .eq('campaign_id', campaignId)
      .eq('workspace_id', workspaceId);
    if (error) return json(request, { error: error.message }, 500);

    await db.from('tasteprint_workspace_campaigns')
      .update({ status: 'archived', updated_by: user.id, updated_at: now })
      .eq('workspace_id', workspaceId)
      .eq('campaign_id', campaignId);

    return json(request, { campaign_id: campaignId, status: 'archived' });
  }

  if (body?.action !== 'publish') return json(request, { error: 'Unknown publish action.' }, 400);

  const manifest = body?.manifest;
  const { id, errors } = validateManifest(manifest);
  if (errors.length) return json(request, { error: errors[0], errors }, 400);
  const cleanManifest = cleanManifestForStorage(manifest, id);

  const { data: publicExisting, error: publicReadError } = await db
    .from('tasteprint_campaigns')
    .select('version,workspace_id')
    .eq('campaign_id', id)
    .maybeSingle();
  if (publicReadError) return json(request, { error: publicReadError.message }, 500);
  if (publicExisting && publicExisting.workspace_id !== workspaceId) {
    return json(request, { error: 'That public campaign id is already owned by another workspace.' }, 409);
  }

  const { data: hostedExisting, error: hostedReadError } = await db
    .from('tasteprint_workspace_campaigns')
    .select('version,created_by')
    .eq('workspace_id', workspaceId)
    .eq('campaign_id', id)
    .maybeSingle();
  if (hostedReadError) return json(request, { error: hostedReadError.message }, 500);

  const nextVersion = Math.max(1, Number(publicExisting?.version || 0) + 1);
  const nextHostedVersion = Math.max(1, Number(hostedExisting?.version || 0) + 1);
  const now = new Date().toISOString();

  const { error: hostedError } = await db.from('tasteprint_workspace_campaigns').upsert({
    workspace_id: workspaceId,
    campaign_id: id,
    manifest: cleanManifest,
    status: 'published',
    version: nextHostedVersion,
    created_by: hostedExisting?.created_by || user.id,
    updated_by: user.id,
    updated_at: now
  }, { onConflict: 'workspace_id,campaign_id' });
  if (hostedError) return json(request, { error: hostedError.message }, 500);

  const { error: publishError } = await db.from('tasteprint_campaigns').upsert({
    campaign_id: id,
    workspace_id: workspaceId,
    updated_by: user.id,
    manifest: cleanManifest,
    status: 'published',
    version: nextVersion,
    updated_at: now,
    published_at: now
  }, { onConflict: 'campaign_id' });
  if (publishError) return json(request, { error: publishError.message }, 500);

  return json(request, {
    campaign_id: id,
    status: 'published',
    version: nextVersion,
    published_at: now
  });
});
