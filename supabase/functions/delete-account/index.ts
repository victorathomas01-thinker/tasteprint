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
      // Fall back while a project still uses the legacy server-only key name.
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

function json(request: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, 405, { error: 'method_not_allowed' });

  const origin = request.headers.get('origin') || '';
  if (origin && !allowedOrigins().has(origin)) return json(request, 403, { error: 'origin_not_allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const secretKey = readSecretKey();
  if (!supabaseUrl || !secretKey) return json(request, 503, { error: 'server_not_configured' });

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!token) return json(request, 401, { error: 'authentication_required' });

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(request, 401, { error: 'invalid_session' });

  // Never silently orphan or destroy a commercial workspace as a side effect of deleting
  // the optional Auth account. An owner must first transfer ownership or intentionally
  // delete the workspace from Campaign Workspace.
  const { count: ownedWorkspaceCount, error: ownerCheckError } = await admin
    .from('tasteprint_workspace_members')
    .select('workspace_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'owner');

  if (ownerCheckError) {
    console.error('Tasteprint account ownership check failed', ownerCheckError.code || 'database_error');
    return json(request, 503, { error: 'ownership_check_failed' });
  }
  if ((ownedWorkspaceCount || 0) > 0) {
    return json(request, 409, {
      error: 'workspace_ownership_exists',
      workspace_count: ownedWorkspaceCount,
      message: 'Transfer or delete owned Campaign Workspaces before deleting this Auth account.'
    });
  }

  // Passport snapshots and ordinary workspace membership rows reference auth.users with
  // ON DELETE CASCADE. Workspace audit fields are nullable/set-null via workspace-lifecycle.sql.
  // Anonymous analytics remain intentionally separate and use the browser deletion token.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Tasteprint account deletion failed', deleteError.code || 'database_error');
    return json(request, 503, { error: 'delete_failed' });
  }

  return json(request, 200, { deleted: true });
});
