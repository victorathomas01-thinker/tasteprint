import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const withoutImports = (source) => source.replace(/^import[\s\S]*?;\s*$/gm, '');
const team = '12345678-1234-1234-1234-123456789abc';
const validStats = { views: 14, result_matches: 8, cta_clicks: 3, item_clicks: {}, conversion_types: {} };

async function report({ query = `campaignReport=aster&workspace=${team}`, enabled = true, session = { access_token: 'test-session' }, fetcher = async () => ({ ok: true, json: async () => validStats }), campaign = null, events = [] } = {}) {
  const app = { innerHTML: '', querySelector: () => ({ addEventListener() {} }) };
  let localReads = 0;
  const calls = [];
  const context = vm.createContext({
    URL, location: { href: `https://example.test/?${query}` },
    document: { title: '', querySelector: () => app },
    window: { TasteprintAnalytics: { localEvents: () => { localReads++; return events; } } },
    getCampaign: () => campaign,
    SUPABASE_PUBLIC_ENABLED: enabled,
    supabasePublicURL: (path) => `https://project.supabase.co/${path}`,
    supabasePublicHeaders: (extra) => ({ apikey: 'public-test-key', ...extra }),
    currentSupabaseSession: async () => session,
    fetch: async (...args) => { calls.push(args); return fetcher(...args); }
  });
  const source = withoutImports(read('campaign-report.js')).replace(/\nrenderReport\(\);\s*$/, '');
  vm.runInContext(source, context);
  await vm.runInContext('renderReport()', context);
  return { html: app.innerHTML, localReads, calls };
}

const success = await report();
assert.match(success.calls[0][0], /rpc\/tasteprint_workspace_campaign_stats$/);
assert.deepEqual(JSON.parse(success.calls[0][1].body), { p_workspace_id: team, p_campaign_id: 'aster' });
assert.equal(success.calls[0][1].headers.Authorization, 'Bearer test-session');
assert.match(success.html, /Aggregate backend report/);
assert.equal(success.localReads, 0);

for (const options of [
  { fetcher: async () => ({ ok: false, status: 403 }) },
  { fetcher: async () => { throw new Error('network'); } },
  { fetcher: async () => ({ ok: true, json: async () => null }) },
  { fetcher: async () => ({ ok: true, json: async () => { throw new Error('bad JSON'); } }) },
  { session: null }, { query: 'campaignReport=aster' }, { enabled: false }
]) {
  const failed = await report(options);
  assert.match(failed.html, /Production report unavailable/);
  assert.match(failed.html, /id="retry-report"/);
  assert.doesNotMatch(failed.html, /Local browser demo|Campaign views/);
  assert.equal(failed.localReads, 0, 'production failures must never read local activity');
}
for (const options of [{ query: 'campaignReport=aster&demo=1' }, { query: 'campaignReport=aster', enabled: false }]) {
  const local = await report(options);
  assert.match(local.html, /Local browser demo/);
  assert.equal(local.calls.length, 0);
  assert.equal(local.localReads, 1);
}
const payload = '<img src=x onerror="bad()">';
const injectedId = await report({ query: `campaignReport=${encodeURIComponent(payload)}&demo=1` });
assert.doesNotMatch(injectedId.html, /<img/);
assert.match(injectedId.html, /&lt;img/);
const injectedFields = await report({
  campaign: { name: payload, catalog: [{ id: 'offer', name: payload }] },
  fetcher: async () => ({ ok: true, json: async () => ({ ...validStats, item_clicks: { offer: payload }, conversion_types: { [payload]: payload }, cta_rate: payload }) })
});
assert.doesNotMatch(injectedFields.html, /<img/);
assert.match(injectedFields.html, /&lt;img/);

async function config({ query = 'campaign=aster', remote = null } = {}) {
  const aster = JSON.parse(read('campaigns/aster.json'));
  const draft = { ...structuredClone(aster), localDraft: true, copy: { ...aster.copy, title: 'Saved edited title' } };
  const storage = new Map([['tasteprint.campaign-drafts.v1', JSON.stringify({ aster: draft })]]);
  const context = vm.createContext({
    URL, structuredClone, aster, window: {}, location: { href: `https://example.test/?${query}` },
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    REMOTE_CAMPAIGNS_ENABLED: true, fetchPublishedCampaign: async () => remote, fetchPublishedCampaignIndex: async () => []
  });
  const source = withoutImports(read('campaign-config.js')).replace(/^export /gm, '');
  return vm.runInContext(`(async () => { ${source}\n return { getCampaign, listCampaigns, deleteCampaignDraft }; })()`, context);
}
const preview = await config();
assert.equal(preview.getCampaign().copy.title, 'Saved edited title');
assert.equal(preview.listCampaigns().find((c) => c.id === 'aster').localDraft, true);
preview.deleteCampaignDraft('aster');
assert.equal(preview.getCampaign().copy.title, 'Find the escape you’d actually book.');
const publishedManifest = { id: 'aster', name: 'Published version', copy: { title: 'Published title' } };
const published = await config({ query: 'campaign=aster&published=1', remote: publishedManifest });
assert.equal(published.getCampaign().copy.title, 'Published title');
const unavailable = await config({ query: 'campaign=aster&published=1' });
assert.equal(unavailable.getCampaign(), null, 'a failed published lookup must not show a draft or bundled demo');

for (const query of ['campaign=missing', 'campaign=', 'campaign=aster&published=1', '']) {
  const app = { innerHTML: 'original quiz' };
  vm.runInNewContext(withoutImports(read('campaign-runtime.js')), {
    URL, location: { href: `https://example.test/?${query}` }, getCampaign: () => null,
    document: { title: '', querySelector: () => app }, window: {}
  });
  if (query) {
    assert.match(app.innerHTML, /data-campaign-unavailable/);
    assert.doesNotMatch(app.innerHTML, /data-action="start"/);
    assert.match(app.innerHTML, /href="\?"/);
  } else assert.equal(app.innerHTML, 'original quiz', 'ordinary Escape entry stays available');
}
console.log('Campaign regressions OK — authenticated reporting, explicit errors, HTML escaping, draft/published precedence and unavailable campaigns.');
