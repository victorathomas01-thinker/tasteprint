import fs from 'node:fs';

const clientFiles = [
  'analytics.js',
  'account-sync.js',
  'campaign-remote.js',
  'workspace.js',
  'studio-workspace-bridge.js',
  'next-moves.js',
  'privacy-extensions.js'
];

for (const file of clientFiles) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  for (const forbidden of ['sb_secret_', 'SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (source.includes(forbidden)) throw new Error(`${file} contains server-secret marker ${forbidden}.`);
  }
}

const workspaceSql = fs.readFileSync(new URL('../supabase/workspaces.sql', import.meta.url), 'utf8');
if (!workspaceSql.includes('enable row level security')) throw new Error('Workspace schema must enable RLS.');
if (/tasteprint_workspace_(members|invites)[\s\S]{0,1200}\bemail\s+(text|varchar)/i.test(workspaceSql)) {
  throw new Error('Workspace membership/invite tables must not persist email addresses.');
}
if (!workspaceSql.includes("digest(v_token, 'sha256')")) throw new Error('Workspace invitation tokens must be hashed before storage.');
if (!workspaceSql.includes('tasteprint_workspace_members_public')) throw new Error('Browser member enumeration must use the privacy-limited member RPC.');

const publish = fs.readFileSync(new URL('../supabase/functions/publish-campaign/index.ts', import.meta.url), 'utf8');
if (!publish.includes('auth.getUser(token)')) throw new Error('Publish function must verify the user JWT.');
if (!publish.includes("['owner', 'admin']")) throw new Error('Publish function must enforce owner/admin role server-side.');
if (!publish.includes('existing.workspace_id !== workspaceId')) throw new Error('Unpublish must enforce tenant ownership server-side.');
if (!publish.includes('publicExisting.workspace_id !== workspaceId')) throw new Error('Publish must reject campaign-id takeover across workspaces.');
if (publish.includes("'Access-Control-Allow-Origin': '*'")) throw new Error('Authenticated admin Edge Function must not use wildcard CORS.');

const registry = fs.readFileSync(new URL('../supabase/campaign-registry.sql', import.meta.url), 'utf8');
for (const forbiddenOutput of ["'workspace_id'", "'updated_by'", "'created_by'"]) {
  const publicFunctionStart = registry.indexOf('tasteprint_public_campaign_index');
  if (publicFunctionStart >= 0 && registry.slice(publicFunctionStart).includes(forbiddenOutput)) {
    throw new Error(`Public campaign index should not expose internal tenant field ${forbiddenOutput}.`);
  }
}

const workspaceRuntime = fs.readFileSync(new URL('../workspace.js', import.meta.url), 'utf8');
if (/\.select\([^)]*(created_by|updated_by|user_id)/i.test(workspaceRuntime)) {
  throw new Error('Workspace browser UI should not request internal user/audit IDs when it does not need them.');
}
if (workspaceRuntime.includes('TasteprintAnalytics')) throw new Error('Workspace/admin identity must remain outside anonymous consumer analytics.');

const nextMoves = fs.readFileSync(new URL('../next-moves-core.js', import.meta.url), 'utf8');
for (const allowed of ['module', 'result_key', 'recommendation_id', 'name', 'icon', 'copy', 'status']) {
  if (!nextMoves.includes(allowed)) throw new Error(`Next Moves sanitizer is missing allowlisted field ${allowed}.`);
}

console.log(`Privacy boundary OK — ${clientFiles.length} browser clients contain no server secret keys; workspace RLS/tenant checks, hashed invites, narrow member views and local decision minimization are enforced.`);
