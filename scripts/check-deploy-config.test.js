import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDeploymentConfig } from './check-deploy-config.js';

const origin = { VITE_SUPABASE_URL: 'https://example.supabase.co' };
const token = (role) => 'header.' + Buffer.from(JSON.stringify({ role })).toString('base64url') + '.signature';

test('supports local-only and both public key formats', () => {
  assert.equal(validateDeploymentConfig({}), 'local-only');
  assert.equal(validateDeploymentConfig({ ...origin, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_demo' }), 'backend-enabled');
  assert.equal(validateDeploymentConfig({ ...origin, VITE_SUPABASE_ANON_KEY: token('anon') }), 'backend-enabled');
});

test('rejects partial config, private keys, and unsafe endpoints', () => {
  assert.throws(() => validateDeploymentConfig(origin), /both/);
  assert.throws(() => validateDeploymentConfig({
    ...origin,
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_demo',
    VITE_SUPABASE_ANON_KEY: token('service_role')
  }), /publishable key/);
  for (const key of ['sb_secret_example', token('service_role')]) {
    assert.throws(() => validateDeploymentConfig({ ...origin, VITE_SUPABASE_ANON_KEY: key }), /publishable key/);
  }
  assert.throws(() => validateDeploymentConfig({
    VITE_SUPABASE_URL: 'http://example.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_demo'
  }), /HTTPS/);
});
