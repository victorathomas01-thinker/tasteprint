import { SENSITIVE_ATTRIBUTE_TERMS } from './intelligence-core.js';

export const WORKSPACE_VERSION = 1;
export const WORKSPACE_ROLES = Object.freeze(['owner', 'admin', 'editor', 'analyst', 'viewer']);
export const WORKSPACE_PERMISSIONS = Object.freeze([
  'workspace.view',
  'campaign.create',
  'campaign.edit',
  'campaign.publish',
  'campaign.archive',
  'campaign.metrics.view',
  'member.invite',
  'member.manage'
]);

const ROLE_PERMISSIONS = Object.freeze({
  owner: Object.freeze([...WORKSPACE_PERMISSIONS]),
  admin: Object.freeze([
    'workspace.view',
    'campaign.create',
    'campaign.edit',
    'campaign.publish',
    'campaign.archive',
    'campaign.metrics.view',
    'member.invite'
  ]),
  editor: Object.freeze(['workspace.view', 'campaign.create', 'campaign.edit']),
  analyst: Object.freeze(['workspace.view', 'campaign.metrics.view']),
  viewer: Object.freeze(['workspace.view'])
});

const ROLE_LABELS = Object.freeze({
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  analyst: 'Analyst',
  viewer: 'Viewer'
});

const clean = (value, max = 160) => String(value ?? '').trim().slice(0, max);
const normalizeWords = (value) => clean(value, 4000).toLowerCase().replace(/\s+/g, ' ');

export function normalizeWorkspaceRole(value) {
  const role = clean(value, 20).toLowerCase();
  return WORKSPACE_ROLES.includes(role) ? role : 'viewer';
}

export function workspaceRoleLabel(value) {
  return ROLE_LABELS[normalizeWorkspaceRole(value)] || 'Viewer';
}

export function canWorkspace(role, permission) {
  return Boolean(ROLE_PERMISSIONS[normalizeWorkspaceRole(role)]?.includes(permission));
}

export function workspaceCapabilities(role) {
  const normalized = normalizeWorkspaceRole(role);
  return {
    role: normalized,
    label: workspaceRoleLabel(normalized),
    permissions: [...ROLE_PERMISSIONS[normalized]],
    canEdit: canWorkspace(normalized, 'campaign.edit'),
    canPublish: canWorkspace(normalized, 'campaign.publish'),
    canSeeMetrics: canWorkspace(normalized, 'campaign.metrics.view'),
    canInvite: canWorkspace(normalized, 'member.invite'),
    canManageMembers: canWorkspace(normalized, 'member.manage')
  };
}

export function safeWorkspaceSlug(value) {
  return clean(value, 60)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48);
}

export function safeCampaignId(value) {
  return clean(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
}

export function safeMemberLabel(userId, currentUserId = '') {
  if (userId && userId === currentUserId) return 'You';
  const id = clean(userId, 80);
  return id ? `Member · ${id.slice(0, 6)}…${id.slice(-4)}` : 'Member';
}

export function sanitizeWorkspaceRecord(value = {}) {
  return {
    id: clean(value.id, 80),
    slug: safeWorkspaceSlug(value.slug),
    name: clean(value.name, 120),
    role: normalizeWorkspaceRole(value.role),
    created_at: clean(value.created_at, 48)
  };
}

export function sanitizeCampaignSummary(value = {}) {
  return {
    workspace_id: clean(value.workspace_id, 80),
    campaign_id: safeCampaignId(value.campaign_id || value.id),
    name: clean(value.name || value.manifest?.name || value.campaign_id, 120),
    status: ['draft', 'published', 'archived'].includes(value.status) ? value.status : 'draft',
    version: Math.max(1, Number(value.version || 1)),
    updated_at: clean(value.updated_at, 48)
  };
}

function collectKeys(value, keys = []) {
  if (!value || typeof value !== 'object') return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(String(key).toLowerCase().replace(/[^a-z0-9_]+/g, '_'));
    if (child && typeof child === 'object') collectKeys(child, keys);
  }
  return keys;
}

export function manifestHasSensitiveTargeting(manifest = {}) {
  const keys = collectKeys(manifest, []);
  const allowedConfigKeys = new Set(['collectname']);
  return keys.some((key) => {
    if (allowedConfigKeys.has(key)) return false;
    return SENSITIVE_ATTRIBUTE_TERMS.some((term) => key === term || key.startsWith(`${term}_`) || key.endsWith(`_${term}`));
  });
}

function allStrings(value, output = []) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => allStrings(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => allStrings(item, output));
  return output;
}

const DARK_PATTERN_PATTERNS = Object.freeze([
  /\blast chance\b/i,
  /\bact now\b/i,
  /\bbuy now or\b/i,
  /\bonly \d+ (left|remaining)\b/i,
  /\beveryone (is|has)\b/i,
  /\bguaranteed to\b/i,
  /\bwe know you\b/i,
  /\bperfect for you\b/i,
  /\bno-brainer\b/i
]);

