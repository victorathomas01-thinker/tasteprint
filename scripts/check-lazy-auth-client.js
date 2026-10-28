import assert from 'node:assert/strict';
import {lazyAuthClient} from '../lazy-auth-client.js';
const gate=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
let imports=0,created=0,subscribed=0,removed=0,notify;
const sdk={auth:{getSession(){assert.equal(this,sdk.auth);return {data:{session:{user:{id:'synthetic'}}}};},signInWithOtp:value=>({data:value}),signOut:()=>({error:null}),onAuthStateChange(callback){subscribed++;notify=callback;return {data:{subscription:{unsubscribe(){removed++;}}}};}},rpc(...args){assert.equal(this,sdk);return {data:args};}};
const deferred=gate(),client=lazyAuthClient({loadSdk:()=>{imports++;return deferred.promise;},create:()=>{created++;return sdk;}});
assert.equal(imports,0,'import is optional and lazy');let events=[];const subscription=client.auth.onAuthStateChange((...args)=>events.push(args));const session=client.auth.getSession();deferred.resolve({});assert.equal((await session).data.session.user.id,'synthetic');assert.equal(imports,1);assert.equal(created,1);assert.equal(subscribed,1);
notify('SIGNED_IN',{user:{id:'synthetic'}});assert.equal(events.length,1);subscription.data.subscription.unsubscribe();notify('SIGNED_OUT',null);assert.equal(events.length,1);assert.equal(removed,1);assert.deepEqual((await client.rpc('synthetic_rpc',{value:1})).data,['synthetic_rpc',{value:1}]);await client.auth.signOut();await client.auth.signInWithOtp({email:'fixture@synthetic.invalid'});assert.equal(created,1);
const early=gate();let earlySubs=0;const cancelled=lazyAuthClient({loadSdk:()=>early.promise,create:()=>({...sdk,auth:{...sdk.auth,getSession:()=>({data:{session:null}}),onAuthStateChange(){earlySubs++;}}})});cancelled.auth.onAuthStateChange(()=>{}).data.subscription.unsubscribe();early.resolve({});await cancelled.auth.getSession();assert.equal(earlySubs,0,'unsubscribing before load must not install a late callback');
for(const failure of ['reject','timeout','constructor']){
 const late=gate();let factories=0;const failed=lazyAuthClient({timeoutMs:10,loadSdk:()=>failure==='reject'?Promise.reject(Error('private-provider-details')):failure==='timeout'?late.promise:{},create:()=>{factories++;throw Error('private-provider-details');}});
 const stopped=failed.auth.onAuthStateChange(()=>assert.fail('loader failure must not invent an Auth event'));stopped.data.subscription.unsubscribe();
 const result=await failed.auth.getSession();assert.equal(result.data.session,null);assert.match(result.error.message,/Reload to retry/);assert.ok(!result.error.message.includes('private-provider-details'));assert.ok((await failed.auth.signInWithOtp({})).error);assert.ok((await failed.rpc('never_sent')).error);
 if(failure==='timeout'){late.resolve({});await new Promise(r=>setTimeout(r,0));assert.equal(factories,0,'a timed-out SDK must not construct or refresh sessions later');}
}
console.log('Lazy Auth PASS: one real client, preserved SDK methods/events, early/late unsubscribe, bounded missing SDK, safe errors, no fabricated session/event or late constructor.');
