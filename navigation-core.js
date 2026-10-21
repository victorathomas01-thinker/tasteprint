import { MODULES } from './platform-core.js';

// Shared destinations for the public entry pages and persistent navigation.
// New consumer modules come from the platform registry; business tools live here.
export const moduleHref = (id) => `?module=${encodeURIComponent(id)}`;
export const discoveryModules = () => MODULES.filter((module) => module.status === 'live');
export const BUSINESS_TOOLS = Object.freeze([
  { name: 'Campaign Studio', href: '?campaignAdmin=1', step: '01', label: 'Create', status: 'Local tool', copy: 'Configure your branding, page copy and offer catalog. Preview and export a campaign before sharing it.' },
  { name: 'Guest experience', href: '?campaign=charlotte-boutique-demo', step: '02', label: 'Preview', status: 'Fictional demo', copy: 'Try the fictional Charlotte hotel as a guest: discover preferences, see fitting ideas and explore illustrative next steps.' },
  { name: 'Campaign reporting', href: '?campaignReport=charlotte-boutique-demo&demo=1', step: '03', label: 'Review', status: 'Local activity', copy: 'Inspect hotel-demo activity from this browser. Shared reporting requires a connected backend.' },
  { name: 'Team Workspace', href: '?workspace=1&demo=1', step: '04', label: 'Collaborate', status: 'Local demo', copy: 'Explore team roles, drafts and campaign quality checks. Hosted teams and publishing require backend activation.' }
]);

const EXPERIENCE_KEYS = ['friends', 'catalogAdmin', 'plans', 'company', 'companyAdmin', 'discover', 'together', 'campaignGuide', 'module', 'campaign', 'campaignAdmin', 'campaignReport', 'workspace', 'workspaceInvite', 'profile', 'modules', 'next', 'tour', 'stats', 'growth', 'privacy', 'challenge', 'result', 'p', 'c'];

export function entryPage(params) {
  // Existing campaign, invitation and shared-result routes always take priority.
  if (EXPERIENCE_KEYS.some((key) => params.has(key))) return null;
  if (params.get('business') === '1') return 'business';
  if (params.get('campaigns') === '1') return 'campaigns';
  return 'home';
}

// New consumer routes cannot replace a campaign, account or existing deep link.
export function socialRoute(params) {
  if (EXPERIENCE_KEYS.filter(key => !['discover','together'].includes(key)).some(key => params.has(key))) return null;
  if (params.get('together') === '1') return 'together';
  if (params.get('discover') === '1') return 'discover';
  return null;
}

export function companyRoute(params) {
  if (EXPERIENCE_KEYS.filter(key => !['friends','catalogAdmin','company','companyAdmin','discover','together'].includes(key)).some(key => params.has(key))) return null;
  if (params.get('companyAdmin') === '1') return 'editor';
  if (params.has('company')) return 'profile';
  return null;
}

export function activeNavigation(params) {
  if (friendsRoute(params)) return 'friends';
  if (plansRoute(params)) return 'plans';
  if (socialRoute(params) === 'together') return 'together';
  if (params.has('campaigns') || params.has('campaign')) return 'campaigns';
  if (['catalogAdmin', 'company', 'companyAdmin', 'business', 'campaignGuide', 'campaignAdmin', 'campaignReport', 'workspace', 'stats', 'growth'].some((key) => params.has(key))) return 'business';
  if (params.has('profile')) return 'profile';
  if (params.has('next')) return 'next';
  if (params.has('discover') || params.has('module') || params.has('modules')) return 'discover';
  return entryPage(params) === 'home' ? 'home' : null;
}

export function plansRoute(params) {
  return params.get('plans') === '1' && !EXPERIENCE_KEYS.filter(key => !['friends','catalogAdmin','plans','discover','together'].includes(key)).some(key => params.has(key));
}

export function catalogEditorRoute(params) {
  return params.get('catalogAdmin') === '1' && !EXPERIENCE_KEYS.filter(key => !['friends','catalogAdmin','discover','together'].includes(key)).some(key => params.has(key));
}

export function friendsRoute(params) {
 return params.get('friends') === '1' && !EXPERIENCE_KEYS.filter(key=>!['friends','catalogAdmin','discover','together'].includes(key)).some(key=>params.has(key)) && !params.has('catalogAdmin');
}
