import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function readSecretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS') || '';
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      const first = parsed && typeof parsed === 'object'
        ? Object.values(parsed).find((value) => typeof value === 'string' && value)
        : null;
      if (typeof first === 'string') return first;
    } catch {
      // Fall back to the legacy server-only value while projects migrate key formats.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
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
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function normalizeId(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
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
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed.' }, 405);

  const origin = request.headers.get('origin') || '';
  if (origin && !allowedOrigins().has(origin)) return json(request, { error: 'Origin not allowed.' }, 403);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 16_384) return json(request, { error: 'Request is too large.' }, 413);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const secretKey = readSecretKey();
  if (!supabaseUrl || !secretKey) return json(request, { error: 'Lead capture is temporarily unavailable.' }, 503);

  const db = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'Invalid request.' }, 400);
  }

  const campaignId = normalizeId(body?.campaign_id);
  const email = String(body?.email || '').trim().toLowerCase().slice(0, 254);
  const name = String(body?.name || '').trim().slice(0, 100) || null;
  const consentVersion = String(body?.consent_version || 'v1').trim().slice(0, 40) || 'v1';
  const source = String(body?.source || 'post_result').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 40) || 'post_result';

  if (!campaignId) return json(request, { error: 'Campaign id is required.' }, 400);
  if (!validEmail(email)) return json(request, { error: 'A valid email is required.' }, 400);
  if (body?.consent !== true) return json(request, { error: 'Explicit consent is required.' }, 400);

  const { data: campaignRow, error: campaignError } = await db
    .from('tasteprint_campaigns')
    .select('manifest,status')
    .eq('campaign_id', campaignId)
    .eq('status', 'published')
    .maybeSingle();

  if (campaignError) {
    console.error('Tasteprint lead campaign lookup failed', campaignError.code || 'database_error');
    return json(request, { error: 'Lead capture is temporarily unavailable.' }, 503);
  }
  if (!campaignRow) return json(request, { error: 'Campaign is not available.' }, 404);

  const leadConfig = campaignRow.manifest?.leadCapture;
  if (!leadConfig?.enabled || leadConfig?.demoOnly) {
    return json(request, { error: 'Lead capture is not enabled for this campaign.' }, 403);
  }

  // The server honors the campaign configuration instead of accepting extra contact fields
  // from the browser. If collectName is false, a supplied name is discarded.
  const storedName = leadConfig?.collectName ? name : null;
  const emailHash = await sha256(email);
  const { error: insertError } = await db.from('tasteprint_campaign_leads').upsert({
    campaign_id: campaignId,
    email,
    email_hash: emailHash,
    name: storedName,
    consent_version: consentVersion,
    source,
    created_at: new Date().toISOString()
  }, { onConflict: 'campaign_id,email_hash' });

  if (insertError) {
    // Never log contact values or send raw database errors back to the browser.
    console.error('Tasteprint lead write failed', insertError.code || 'database_error');
    return json(request, { error: 'Could not save your request right now.' }, 503);
  }
  return json(request, { accepted: true });
});
