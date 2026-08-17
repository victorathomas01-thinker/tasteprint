import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function normalizeId(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Lead capture environment is incomplete.' }, 500);

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const campaignId = normalizeId(body?.campaign_id);
  const email = String(body?.email || '').trim().toLowerCase().slice(0, 254);
  const name = String(body?.name || '').trim().slice(0, 100) || null;
  const consentVersion = String(body?.consent_version || 'v1').trim().slice(0, 40) || 'v1';
  const source = String(body?.source || 'post_result').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 40) || 'post_result';

  if (!campaignId) return json({ error: 'Campaign id is required.' }, 400);
  if (!validEmail(email)) return json({ error: 'A valid email is required.' }, 400);

  const { data: campaignRow, error: campaignError } = await db
    .from('tasteprint_campaigns')
    .select('manifest,status')
    .eq('campaign_id', campaignId)
    .eq('status', 'published')
    .maybeSingle();

  if (campaignError) return json({ error: campaignError.message }, 500);
  if (!campaignRow) return json({ error: 'Campaign is not published.' }, 404);

  const leadConfig = campaignRow.manifest?.leadCapture;
  if (!leadConfig?.enabled || leadConfig?.demoOnly) {
    return json({ error: 'Lead capture is not enabled for this campaign.' }, 403);
  }

  const emailHash = await sha256(email);
  const { error: insertError } = await db.from('tasteprint_campaign_leads').upsert({
    campaign_id: campaignId,
    email,
    email_hash: emailHash,
    name,
    consent_version: consentVersion,
    source,
    created_at: new Date().toISOString()
  }, { onConflict: 'campaign_id,email_hash' });

  if (insertError) return json({ error: insertError.message }, 500);
  return json({ accepted: true });
});
