import assert from 'node:assert/strict';
import {validatePublicBuildConfig as validate} from './public-build-config.js';
const legacy=role=>['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({role})).toString('base64url'),'synthetic'].join('.');
assert.equal(validate({}).VITE_SUPABASE_URL,'');
const valid={VITE_SUPABASE_URL:'https://synthetic.invalid',VITE_SUPABASE_ANON_KEY:'sb_publishable_synthetic_test_only'};
assert.deepEqual(validate(valid),validate({...valid,VITE_PRIVATE_PLANS_ENABLED:''}));
for(const key of ['sb_publishable_synthetic_test_only',legacy('anon')])assert.equal(validate({...valid,VITE_SUPABASE_ANON_KEY:key}).VITE_SUPABASE_ANON_KEY,key);
for(const env of [
 {VITE_SUPABASE_SERVICE_ROLE_KEY:'synthetic-private-value'},
 {...valid,VITE_SUPABASE_ANON_KEY:'sb_secret_synthetic-private-value'},
 {...valid,VITE_SUPABASE_ANON_KEY:legacy('service_role')},
 {...valid,VITE_SUPABASE_ANON_KEY:legacy('service_role'),VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_safe'},
 {...valid,VITE_SUPABASE_URL:'http://remote.invalid'},
 {...valid,VITE_SUPABASE_URL:'https://synthetic.invalid?secret=value'},
 {...valid,VITE_SUPABASE_URL:'https://user:password@synthetic.invalid'},
 {...valid,VITE_SUPABASE_URL:'https://synthetic.invalid/path'},
 {...valid,VITE_PRIVATE_PLANS_ENABLED:'yes'},
 {VITE_PRIVATE_PLANS_ENABLED:'true'},
 {...valid,VITE_PRIVATE_REFLECTION_ENABLED:'true'},
 {...valid,VITE_PRIVATE_UPDATES_ENABLED:'true'},
 {...valid,VITE_PRIVATE_SHORTLISTS_ENABLED:'true'},
 {...valid,VITE_SUPABASE_ANON_KEY:'YOUR_PUBLIC_KEY'},
 {VITE_SUPABASE_URL:'https://synthetic.invalid'},
 {...valid,VITE_TASTEPRINT_PUBLISH_TOKEN:'synthetic-private-value'}
]){assert.throws(()=>validate(env),error=>/public build configuration/.test(error.message)&&!error.message.includes('synthetic-private-value'));}
assert.equal(validate({...valid,VITE_SUPABASE_ANON_KEY:legacy('anon'),VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_another'}).VITE_SUPABASE_PUBLISHABLE_KEY,'sb_publishable_another');
for(const url of ['http://127.0.0.1:4000','http://localhost:4000','http://[::1]:4000','https://synthetic.invalid/'])assert.equal(validate({...valid,VITE_SUPABASE_URL:url}).VITE_SUPABASE_URL,url);
assert.equal(validate({...valid,VITE_PRIVATE_SHORTLISTS_ENABLED:'true',VITE_PRIVATE_FRIENDS_ENABLED:'true',VITE_PRIVATE_PLANS_ENABLED:'true'}).VITE_PRIVATE_SHORTLISTS_ENABLED,'true');
console.log('Public configuration PASS: public-only allowlist, secret/service-role refusal, safe URL/key/flag combinations and no credential values in errors.');

assert.equal(validate({...valid,VITE_PRIVATE_UPDATES_ENABLED:'true',VITE_PRIVATE_FRIENDS_ENABLED:'true',VITE_PRIVATE_PLANS_ENABLED:'true'}).VITE_PRIVATE_UPDATES_ENABLED,'true');