export function manifestDarkPatternHits(manifest = {}) {
  const text = allStrings(manifest).map(normalizeWords).join(' \n ');
  return DARK_PATTERN_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

function check(id, title, passed, weight, copy, severity = 'quality') {
  return Object.freeze({ id, title, passed: Boolean(passed), weight, copy, severity });
}

export function reviewCampaignExperience(manifest = {}) {
  const catalog = Array.isArray(manifest.catalog) ? manifest.catalog : [];
  const title = clean(manifest.copy?.title, 240);
  const lede = clean(manifest.copy?.lede, 600);
  const start = clean(manifest.copy?.start, 100).toLowerCase();
  const lead = manifest.leadCapture || {};
  const distinctModes = new Set(catalog.flatMap((item) => Array.isArray(item?.modes) ? item.modes : []).filter(Boolean));
  const secureLinks = catalog.every((item) => !item?.href || /^https:\/\//i.test(String(item.href)));
  const usefulItems = catalog.filter((item) => clean(item?.name, 120) && clean(item?.description, 300) && Array.isArray(item?.modes) && item.modes.length);
  const darkHits = manifestDarkPatternHits(manifest);
  const sensitive = manifestHasSensitiveTargeting(manifest);
  const leadSafe = !lead.enabled || Boolean(
    clean(lead.consentText, 600)
    && (lead.demoOnly || /^https:\/\//i.test(String(lead.privacyUrl || '')))
  );
  const lowPressureStart = !/buy|purchase|claim|checkout|reserve now|book now/i.test(start);
  const choiceBreadth = distinctModes.size >= 3 || catalog.length >= 5;
  const valueClarity = title.length >= 12 && title.length <= 120 && lede.length >= 35 && lede.length <= 360;
  const actionable = catalog.length >= 3 && usefulItems.length === catalog.length;
  const asksAfterValue = !lead.enabled || Boolean(lead.title && lead.body);

  const checks = [
    check('clear-value', 'Clear value promise', valueClarity, 13,
      valueClarity ? 'The landing explains the payoff quickly.' : 'Make the landing say what decision this helps the user make, not just that it is “personalized.”'),
    check('actionable-output', 'Useful output', actionable, 17,
      actionable ? 'The result leads to multiple concrete options with reasons.' : 'Give every result at least three concrete next options with a short reason each.'),
    check('choice-breadth', 'Enough choice without overload', choiceBreadth, 10,
      choiceBreadth ? 'The catalog has enough range for recommendations to feel meaningfully different.' : 'Add enough coverage that the result is not just one disguised sales pitch.'),
    check('value-before-ask', 'Value before data request', asksAfterValue, 14,
      asksAfterValue ? 'Any follow-up ask is positioned after the result and framed around a useful next step.' : 'Do not ask for contact information until the user already received a complete result.'),
    check('consent', 'Consent and privacy', leadSafe, 14,
      leadSafe ? 'Lead capture is either off/demo-only or has explicit consent and an HTTPS privacy destination.' : 'Real lead capture needs clear consent plus an HTTPS privacy URL.' , 'privacy'),
    check('safe-links', 'Safe outbound links', secureLinks, 8,
      secureLinks ? 'Catalog links use HTTPS or stay intentionally link-free.' : 'Replace non-HTTPS catalog links before publishing.', 'privacy'),
    check('autonomy', 'Autonomy-preserving CTA', lowPressureStart && !darkHits.length, 12,
      lowPressureStart && !darkHits.length ? 'Copy invites exploration instead of manufacturing urgency.' : 'Remove pressure language. Curiosity and agency outperform fake urgency for a product that depends on trust.'),
    check('sensitive-targeting', 'No sensitive-attribute targeting', !sensitive, 12,
      !sensitive ? 'The manifest does not contain protected/sensitive targeting fields.' : 'Remove demographic, medical, political, location-history, or other sensitive targeting fields.', 'privacy')
  ];

  const possible = checks.reduce((sum, item) => sum + item.weight, 0);
  const earned = checks.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
  const score = Math.round((earned / Math.max(possible, 1)) * 100);
  const privacyBlocks = checks.filter((item) => item.severity === 'privacy' && !item.passed);
  const qualityMisses = checks.filter((item) => item.severity !== 'privacy' && !item.passed);

  let grade = 'Needs work';
  if (!privacyBlocks.length && score >= 90) grade = 'Ready to delight';
  else if (!privacyBlocks.length && score >= 76) grade = 'Strong foundation';
  else if (!privacyBlocks.length && score >= 60) grade = 'Promising, tighten it';
  else if (privacyBlocks.length) grade = 'Privacy block';

  return {
    version: WORKSPACE_VERSION,
    score,
    grade,
    checks,
    blocking: privacyBlocks.map((item) => item.id),
    warning_count: qualityMisses.length,
    principle: 'Reduce decision friction, preserve agency, deliver value before asking for data, and turn the result into a concrete next step.'
  };
}

export const DEMO_WORKSPACE = Object.freeze({
  id: 'demo-workspace',
  slug: 'north-star-demo',
  name: 'North Star Demo Team',
  role: 'owner',
  demo: true,
  members: Object.freeze([
    Object.freeze({ label: 'You', role: 'owner' }),
    Object.freeze({ label: 'Brand editor', role: 'editor' }),
    Object.freeze({ label: 'Insights partner', role: 'analyst' })
  ])
});
