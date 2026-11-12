import assert from 'node:assert/strict';
import { activeNavigation, discoveryModules, entryPage, moduleHref, BUSINESS_TOOLS } from '../navigation-core.js';
import { getCampaign, listBundledCampaigns, saveCampaignDraft } from '../campaign-config.js';

const params = (query) => new URLSearchParams(query);
assert.equal(entryPage(params('')), 'home');
assert.equal(entryPage(params('utm_source=partner')), 'home');
assert.equal(entryPage(params('business=1')), 'business');
assert.equal(entryPage(params('campaigns=1')), 'campaigns');
// Public entry pages must never consume a deep link or private invitation.
for (const query of ['campaignGuide=charlotte-boutique-demo', 'module=escape', 'module=wear', 'campaign=aster', 'campaignAdmin=1', 'campaignReport=aster', 'workspace=1', 'workspaceInvite=token', 'profile=1', 'modules=1', 'next=1', 'tour=1', 'stats=1', 'growth=1', 'privacy=1', 'challenge=vector', 'result=vector', 'p=short', 'c=short']) {
  assert.equal(entryPage(params(query)), null, query);
  assert.equal(entryPage(params(`${query}&business=1&campaigns=1`)), null, `preserve ${query}`);
}
for (const module of discoveryModules()) {
  assert.equal(params(moduleHref(module.id).slice(1)).get('module'), module.id);
  assert.equal(activeNavigation(params(moduleHref(module.id).slice(1))), 'discover');
}
assert.equal(new Set(discoveryModules().map((module) => module.id)).size, discoveryModules().length);
assert.equal(activeNavigation(params('campaign=aster')), 'campaigns');
assert.equal(activeNavigation(params('campaignAdmin=1')), 'business');
assert.equal(activeNavigation(params('campaignGuide=charlotte-boutique-demo')), 'business');
assert.equal(activeNavigation(params('profile=1')), 'profile');
assert.equal(activeNavigation(params('next=1')), 'next');
assert.equal(activeNavigation(params('privacy=1')), null);
for (const tool of BUSINESS_TOOLS) {
  assert.equal(entryPage(params(tool.href.slice(1))), null, `${tool.name} must open the tool`);
}
// A valid private Studio draft must not be promoted into the public directory.
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value)
};
try {
  const draft = { ...getCampaign('aster'), id: 'private-team-draft', name: 'Private draft' };
  assert.equal(saveCampaignDraft(draft).ok, true);
  assert.equal(getCampaign(draft.id).name, 'Private draft');
  assert.equal(listBundledCampaigns().some((campaign) => campaign.id === draft.id), false);
  const bundled = listBundledCampaigns();
  bundled[0].name = 'Changed copy';
  assert.notEqual(listBundledCampaigns()[0].name, 'Changed copy', 'directory callers cannot mutate the campaign registry');
} finally {
  delete globalThis.localStorage;
}
console.log('Navigation OK — entry routes, existing deep links, module destinations and business workflow preserved.');

const {socialRoute}=await import('../navigation-core.js');
for(const query of ['campaign=aster&together=1','campaign=missing&discover=1','profile=1&discover=1','module=watch&together=1','campaignReport=aster&together=1'])assert.equal(socialRoute(new URLSearchParams(query)),null,query);
assert.equal(socialRoute(new URLSearchParams('together=1&discover=1')),'together');
