import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
import {authenticatedSocialRequest} from '../social-request.js';import * as core from '../workspace-core.js';
const source=await readFile(new URL('../studio-workspace-bridge.js',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',team='33333333-3333-4333-8333-333333333333';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};let current={user:{id:A},access_token:'token-A'},handler=async()=>null,calls=[],copied=[],populated=[],statuses=[];
const manifest={id:'synthetic-draft',name:'Synthetic draft',catalog:[]};
const record=(version=1)=>({manifest,workspace_id:team,campaign_id:manifest.id,version});let fingerprint='unchanged',local=null;
const context=vm.createContext({...core,URL,structuredClone,setTimeout,clearTimeout,session:current,role:'editor',generation:0,studioRevision:0,studioBusy:null,bridgeMessage:'',bridgeKind:'',ADMIN_MODE:true,DEMO_WORKSPACE:false,VALID_WORKSPACE:true,WORKSPACE_ID:team,HOSTED_CAMPAIGN:manifest.id,loadedHosted:false,initialEditorFingerprint:null,hostedVersions:new Map(),injected:false,client:{},window:{TasteprintStudio:{load(value){populated.push(value);return true;}}},document:{querySelector:()=>null},currentManifest:()=>manifest,validateManifest:()=>[],reviewCampaignExperience:()=>({blocking:[]}),setBridgeStatus:(value)=>statuses.push(value),refreshExperience(){},refreshTeamControls(){},formValue:()=>manifest.id,getCampaign:()=>local,saveCampaignDraft(value){copied.push(value);return {ok:true};},formFingerprint:()=>fingerprint});
context.send=authenticatedSocialRequest({url:'https://synthetic.invalid',publicKey:'public',getSession:async()=>current,label:'Studio requests',request:async(url,options)=>{calls.push({url,options});const result=await handler(url,options);return {ok:true,status:200,json:async()=>result};}});
const op=source.slice(source.indexOf('function studioOperation()'),source.indexOf('function formFingerprint()'));
const methods=source.slice(source.indexOf('async function loadHostedCampaign('),source.indexOf('\nfunction inject()'));
const lifecycle=source.slice(source.indexOf('async function loadStudioRole('),source.indexOf('\nif (ADMIN_MODE) {'));
vm.runInContext(op+methods+lifecycle,context);
// Refreshing the same actor must preserve role and in-progress local work.
const initialGeneration=context.generation;context.studioAuthChanged('TOKEN_REFRESHED',current);assert.equal(context.generation,initialGeneration);assert.equal(context.role,'editor');
// Delayed cloud data may neither replace the editor nor write local storage after account switch.
let gate=deferred();handler=()=>gate.promise;const old=vm.runInContext('loadHostedCampaign()',context);await new Promise(r=>setTimeout(r,0));current=null;context.studioAuthChanged('SIGNED_OUT',null);gate.resolve([record()]);await old;assert.equal(populated.length,0);assert.equal(copied.length,0);assert.equal(context.role,null);
// Read was authorized, but user edited while it loaded: preserve those edits.
current={user:{id:A},access_token:'token-A'};context.session=current;context.role='editor';context.loadedHosted=false;gate=deferred();handler=()=>gate.promise;const loading=vm.runInContext('loadHostedCampaign()',context);await new Promise(r=>setTimeout(r,0));fingerprint='new local edits';gate.resolve([record()]);await loading;assert.equal(populated.length,0);assert.match(statuses.at(-1),/local edits were kept/);
// Existing saved local draft wins until deliberate team reload; no storage overwrite.
context.loadedHosted=false;local={...manifest,name:'Existing local work',localDraft:true};const before=calls.length;await vm.runInContext('loadHostedCampaign()',context);assert.equal(calls.length,before);assert.equal(populated.at(-1).name,'Existing local work');assert.equal(copied.length,0);
// Typing before the initial role lookup finishes must also prevent automatic replacement.
context.loadedHosted=false;context.initialEditorFingerprint='startup form';fingerprint='typed before role lookup';local=null;const beforeInitial=calls.length;await vm.runInContext('loadHostedCampaign()',context);assert.equal(calls.length,beforeInitial);context.initialEditorFingerprint=null;
// The new-editor load action explains a missing ID without fetching or changing work.
const idBeforeEmpty=manifest.id,emptyCalls=calls.length;manifest.id='';await vm.runInContext('loadHostedCampaign(studioOperation(),true)',context);manifest.id=idBeforeEmpty;assert.equal(calls.length,emptyCalls);assert.match(statuses.at(-1),/Enter a campaign ID/);
// An existing team record is never overwritten when its version was not reviewed.
local=null;handler=async()=>[record()];const unknownBefore=calls.length;assert.equal(await vm.runInContext('saveToWorkspace()',context),false);assert.equal(calls.length,unknownBefore+1);assert.equal(calls.at(-1).options.method,'GET');assert.match(statuses.at(-1),/already exists/);assert.equal(copied.length,0);
// Deliberate load establishes the version for the visible form, not a local draft.
assert.equal(context.hostedVersions.size,0);await vm.runInContext('loadHostedCampaign(studioOperation(),true)',context);assert.equal(context.hostedVersions.get(manifest.id),1);
handler=async()=>[record(2)];assert.equal(await vm.runInContext('saveToWorkspace()',context),true);const body=JSON.parse(calls.at(-1).options.body);assert.ok(!('created_by'in body));assert.equal(body.updated_by,A);assert.equal(calls.at(-1).options.method,'PATCH');assert.match(calls.at(-1).url,/version=eq\.1/);assert.equal(body.version,2);assert.equal(copied.length,1);assert.equal(context.hostedVersions.get(manifest.id),2);
// A zero-row conditional response is a conflict, never a success/local overwrite.
handler=async()=>[];assert.equal(await vm.runInContext('saveToWorkspace()',context),false);assert.equal(copied.length,1);assert.equal(context.hostedVersions.get(manifest.id),2);assert.match(statuses.at(-1),/changed or was removed/);
// A team acknowledgement cannot overwrite a local save made while the upload was pending.
gate=deferred();handler=()=>gate.promise;const editing=vm.runInContext('saveToWorkspace()',context);await new Promise(r=>setTimeout(r,0));local={...manifest,name:'Newer saved local work',localDraft:true};gate.resolve([record(3)]);assert.equal(await editing,true);assert.equal(copied.length,1);assert.match(statuses.at(-1),/newer local edits were kept/);local=null;
// A new ID uses a separate insert, never a conflict-upsert that can replace a racer.
const originalId=manifest.id;manifest.id='synthetic-new';let writes=0;handler=async(_url,options)=>{if(options.method==='GET')return [];writes++;assert.equal(options.method,'POST');assert.ok(!/on_conflict/.test(_url));assert.ok(!/merge-duplicates/.test(options.headers.Prefer));return [record(1)];};assert.equal(await vm.runInContext('saveToWorkspace()',context),true);assert.equal(writes,1);assert.equal(context.hostedVersions.get(manifest.id),1);assert.equal(copied.length,2);manifest.id=originalId;
// Malformed or wrong-scope acknowledgements cannot copy local drafts or advance versions.
handler=async()=>[{...record(4),workspace_id:B}];await assert.rejects(vm.runInContext('saveToWorkspace()',context),/acknowledgement/);assert.equal(context.hostedVersions.get(manifest.id),3);assert.equal(copied.length,2);
// Wrong SDK actor must not dispatch a save, and late save success must not copy to another local actor.
current={user:{id:B},access_token:'token-B'};const count=calls.length;await assert.rejects(vm.runInContext('saveToWorkspace()',context),/Account changed/);assert.equal(calls.length,count);
current={user:{id:A},access_token:'token-A'};gate=deferred();handler=()=>gate.promise;const saving=vm.runInContext('saveToWorkspace()',context);await new Promise(r=>setTimeout(r,0));current=null;context.studioAuthChanged('SIGNED_OUT',null);gate.resolve(null);await assert.rejects(saving,/Account changed/);assert.equal(copied.length,2);assert.equal(context.hostedVersions.size,0);
console.log('Studio isolation PASS: stale cloud read/save, preserved typing and saved local drafts, conditional revisions/conflict preservation, insert-only new IDs, strict acknowledgements, actor-bound writes, immutable creator omission and no late local copy. Actual source with synthetic boundaries.');

// Exercise the real publishing module and its complete wire endpoint, including legacy compatibility.
let publishingCurrent={user:{id:A},access_token:'token-A'},scopeCurrent=true,publishCalls=[];
const originalFetch=globalThis.fetch,originalLocation=globalThis.location;
globalThis.__publishingSession=()=>publishingCurrent;globalThis.location={href:'https://review.invalid/?campaignAdmin=1&workspace='+team};
let publishHandler=async()=>({ok:true,status:200,json:async()=>({version:1})});
globalThis.fetch=async(url,options)=>{publishCalls.push({url,options});return publishHandler(url,options);};
try{
 let registry=await readFile(new URL('../campaign-remote.js',import.meta.url),'utf8');
 registry=registry.replace("'./social-request.js'",JSON.stringify(new URL('../social-request.js',import.meta.url).href));
 registry=registry.replace(/import\s*\{\s*currentSupabaseSession\s*\}\s*from '\.\/supabase-auth.js';/,"const currentSupabaseSession=()=>globalThis.__publishingSession();");
 registry=registry.replace(/import\s*\{\s*SUPABASE_PUBLIC_ENABLED,[\s\S]*?from '\.\/supabase-public.js';/,"const SUPABASE_PUBLIC_ENABLED=true,SUPABASE_URL='https://synthetic.invalid',SUPABASE_PUBLIC_KEY='public';const supabasePublicURL=path=>SUPABASE_URL+'/'+path;const supabasePublicHeaders=()=>({});");
 const publishing=await import('data:text/javascript;base64,'+Buffer.from(registry).toString('base64'));
 const binding={actor:A,current:()=>scopeCurrent};assert.equal((await publishing.publishCampaign(manifest,'legacy-ignored-do-not-send',binding)).ok,true);assert.equal(publishCalls[0].url,'https://synthetic.invalid/functions/v1/publish-campaign');assert.equal(publishCalls[0].options.headers.Authorization,'Bearer token-A');assert.equal(JSON.parse(publishCalls[0].options.body).workspace_id,team);assert.ok(!publishCalls[0].options.body.includes('legacy-ignored'));
 publishingCurrent={user:{id:B},access_token:'token-B'};const before=publishCalls.length;assert.equal((await publishing.unpublishCampaign(manifest.id,'',binding)).ok,false);assert.equal(publishCalls.length,before);
 publishingCurrent={user:{id:A},access_token:'token-A'};gate=deferred();publishHandler=()=>gate.promise;const result=publishing.unpublishCampaign(manifest.id,'',binding);await new Promise(r=>setTimeout(r,0));scopeCurrent=false;gate.resolve({ok:true,status:200,json:async()=>({})});assert.equal((await result).ok,false,'late publication acknowledgement cannot be confirmed under another actor');
 scopeCurrent=true;publishHandler=async()=>({ok:false,status:400,json:async()=>({error:'synthetic-private-backend-content'})});assert.ok(!(await publishing.publishCampaign(manifest,'',binding)).error.includes('synthetic-private-backend-content'));
 console.log('Publishing boundary PASS: complete functions endpoint, bearer/tenant payload, ignored legacy token, actor-switch refusal and no late success or private error-body disclosure.');
}finally{globalThis.fetch=originalFetch;globalThis.location=originalLocation;delete globalThis.__publishingSession;}
