// Execute the actual TypeScript handler with injected Deno/SDK boundaries.
// This is NOT hosted Edge/Deno runtime evidence; SQL runs separately in real PG.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const team='33333333-3333-4333-8333-333333333333',actor='00000000-0000-0000-0000-000000000001';
const manifest={id:'synthetic-publication',name:'Synthetic campaign',copy:{title:'Synthetic title',lede:'Synthetic description'},catalog:[{id:'synthetic-option',name:'Synthetic option',description:'Synthetic only',modes:['relax'],href:'https://example.invalid/option'}]};
let handler,role='owner',authError=false,rpcError=null,calls=[];
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'synthetic-public-key',SUPABASE_SERVICE_ROLE_KEY:'synthetic-private-test-only'};
const originalDeno=globalThis.Deno;
globalThis.Deno={env:{get:name=>env[name]},serve:fn=>{handler=fn;}};
globalThis.__edgeClient=()=>({auth:{getUser:async()=>({data:authError?null:{user:{id:actor}},error:authError?{message:'synthetic private Auth detail'}:null})},from:table=>{assert.equal(table,'tasteprint_workspace_members');const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:role?{role}:null,error:null})};return query;},rpc:async(name,body)=>{assert.equal(name,'tasteprint_commit_campaign_publication');calls.push(body);return {data:{campaign_id:body.p_campaign_id,status:body.p_action==='publish'?'published':'archived',version:1},error:rpcError};}});
async function send(body,{method='POST',origin='http://localhost:5173',authorization='Bearer synthetic-session'}={}){
 return handler(new Request('https://synthetic.invalid/functions/v1/publish-campaign',{method,headers:{origin,authorization,'Content-Type':'application/json'},...(!['GET','OPTIONS'].includes(method)?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}));
}
try{
 const raw=await readFile(new URL('../supabase/functions/publish-campaign/index.ts',import.meta.url),'utf8');
 const code=stripTypeScriptTypes(raw.replace(/^import .*?;\n/, 'const createClient=(...args)=>globalThis.__edgeClient(...args);\n'));
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 assert.equal((await send({}, {method:'GET'})).status,405);assert.equal((await send({}, {method:'OPTIONS'})).status,200);
 assert.equal((await send({}, {origin:'https://unapproved.invalid'})).status,403);
 assert.equal((await send({}, {authorization:''})).status,401);
 authError=true;assert.equal((await send({})).status,401);authError=false;
 assert.equal((await send('{invalid')).status,400);assert.equal((await send({workspace_id:'bad'})).status,400);
 for(const denied of ['editor','analyst','viewer',null]){role=denied;assert.equal((await send({workspace_id:team,action:'publish',manifest})).status,403);}role='owner';
 for(const catalog of [{},'invalid',42,null,[]]){assert.equal((await send({workspace_id:team,action:'publish',manifest:{...manifest,catalog}})).status,400,'malformed catalogs must return a controlled error, never throw');}
 assert.equal(calls.length,0,'rejected requests cannot write');
 const response=await send({workspace_id:team,action:'publish',actor:'forged',manifest:{...manifest,localDraft:true,published:true,owner:'untrusted'}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(calls[0].p_actor,actor,'only the verified Auth user is the server actor');assert.equal(calls[0].p_workspace_id,team);assert.deepEqual(calls[0].p_manifest,manifest);
 assert.equal((await send({workspace_id:team,action:'unpublish',campaign_id:manifest.id})).status,200);assert.equal(calls.at(-1).p_manifest,null);
 for(const [code,status] of [['23505',409],['40001',409],['42501',403],['22023',400],['XX000',503]]){rpcError={code,message:'synthetic-private-database-detail'};const r=await send({workspace_id:team,action:'publish',manifest});assert.equal(r.status,status);assert.ok(!(await r.text()).includes(rpcError.message));}
 console.log('Publication handler PASS: real TypeScript source, safe malformed catalogs, Auth/role/origin gates, verified actor, stripped transient fields, single atomic RPC and sanitized conflict/failure responses. Injected runtime/SDK; actual Deno/hosted execution unverified.');
}finally{globalThis.Deno=originalDeno;delete globalThis.__edgeClient;}
