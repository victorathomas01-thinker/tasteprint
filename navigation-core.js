import { MODULES } from './platform-core.js';

// Shared destinations for the public entry pages and persistent navigation.
// New consumer modules come from the platform registry; business tools live here.
export const moduleHref = (id) => `?module=${encodeURIComponent(id)}`;
export const discoveryModules = () => MODULES.filter((module) => module.status === 'live');
export const BUSINESS_TOOLS = Object.freeze([
  { name: 'Campaign Studio', href: '?campaignAdmin=1', step: '01', label: 'Create', status: 'Local tool', copy: 'Configure your branding, questions and offer catalog. Preview and export a campaign before sharing it.' },
  { name: 'Guest experience', href: '?campaign=charlotte-boutique-demo', step: '02', label: 'Preview', status: 'Fictional demo', copy: 'Try the fictional Charlotte hotel as a guest: discover preferences, see fitting ideas and explore illustrative next steps.' },
  { name: 'Campaign reporting', href: '?campaignReport=charlotte-boutique-demo&demo=1', step: '03', label: 'Review', status: 'Local activity', copy: 'Inspect hotel-demo activity from this browser. Shared reporting requires a connected backend.' },
  { name: 'Team Workspace', href: '?workspace=1&demo=1', step: '04', label: 'Collaborate', status: 'Local demo', copy: 'Explore team roles, drafts and campaign quality checks. Hosted teams and publishing require backend activation.' }
]);

const EXPERIENCE_KEYS = ['campaignGuide', 'module', 'campaign', 'campaignAdmin', 'campaignReport', 'workspace', 'workspaceInvite', 'profile', 'modules', 'next', 'tour', 'stats', 'growth', 'privacy', 'challenge', 'result', 'p', 'c'];

export function entryPage(params) {
  // Existing campaign, invitation and shared-result routes always take priority.
  if (EXPERIENCE_KEYS.some((key) => params.has(key))) return null;
  if (params.get('business') === '1') return 'business';
  if (params.get('campaigns') === '1') return 'campaigns';
  return 'home';
}

export function activeNavigation(params) {
  if (params.has('campaigns') || params.has('campaign')) return 'campaigns';
  if (['business', 'campaignGuide', 'campaignAdmin', 'campaignReport', 'workspace', 'stats', 'growth'].some((key) => params.has(key))) return 'business';
  if (params.has('profile')) return 'profile';
  if (params.has('next')) return 'next';
  if (params.has('module') || params.has('modules')) return 'discover';
  return entryPage(params) === 'home' ? 'home' : null;
}
