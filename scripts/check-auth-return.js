import assert from 'node:assert/strict';
import {failedAuthReturn,authReturnNotice,AUTH_RETURN_MESSAGE} from '../auth-return-core.js';
for(const base of ['/','/tasteprint/']){
 const origin='https://synthetic.invalid'+base;
 for(const route of ['profile','workspace']){
  const failed=origin+'?'+route+'=1&auth=return&workspaceInvite=synthetic-invite#access_token=synthetic-private&refresh_token=synthetic-refresh&error=access_denied&error_description=%3Cimg%20onerror%3Dalert(1)%3E&error_code=otp_expired';
  const clean=new URL(failedAuthReturn(failed));assert.equal(clean.pathname,base);assert.equal(clean.hash,'');assert.equal(clean.searchParams.get('workspaceInvite'),route==='workspace'?null:'synthetic-invite');assert.equal(clean.searchParams.get(route),'1');assert.ok(!clean.href.includes('synthetic-private'));assert.ok(!clean.href.includes('error'));
  const query=new URL(failedAuthReturn(origin+'?'+route+'=1&auth=return&error=invalid&code=synthetic-private#section'));assert.equal(query.hash,'#section');assert.equal(query.searchParams.has('code'),false);
  const fragment=new URL(failedAuthReturn(origin+'?'+route+'=1&auth=return#error_code=otp_expired&invite=synthetic-social'));assert.equal(fragment.hash,'#invite=synthetic-social');
  assert.equal(failedAuthReturn(origin+'?'+route+'=1&auth=return#access_token=synthetic-private&refresh_token=synthetic-refresh'),null,'successful callback belongs to SDK');
  assert.equal(failedAuthReturn(origin+'?'+route+'=1&auth=return&code=synthetic-private'),null,'successful PKCE code belongs to SDK');
 }
 for(const suffix of ['?profile=1#error=unrelated','?together=1&auth=return#error=unrelated','?workspace=1&auth=return#invite=synthetic-social','?campaign=aster#error=unrelated'])assert.equal(failedAuthReturn(origin+suffix),null);
}
assert.equal(authReturnNotice(false),'');assert.ok(authReturnNotice(true).includes(AUTH_RETURN_MESSAGE));assert.ok(!authReturnNotice(true).includes('<img'));assert.ok(authReturnNotice(true).includes('role="alert"'));
console.log('Auth return PASS: failed return only, safe fixed notice, root/Pages paths, credential/error scrubbing, failed team-claim prevention, preserved unrelated invites/anchors and untouched successful implicit/PKCE callbacks.');
