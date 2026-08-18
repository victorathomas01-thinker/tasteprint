import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRole) return json(500, { error: 'server_not_configured' });

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!token) return json(401, { error: 'authentication_required' });

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(401, { error: 'invalid_session' });

  // tasteprint_passport_snapshots.user_id references auth.users ON DELETE CASCADE,
  // so deleting the Auth user also deletes the synced Passport. Anonymous analytics
  // are intentionally separate and remain controlled by the browser deletion token.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Tasteprint account deletion failed', deleteError);
    return json(500, { error: 'delete_failed' });
  }

  return json(200, { deleted: true });
});
