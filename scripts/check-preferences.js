import assert from 'node:assert/strict';
import {privatePreferenceValue,privatePreferenceRecord} from '../preferences-core.js';
import {privatePreferencesClient} from '../preferences-client.js';
const value={version:1,liked:['art'],disliked:['coffee'],shared:[],saved:['synthetic-item'],dismissed:[]};
assert.deepEqual(privatePreferenceValue(value),value);
for(const invalid of [null,{}, {...value,email:'no'}, {...value,liked:['art','art']},{...value,shared:['coffee']},{...value,liked:['unknown']},{...value,saved:['<img>']},{...value,version:2}])assert.throws(()=>privatePreferenceValue(invalid));
assert.deepEqual(privatePreferenceRecord({revision:0,preferences:null,updated_at:null}),{revision:0,preferences:null,updated_at:null});
assert.throws(()=>privatePreferenceRecord({revision:-1,preferences:null,updated_at:null}));assert.throws(()=>privatePreferenceRecord({revision:0,preferences:value,updated_at:null}));
const actor='11111111-1111-4111-8111-111111111111',calls=[],row={revision:1,preferences:value,updated_at:'2026-10-26T12:00:00Z'};
const client=privatePreferencesClient({url:'https://synthetic.invalid',publicKey:'sb_publishable_synthetic',getSession:async()=>({user:{id:actor},access_token:'synthetic-jwt'}),request:async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify(row));}});
assert.deepEqual(await client.read({actor}),row);await client.write(0,value,{actor});assert.deepEqual(JSON.parse(calls[1].init.body),{p_expected_revision:0,p_preferences:value});assert.equal(calls[0].init.headers.Authorization,'Bearer synthetic-jwt');await assert.rejects(client.read({actor:'22222222-2222-4222-8222-222222222222'}));assert.equal(calls.length,2);await assert.rejects(client.write(1,{...value,email:'no'},{actor}));assert.equal(calls.length,2);
console.log('Private preferences PASS: strict private data shape, explicit versioned writes and per-request displayed-account authority.');

assert.throws(()=>privatePreferenceRecord({revision:1,preferences:value,updated_at:null}));

const {writeInterests,INTERESTS_KEY}=await import('../interests.js');
let raw='{"version":2,"future_field":"preserve"}';globalThis.localStorage={getItem:()=>raw,setItem(key,value){assert.equal(key,INTERESTS_KEY);raw=value;}};globalThis.window={dispatchEvent(){}};
for(const invalid of ['{"version":2,"future_field":"preserve"}','{unreadable']){raw=invalid;assert.equal(writeInterests(value),false);assert.equal(raw,invalid,'all interest writes must preserve unknown/unreadable local formats');}
raw=null;assert.equal(writeInterests(value),true);assert.deepEqual(JSON.parse(raw),value);
