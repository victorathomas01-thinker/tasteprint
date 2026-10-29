// Local production-build preview and browser runner. Never publishes or deploys.
import { spawn, execFileSync } from 'node:child_process';
import {createServer} from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { stripVTControlCharacters } from 'node:util';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
const requestedSuite=process.argv.find(arg=>arg.startsWith('--suite='))?.slice(8);
if(requestedSuite&&!check)throw Error('Focused browser suites require --check.');
const configuredCatalog = process.argv.includes('--synthetic-catalog');
const configuredPlans = process.argv.includes('--synthetic-plans');
const configuredFriends = process.argv.includes('--synthetic-friends');
const configuredShortlists = process.argv.includes('--synthetic-shortlists');
if([configuredCatalog,configuredPlans,configuredFriends,configuredShortlists].filter(Boolean).length>1)throw Error('Choose one synthetic feature build.');
if ((configuredCatalog || configuredPlans || configuredFriends || configuredShortlists) && !check) throw Error('Synthetic private-social configuration is test-only; use --check.');
const base = process.argv.includes('--pages') ? '/tasteprint/' : '/';
let port = process.env.TASTEPRINT_REVIEW_PORT || '4193';
if(check&&!process.env.TASTEPRINT_REVIEW_PORT){
  const reservation=createServer();await new Promise((resolve,reject)=>{reservation.once('error',reject);reservation.listen(0,'127.0.0.1',resolve);});
  port=String(reservation.address().port);await new Promise(resolve=>reservation.close(resolve));
}
if (!/^\d{4,5}$/.test(port) || Number(port) > 65535) throw Error('Invalid review port');
const output = mkdtempSync(join(tmpdir(), 'tasteprint-review-'));
const vite = resolve(cwd, 'node_modules/vite/bin/vite.js');
// Environment values take priority over any ignored .env files. Review must stay local.
const env = { ...process.env, VITE_SHORTLIST_REQUIREMENTS_ENABLED: '', VITE_PRIVATE_PREFERENCES_ENABLED: '', VITE_REVIEWED_CATALOG_ENABLED: '', VITE_CATALOG_TEAM_ENABLED: '', VITE_PRIVATE_UPDATES_ENABLED: '', VITE_PRIVATE_REFLECTION_ENABLED: '', VITE_PRIVATE_SHORTLISTS_ENABLED: '', VITE_PRIVATE_FRIENDS_ENABLED: '', VITE_PRIVATE_PLANS_ENABLED: '', VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' };
if (configuredCatalog || configuredPlans || configuredFriends || configuredShortlists) Object.assign(env, {VITE_REVIEWED_CATALOG_ENABLED:configuredCatalog?'true':'',VITE_PRIVATE_PLANS_ENABLED:configuredPlans||configuredShortlists?'true':'', VITE_PRIVATE_FRIENDS_ENABLED:configuredFriends||configuredShortlists?'true':'', VITE_PRIVATE_SHORTLISTS_ENABLED:configuredShortlists?'true':'', VITE_SUPABASE_URL:'https://tasteprint-synthetic.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_test_only'});
let server;
function cleanup() { server?.kill('SIGTERM'); rmSync(output, { recursive: true, force: true }); }
process.on('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(0));
try {
  execFileSync(process.execPath, [vite, 'build', '--base', base, '--outDir', output], { cwd, env, stdio: 'inherit' });
  server = spawn(process.execPath, [vite, 'preview', '--base', base, '--outDir', output, '--host', '127.0.0.1', '--port', port, '--strictPort'], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverLog = '';
  server.stdout.on('data', data => { serverLog += data; process.stdout.write(data); });
  server.stderr.on('data', data => { serverLog += data; process.stdout.write(data); });
  const root = `http://127.0.0.1:${port}${base}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw Error(`Preview could not start: ${serverLog}`);
    if (!stripVTControlCharacters(serverLog).includes(root)) { await new Promise(resolve => setTimeout(resolve, 100)); continue; }
    try { ready = (await fetch(root)).ok; } catch (error) { if (error.cause?.message === 'bad port') throw Error('This preview port is blocked by the browser/fetch port policy. Choose another TASTEPRINT_REVIEW_PORT.'); }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw Error(`Local preview did not become ready: ${serverLog}`);
  console.log(`\nLOCAL REVIEW: ${root}\n${configuredCatalog ? 'Synthetic reviewed catalog build. Browser intercepts only public catalog requests; no project or deployment.' : configuredPlans || configuredFriends || configuredShortlists ? 'Synthetic configured private-social build. Browser intercepts all backend requests; no project or deployment.' : 'Backend disabled. No deployment. Use synthetic inputs only. Ctrl+C stops the preview.'}\n`);
  if (check) {
    const scripts = configuredCatalog ? ['published-catalog-configured'] : configuredShortlists ? ['shortlists-configured'] : configuredFriends ? ['friends-configured'] : configuredPlans ? ['plans-configured','sdk-failure-configured'] : ['legacy-module-routes','consumer-journeys','shortlist-requirements', 'preferences', 'catalog-team', 'updates', 'studio', 'saved', 'reflection', 'loading', 'hospitality', 'navigation', 'phase0', 'together', 'discovery', 'company', 'plans', 'catalog-editor', 'comparison', 'friends', 'shortlists'];
    const selected=requestedSuite?scripts.filter(name=>name===requestedSuite):scripts;
    if(!selected.length)throw Error('Unknown browser suite for this build mode.');
    for (const suite of selected) {
      const child = spawn(process.execPath, [`scripts/check-${suite}-browser.js`], { cwd, env: { ...env, TASTEPRINT_TEST_URL: root }, stdio: 'inherit' });
      const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
      if (code !== 0) throw Error(`${suite} browser checks failed (${code})`);
    }
  } else {
    await new Promise((resolve, reject) => { server.once('error', reject); server.once('exit', code => code ? reject(Error('Preview stopped unexpectedly')) : resolve()); });
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { cleanup(); }
