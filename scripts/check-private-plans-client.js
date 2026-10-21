import assert from 'node:assert/strict';
import {privatePlansClient} from '../private-plans-client.js';
const id='11111111-1111-1111-1111-111111111111',token='a'.repeat(64),calls=[];
const session=async()=>({access_token:'synthetic-jwt',user:{id:'not-sent',email:'not-sent@example.invalid'}});
const request=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({state:'proposed'})};};
for(const url of ['http://remote.invalid','https://user:secret@synthetic.invalid','https://synthetic.invalid/?secret=value'])assert.throws(()=>privatePlansClient({url}),/approved HTTPS/);
const client=privatePlansClient({url:'https://synthetic.invalid',publicKey:'synthetic-public',getSession:session,request});
await client.create('Synthetic proposal','https://example.com');await client.accept(token);await client.respond(id,'interest',1);await client.deleteCreatedPlan(id);
assert.equal(calls.length,4);assert.ok(calls.every(call=>call.options.headers.Authorization==='Bearer synthetic-jwt'));
assert.equal(calls[1].url.includes(token),false);assert.deepEqual(JSON.parse(calls[1].options.body),{p_token:token});
assert.deepEqual(JSON.parse(calls[2].options.body),{p_plan_id:id,p_action:'interest',p_revision:1,p_details:null});assert.ok(calls.every(call=>!call.options.body.includes('not-sent')));
assert.throws(()=>client.accept('broken'));assert.throws(()=>client.respond('bad','interest',1));
const disabled=privatePlansClient({getSession:()=>{throw Error('must not read session')},request:()=>{throw Error('must not fetch')}});await assert.rejects(disabled.create('x'),/approved backend/);
const config={url:'https://synthetic.invalid',publicKey:'synthetic-public',getSession:session};
await assert.rejects(privatePlansClient({...config,getSession:async()=>null,request}).create('x'),/Sign in/);
await assert.rejects(privatePlansClient({...config,getSession:async()=>{throw Error(token)},request}).create('x'),error=>!error.message.includes(token)&&/Sign in/.test(error.message));
for(const status of [401,403,404,503])await assert.rejects(privatePlansClient({...config,request:async()=>({ok:false,status})}).create('x'),status===401?/Sign in again/:/No local response was substituted/);
await assert.rejects(privatePlansClient({...config,request:async()=>{throw Error(token)}}).accept(token),error=>!error.message.includes(token)&&/unavailable/.test(error.message));
await assert.rejects(privatePlansClient({...config,request:async()=>({ok:true,json:async()=>{throw Error('bad-json')}})}).create('x'),/invalid response/);
const reader=privatePlansClient({...config,request:async(url,options)=>{assert.equal(options.method,'GET');assert.equal(options.body,undefined);return{ok:true,json:async()=>[{id,state:'proposed',expires_at:'2000-01-01T00:00:00Z'}]};}});assert.equal((await reader.read(id)).state,'expired');
await assert.rejects(privatePlansClient({...config,request:async()=>({ok:true,json:async()=>[]})}).read(id),/unavailable/);
await assert.rejects(privatePlansClient({...config,timeoutMs:5,request:async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))))}).create('x'),/timed out/);
console.log('Private plan client PASS: disabled/Auth boundaries, bearer identity only, POST-body tokens, no local fallback, safe errors, expiry and bounded requests. Hosted Auth/PostgREST remains unverified.');
const reads=[];
const listing=privatePlansClient({...config,request:async(url,options)=>{reads.push({url,options});return {ok:true,json:async()=>url.includes('responses?')?[{actor_id:id,interest:'pending'}]:[{id,title:'Synthetic',state:'proposed',expires_at:'2000-01-01T00:00:00Z'}]};}});
assert.equal((await listing.list())[0].state,'expired');assert.equal((await listing.responses(id))[0].actor_id,id);
assert.ok(reads[0].url.includes('limit=50'));assert.ok(reads[1].url.includes('plan_id=eq.'+id));assert.ok(reads.every(row=>row.options.method==='GET'&&!row.options.body));
for(const method of ['list','responses'])await assert.rejects(privatePlansClient({...config,request:async()=>({ok:true,json:async()=>({unexpected:true})})})[method](id),/unavailable/);
console.log('Private plan reads PASS: bounded list, participant response query, expired display and invalid payload failures.');
const blockCalls=[];
const blocker=privatePlansClient({...config,getSession:async()=>({access_token:'synthetic',user:{id}}),request:async(url,options)=>{blockCalls.push({url,options});return {ok:true,status:201};}});
const otherId='22222222-2222-2222-2222-222222222222';await blocker.block(otherId);await blocker.unblock(otherId);
assert.deepEqual(JSON.parse(blockCalls[0].options.body),{blocker_id:id,blocked_id:otherId});assert.equal(blockCalls[1].options.method,'DELETE');assert.ok(blockCalls[1].url.endsWith('blocked_id=eq.'+otherId));await assert.rejects(blocker.block(id),/Invalid block/);
console.log('Private block transport PASS: Auth-derived blocker, self-block rejection and RLS-filtered removal.');

// A rendered account is bound before a write, even if Auth changes during session recovery.
let crossed=false;await assert.rejects(privatePlansClient({url:"https://synthetic.invalid",publicKey:"synthetic-public",getSession:async()=>({access_token:"new-jwt",user:{id:otherId}}),request:async()=>{crossed=true;}}).create("Old account proposal",null,{actor:id}),/Account changed/);assert.equal(crossed,false);

for(const [method,args] of [["create",["Old proposal",null]],["accept",[token]],["respond",[id,"interest",1,null]],["deleteCreatedPlan",[id]],["removeParticipation",[id]],["cleanupExpiredInvites",[]],["exportParticipation",[]],["list",[]],["read",[id]],["responses",[id]],["blocks",[]],["block",[otherId]],["unblock",[otherId]]]){let sent=false;const bound=privatePlansClient({url:"https://synthetic.invalid",publicKey:"synthetic-public",getSession:async()=>({access_token:"new-jwt",user:{id:otherId}}),request:async()=>{sent=true;}});await assert.rejects(bound[method](...args,{actor:id}),/Account changed/);assert.equal(sent,false,method+" must reject an account swap before sending");}
