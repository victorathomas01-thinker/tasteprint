// Local production-build preview and browser runner. Never publishes or deploys.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { stripVTControlCharacters } from 'node:util';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
const configuredPlans = process.argv.includes('--synthetic-plans');
const configuredFriends = process.argv.includes('--synthetic-friends');
if(configuredPlans&&configuredFriends)throw Error('Choose one synthetic feature build.');
if ((configuredPlans || configuredFriends) && !check) throw Error('Synthetic private-social configuration is test-only; use --check.');
const base = process.argv.includes('--pages') ? '/tasteprint/' : '/';
const port = process.env.TASTEPRINT_REVIEW_PORT || (configuredPlans ? '4225' : check ? '4191' : '4193');
if (!/^\d{4,5}$/.test(port) || Number(port) > 65535) throw Error('Invalid review port');
const output = mkdtempSync(join(tmpdir(), 'tasteprint-review-'));
const vite = resolve(cwd, 'node_modules/vite/bin/vite.js');
// Environment values take priority over any ignored .env files. Review must stay local.
const env = { ...process.env, VITE_PRIVATE_FRIENDS_ENABLED: '', VITE_PRIVATE_PLANS_ENABLED: '', VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' };
if (configuredPlans || configuredFriends) Object.assign(env, {VITE_PRIVATE_PLANS_ENABLED:configuredPlans?'true':'', VITE_PRIVATE_FRIENDS_ENABLED:configuredFriends?'true':'', VITE_SUPABASE_URL:'https://tasteprint-synthetic.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_test_only'});
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
  console.log(`\nLOCAL REVIEW: ${root}\n${configuredPlans || configuredFriends ? 'Synthetic configured private-social build. Browser intercepts all backend requests; no project or deployment.' : 'Backend disabled. No deployment. Use synthetic inputs only. Ctrl+C stops the preview.'}\n`);
  if (check) {
    const scripts = configuredFriends ? ['friends-configured'] : configuredPlans ? ['plans-configured'] : ['hospitality', 'navigation', 'phase0', 'together', 'discovery', 'company', 'plans', 'catalog-editor', 'comparison', 'friends'];
    for (const suite of scripts) {
      const child = spawn(process.execPath, [`scripts/check-${suite}-browser.js`], { cwd, env: { ...env, TASTEPRINT_TEST_URL: root }, stdio: 'inherit' });
      const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
      if (code !== 0) throw Error(`${suite} browser checks failed (${code})`);
    }
  } else {
    await new Promise((resolve, reject) => { server.once('error', reject); server.once('exit', code => code ? reject(Error('Preview stopped unexpectedly')) : resolve()); });
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { cleanup(); }
