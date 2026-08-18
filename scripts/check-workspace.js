import fs from 'node:fs';
import {
  WORKSPACE_ROLES,
  canWorkspace,
  manifestHasSensitiveTargeting,
  reviewCampaignExperience,
  workspaceCapabilities
} from '../workspace-core.js';

const expectations = {
  owner: ['campaign.edit','campaign.publish','campaign.metrics.view','member.invite','member.manage'],
  admin: ['campaign.edit','campaign.publish','campaign.metrics.view','member.invite'],
  editor: ['campaign.edit'],
  analyst: ['campaign.metrics.view'],
  viewer: []
};

for (const role of WORKSPACE_ROLES) {
  const caps = workspaceCapabilities(role);
  if (caps.role !== role) throw new Error(`Workspace role normalization failed for ${role}.`);
  for (const permission of expectations[role]) {
    if (!canWorkspace(role, permission)) throw new Error(`${role} should have ${permission}.`);
  }
}
if (canWorkspace('editor', 'campaign.publish')) throw new Error('Editors must not be able to publish.');
if (canWorkspace('admin', 'member.manage')) throw new Error('Only owners should be able to change/remove member roles in the first hosted workspace model.');
if (canWorkspace('viewer', 'campaign.edit')) throw new Error('Viewers must remain read-only.');

const goodManifest = {
  id: 'good-campaign',
  name: 'Good Campaign',
  copy: {
    title: 'Find the option that actually fits your kind of trip.',
    lede: 'Make a few quick tradeoffs, see why your result fits, and leave with a short list of concrete options instead of fifty open tabs.',
    start: 'Find my match'
  },
  leadCapture: {
    enabled: true,
    demoOnly: false,
    title: 'Want these picks later?',
    body: 'Send the matched shortlist after you already have the full result.',
    consentText: 'I agree to receive this result and related campaign follow-up.',
    privacyUrl: 'https://example.com/privacy'
  },
  catalog: [
    { id: 'one', name: 'One', description: 'Useful option one.', modes: ['Culture City'], href: 'https://example.com/one' },
    { id: 'two', name: 'Two', description: 'Useful option two.', modes: ['City + Coast'], href: 'https://example.com/two' },
    { id: 'three', name: 'Three', description: 'Useful option three.', modes: ['Slow Countryside'], href: 'https://example.com/three' },
    { id: 'four', name: 'Four', description: 'Useful option four.', modes: ['Nature Active'], href: 'https://example.com/four' }
  ]
};
const goodReview = reviewCampaignExperience(goodManifest);
if (goodReview.blocking.length) throw new Error(`Healthy campaign should not have privacy blocks: ${goodReview.blocking.join(', ')}`);
if (goodReview.score < 85) throw new Error(`Healthy campaign experience score is unexpectedly low: ${goodReview.score}.`);

const sensitiveManifest = structuredClone(goodManifest);
sensitiveManifest.targeting = { race: 'example', medical_status: 'example' };
if (!manifestHasSensitiveTargeting(sensitiveManifest)) throw new Error('Sensitive targeting fields were not detected.');
const sensitiveReview = reviewCampaignExperience(sensitiveManifest);
if (!sensitiveReview.blocking.includes('sensitive-targeting')) throw new Error('Sensitive targeting must create a publishing-quality privacy block.');

const pressureManifest = structuredClone(goodManifest);
pressureManifest.copy.start = 'Buy now';
pressureManifest.copy.lede = 'Act now. Last chance. Everyone is already doing this, so do not miss out.';
const pressureReview = reviewCampaignExperience(pressureManifest);
if (pressureReview.score >= goodReview.score) throw new Error('Dark-pattern copy should reduce the experience score.');

const sql = fs.readFileSync(new URL('../supabase/workspaces.sql', import.meta.url), 'utf8');
for (const marker of [
  'tasteprint_workspaces',
  'tasteprint_workspace_members',
  'tasteprint_workspace_invites',
  'tasteprint_workspace_campaigns',
  'enable row level security',
  'tasteprint_workspace_role',
  'tasteprint_create_workspace_invite',
  'tasteprint_accept_workspace_invite',
  'token_hash',
  "digest(v_token, 'sha256')",
  'tasteprint_workspace_members_public',
  'member_ref'
]) {
  if (!sql.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Workspace SQL is missing ${marker}.`);
}
if (/\bemail\s+(text|varchar)/i.test(sql)) throw new Error('Workspace tables must not store member/invite email addresses.');
if (/\btoken\s+text\s+not null/i.test(sql)) throw new Error('Workspace invite table must not persist raw invitation tokens.');

const publish = fs.readFileSync(new URL('../supabase/functions/publish-campaign/index.ts', import.meta.url), 'utf8');
for (const marker of [
  'auth.getUser(token)',
  'tasteprint_workspace_members',
  "['owner', 'admin']",
  'SUPABASE_SECRET_KEYS',
  'TASTEPRINT_ALLOWED_ORIGINS',
  "existing.workspace_id !== workspaceId",
  'hasSensitiveKey(manifest)'
]) {
  if (!publish.includes(marker)) throw new Error(`Authenticated publish function is missing ${marker}.`);
}
for (const forbidden of ['x-publish-token', 'TASTEPRINT_PUBLISH_TOKEN', "'Access-Control-Allow-Origin': '*'"]) {
  if (publish.includes(forbidden)) throw new Error(`Publish function still contains legacy/high-risk marker ${forbidden}.`);
}

const remote = fs.readFileSync(new URL('../campaign-remote.js', import.meta.url), 'utf8');
for (const marker of ['getSession()', 'session.access_token', 'workspace_id: team', "startsWith('sb_publishable_')"]) {
  if (!remote.includes(marker)) throw new Error(`Campaign remote client is missing ${marker}.`);
}
if (remote.includes('x-publish-token')) throw new Error('Browser publishing must not send a shared operator secret.');

const workspace = fs.readFileSync(new URL('../workspace.js', import.meta.url), 'utf8');
for (const marker of ['Local demo', 'tasteprint_workspace_context', 'tasteprint_create_workspace_invite', 'reviewCampaignExperience']) {
  if (!workspace.includes(marker)) throw new Error(`Workspace UI is missing ${marker}.`);
}
if (/TasteprintAnalytics\?\.track|TasteprintAnalytics\.track/.test(workspace)) throw new Error('Workspace account/admin actions must not be attached to anonymous Tasteprint analytics.');

const bridge = fs.readFileSync(new URL('../studio-workspace-bridge.js', import.meta.url), 'utf8');
for (const marker of ['hideLegacyPublishToken', 'Save to team workspace', 'reviewCampaignExperience', 'campaign.publish']) {
  if (!bridge.includes(marker)) throw new Error(`Studio workspace bridge is missing ${marker}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['workspace.css', 'workspace.js', 'studio-workspace-bridge.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

console.log(`Campaign Workspace OK — ${WORKSPACE_ROLES.length} roles, tenant RLS + hashed invites + authenticated publishing + local demo + ethical experience QA wired.`);
