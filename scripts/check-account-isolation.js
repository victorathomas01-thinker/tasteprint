import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { authenticatedSocialRequest } from '../social-request.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const pause=()=>new Promise(r=>setTimeout(r,0));
// Auth recovery and JSON parsing are part of the deadline, including non-abortable providers.
for(const stage of ['auth','json']){
 const gate=deferred();let requests=0;
 const send=authenticatedSocialRequest({url:'https://synthetic.invalid',publicKey:'public',timeoutMs:15,getSession:()=>stage==='auth'?gate.promise:{access_token:'synthetic',user:{id:'A'}},request:async()=>{requests++;return {ok:true,json:()=>gate.promise};}});
 await assert.rejects(send('rpc/example'),/timed out/);
 gate.resolve(stage==='auth'?{access_token:'late',user:{id:'A'}}:{});await pause();
 assert.equal(requests,stage==='auth'?0:1,'late Auth must not issue a request after its deadline');
}
let callback,current={user:{id:'A'},access_token:'token-A'},calls=[],history=[],cleared=0,reloaded=0,init=deferred(),signouts=0;
const client={auth:{getSession:async()=>init?init.promise:{data:{session:current}},onAuthStateChange(fn){callback=fn;},async signOut(){signouts++;current=null;callback('SIGNED_OUT',null);return {};}}};
globalThis.__accountTestClient=client;
globalThis.window={TasteprintPassport:{history:()=>structuredClone(history),replaceHistory(value){history=structuredClone(value);},clear(){history=[];cleared++;}},dispatchEvent(){},addEventListener(){}};
globalThis.location={href:'http://localhost/?friends=1',reload(){reloaded++;}};
globalThis.document={querySelector(){return null;}};
globalThis.MutationObserver=class{observe(){}};
globalThis.CustomEvent=class{};
globalThis.localStorage={removeItem(){}};
let handler=async()=>({ok:true,status:200,json:async()=>[]});
globalThis.fetch=async(url,options)=>{calls.push({url,options});return handler(url,options);};
let source=await fs.readFile(new URL('../account-sync.js',import.meta.url),'utf8');
source=source.replace("'./auth-return-core.js'",JSON.stringify(new URL('../auth-return-core.js',import.meta.url).href));
source=source.replace("'./auth-session-core.js'",JSON.stringify(new URL('../auth-session-core.js',import.meta.url).href));
source=source.replace("'./account-core.js'",JSON.stringify(new URL('../account-core.js',import.meta.url).href)).replace("'./social-request.js'",JSON.stringify(new URL('../social-request.js',import.meta.url).href));
source=source.replace(/import\s*\{\s*AUTH_STORAGE_KEY,[\s\S]*?from '\.\/supabase-auth.js';/,"const AUTH_STORAGE_KEY='synthetic.auth';const AUTH_RETURN_FAILED=false;const client=globalThis.__accountTestClient;");
source=source.replace(/import\s*\{\s*SUPABASE_PUBLIC_ENABLED[\s\S]*?from '\.\/supabase-public.js';/,"const REMOTE_ENABLED=true,SUPABASE_PUBLIC_KEY='public',SUPABASE_PUBLIC_URL='https://synthetic.invalid';");
const runtime=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const account=window.TasteprintAccount;
// Register before recovery; an old recovery result must not replace a newer Auth event.
current={user:{id:'B'},access_token:'token-B'};callback('SIGNED_IN',current);init.resolve({data:{session:{user:{id:'A'},access_token:'old-A'}}});init=null;await pause();assert.equal(account.user().id,'B');
await new Promise(r=>setTimeout(r,730));assert.equal(calls.length,0,'private social routes must not automatically call Passport endpoints');
const switchTo=id=>{current={user:{id},access_token:`token-${id}`};callback('SIGNED_IN',current);};
// Delayed sync cannot upload A data as B or change B local history.
switchTo('A');let gate=deferred();handler=()=>gate.promise;const pending=runtime.syncPassport();await pause();switchTo('B');const before=calls.length;gate.resolve({ok:true,status:200,json:async()=>[]});await pending;assert.equal(calls.length,before);assert.equal(account.user().id,'B');
// A clear finishing after account switch cannot erase the new account's browser data.
switchTo('A');gate=deferred();handler=()=>gate.promise;const clearing=runtime.clearSyncedPassport();await pause();switchTo('B');gate.resolve({ok:true,status:204});assert.equal(await clearing,false);assert.equal(cleared,0);
// Account deletion completion cannot clear or sign out a subsequently selected account.
switchTo('A');gate=deferred();handler=()=>gate.promise;const deleting=runtime.deleteAccount();await pause();switchTo('B');gate.resolve({ok:true,status:204});assert.equal(await deleting,false);assert.equal(cleared,0);assert.equal(signouts,0);assert.equal(reloaded,0);
// A new quiz result during upload is retained in the local merge.
const snapshot=(id)=>({version:1,module_id:id,created_at:'2026-10-21T00:00:00.000Z',source:'quiz',signature:id,module_scores:{novelty:50},master_scores:{novelty:50},archetype:'Synthetic',mode:'test'});
switchTo('A');history=[snapshot('escape')];gate=deferred();handler=async(url)=>url.includes('on_conflict')?gate.promise:{ok:true,status:200,json:async()=>[]};const merging=runtime.syncPassport();await pause();history.push(snapshot('wear'));gate.resolve({ok:true,status:204});await merging;assert.equal(history.length,2);assert.deepEqual(history.map(x=>x.module_id).sort(),['escape','wear']);
// A destructive action waits for the dispatched upload and prevents a concurrent merge.
gate=deferred();handler=async(url)=>url.includes('on_conflict')?gate.promise:{ok:true,status:200,json:async()=>[]};
const uploading=runtime.syncPassport();await pause();const countBeforeClear=calls.length;
const serialClear=runtime.clearSyncedPassport();await pause();assert.equal(calls.length,countBeforeClear,'clear must wait for the already dispatched upload');
assert.equal(await runtime.syncPassport(),null,'no merge may start during deletion');gate.resolve({ok:true,status:204});await uploading;assert.equal(await serialClear,true);assert.equal(cleared,1);assert.match(calls.at(-1).options.method,/DELETE/);
history=[snapshot('wear')];
// Failed deletion retains local data; ownership refusal is actionable without leaking a backend body.
handler=async()=>({ok:false,status:409,json:async()=>({error:'workspace_ownership_exists',message:'private backend content'})});assert.equal(await runtime.deleteAccount(),false);assert.equal(cleared,1);assert.match(account.state().message,/Workspace/);assert.ok(!account.state().message.includes('private backend'));
assert.ok(calls.every(({options})=>options.headers.Authorization==='Bearer token-A'));
console.log('Account isolation PASS: stale recovery, whole-request deadlines, no late Auth requests, account-switch sync/clear/delete, new local results, private-route purpose separation and safe refusal.');
