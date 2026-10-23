// Execute actual Workspace functions with a synthetic SDK lock and controlled REST replies.
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';
import * as core from '../workspace-core.js';import {authenticatedSocialRequest} from '../social-request.js';
const source=await fs.readFile(new URL('../workspace.js',import.meta.url),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const tick=()=>new Promise(r=>setTimeout(r,0));
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',team='33333333-3333-4333-8333-333333333333';
let current={user:{id:A},access_token:'token-A'},inCallback=false,calls=[],handler=async()=>[];
const app={innerHTML:'',querySelector(){return {addEventListener(){}};}};
const context=vm.createContext({...core,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,structuredClone,location:{href:'https://synthetic.invalid/?workspace=1',reload(){}},history:{replaceState(){}},document:{querySelector:()=>app,querySelectorAll:()=>[]},client:{auth:{}},recoverAuthSession:async()=>current,authenticatedSocialRequest,session:null,workspaces:[],selectedWorkspace:null,campaigns:[],members:[],status:'',inviteURL:'',generation:0,authRevision:0,sessionInitialized:false,subscribed:false,busyOperation:null,params:new URLSearchParams('workspace=1'),WORKSPACE_MODE:true,REMOTE_ENABLED:true});
const send=authenticatedSocialRequest({url:'https://synthetic.invalid',publicKey:'public',getSession:async()=>current,label:'Workspace requests',request:async(url,options)=>{assert.equal(inCallback,false,'no request may run under the Auth callback lock');calls.push({url,options});const data=await handler(url,options);return {ok:true,status:200,json:async()=>data};}});context.send=send;
const helpers=source.slice(source.indexOf('function operation()'),source.indexOf('function readDemoRole()'));
const loads=source.slice(source.indexOf('async function loadContext('),source.indexOf('function renderAuthState()'));
const lifecycle=source.slice(source.indexOf('async function refreshContext('),source.indexOf('async function initialize()'));
const invitation=source.slice(source.indexOf('async function acceptInviteIfPresent('),source.indexOf('async function loadContext('));
vm.runInContext(helpers+invitation+loads+lifecycle,context);
vm.runInContext('renderAuthState=()=>{document.querySelector().innerHTML=session?.user?"current-account":"signed-out";};',context);
const emit=(event,session)=>{current=session;inCallback=true;const value=context.authChanged(event,session);inCallback=false;assert.equal(value,undefined,'Auth callback must return synchronously');};
handler=async url=>url.includes('workspace_context')?[{id:team,name:'Synthetic A team',slug:'synthetic',role:'owner'}]:[];
emit('SIGNED_IN',current);await tick();await tick();assert.ok(calls.length>=3);assert.equal(context.members.length,0);assert.equal(context.selectedWorkspace.id,team);
// A delayed response cannot put A's members/campaigns back after logout.
const delayed=deferred();handler=()=>delayed.promise;const load=vm.runInContext('loadWorkspaceData(operation())',context);await tick();emit('SIGNED_OUT',null);delayed.resolve([{name:'Private A member'}]);await assert.rejects(load,/Account changed/);assert.equal(context.campaigns.length,0);assert.equal(context.members.length,0);assert.equal(app.innerHTML,'signed-out');
// Fresh SDK actor changed before HTTP; captured operation may not dispatch under B.
context.session={user:{id:A},access_token:'token-A'};current={user:{id:B},access_token:'token-B'};const before=calls.length;await assert.rejects(vm.runInContext("rpc('tasteprint_create_workspace',{p_name:'A intent',p_slug:'a-intent'},operation())",context),/Account changed/);assert.equal(calls.length,before);
// Unknown requested team must not silently choose the first accessible team.
current={user:{id:A},access_token:'token-A'};context.session=current;handler=async url=>url.includes('workspace_context')?[{id:team,name:'Synthetic A team',slug:'synthetic',role:'owner'}]:[];
await assert.rejects(vm.runInContext("loadContext('44444444-4444-4444-8444-444444444444',operation())",context),/Requested workspace unavailable/);
// Old team request is rejected after a team-selection generation changes.
context.selectedWorkspace={id:team};const gate=deferred();handler=()=>gate.promise;const old=vm.runInContext('loadWorkspaceData(operation())',context);await tick();context.generation++;context.selectedWorkspace={id:'55555555-5555-4555-8555-555555555555'};gate.resolve([{campaign_id:'old-team'}]);await assert.rejects(old,/Account changed/);assert.equal(context.campaigns.length,0);
// Same-account refresh keeps form/data state; actual actor change clears it immediately.
context.sessionInitialized=true;context.workspaces=[{id:team}];context.members=[{member_ref:'synthetic-private'}];context.inviteURL='synthetic-private-link';const version=context.generation;emit('TOKEN_REFRESHED',current);assert.equal(context.generation,version);assert.equal(context.members.length,1);emit('SIGNED_IN',{user:{id:B},access_token:'token-B'});assert.equal(context.members.length,0);assert.equal(context.inviteURL,'');assert.equal(context.selectedWorkspace,null);assert.equal(context.document.title,'Campaign Workspace · Tasteprint','old private team name must not remain in the tab after an actor change');
// No actor-only private records in transport payloads; identity is always the JWT.
assert.ok(calls.every(call=>['Bearer token-A','Bearer token-B'].includes(call.options.headers.Authorization)));
context.window={};context.demoRole='owner';context.selectedWorkspace=null;
const api=source.slice(source.indexOf('window.TasteprintWorkspace ='),source.lastIndexOf('initialize();'));vm.runInContext(api,context);assert.equal(context.window.TasteprintWorkspace.can('member.manage'),false,'connected mode without a verified team cannot inherit demo owner capability');
await tick();await tick();console.log('Workspace isolation PASS: deferred Auth work, synchronous callback, old-account/team read rejection, fresh actor binding, same-actor refresh preservation and explicit unknown-team denial. Actual source; synthetic boundaries.');
