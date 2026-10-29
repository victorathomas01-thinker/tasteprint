// Reproduce CI's npm wrapper path; real Deno must stop, not just its wrapper.
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {startLocalDenoPublisher} from './local-deno-publisher.js';
const temp=await mkdtemp(join(tmpdir(),'tasteprint-deno-lifecycle-'));let runtime;
try{
 runtime=await startLocalDenoPublisher({root:new URL('../',import.meta.url).pathname,temp,environment:{SUPABASE_URL:'http://127.0.0.1:9',SUPABASE_ANON_KEY:'synthetic-public-only',SUPABASE_SERVICE_ROLE_KEY:'synthetic-private-only'}});
 const response=await fetch(runtime.target+'/functions/v1/publish-campaign',{method:'POST',body:'{}',signal:AbortSignal.timeout(2000)});assert.equal(response.status,401);
 const started=Date.now();await runtime.close();assert.ok(Date.now()-started<5000,'shutdown must finish within its explicit bound');await assert.rejects(fetch(runtime.target,{signal:AbortSignal.timeout(2000)}),'the actual serving process must be gone');
 console.log('Deno lifecycle PASS: actual binary selected through the npm wrapper, genuine 401 response, bounded shutdown and no surviving server. Synthetic loopback only.');
}finally{await runtime?.close();await rm(temp,{recursive:true,force:true});}
