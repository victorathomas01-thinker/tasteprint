import assert from 'node:assert/strict';
import {recoverAuthSession} from '../auth-session-core.js';
const gate=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
assert.equal(await recoverAuthSession(null),null);
const session={access_token:'synthetic-private-token',user:{id:'synthetic-account'}};
assert.equal(await recoverAuthSession({getSession:async()=>({data:{session}})}),session);
assert.equal(await recoverAuthSession({getSession:async()=>({data:{session:null}})}),null);
for(const provider of [()=>{throw null;},()=>{throw Error('synthetic-private-token');},async()=>({error:{message:'synthetic-private-token'}}),async()=>({data:{}})])await assert.rejects(recoverAuthSession({getSession:provider}),error=>/unavailable/.test(error.message)&&!error.message.includes('synthetic-private-token'));
for(const rejectsLate of [false,true]){
 const pending=gate();let completions=0;
 const recovery=recoverAuthSession({getSession:()=>pending.promise},{timeoutMs:15}).then(()=>completions++);
 await assert.rejects(recovery,/timed out/);
 if(rejectsLate)pending.reject(Error('synthetic-private-token'));else pending.resolve({data:{session}});
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(completions,0,'late SDK result cannot turn a timed-out recovery into success');
}
await assert.rejects(recoverAuthSession({getSession:async()=>({data:{session}})},{timeoutMs:0}),/positive/);
console.log('Auth recovery PASS: genuine null vs session, hung/synchronously failing providers, no late success/rejection leak and value-free errors.');

// Execute the real Workspace initialization error boundary: a configured failure
// must never turn into a local owner/demo workspace or retain old team data.
const {readFile}=await import('node:fs/promises');const {default:vm}=await import('node:vm');
const source=await readFile(new URL('../workspace.js',import.meta.url),'utf8');
const initializer=source.slice(source.indexOf('async function initialize()'),source.indexOf('window.TasteprintWorkspace ='));
let demoCalls=0,retryBound=false;
const app={innerHTML:'',querySelector(){return {addEventListener(){retryBound=true;}};}};
const context=vm.createContext({WORKSPACE_MODE:true,REMOTE_ENABLED:true,params:new URLSearchParams('workspace=1'),authChanged(){},generation:0,authRevision:0,sessionInitialized:false,subscribed:false,busyOperation:null,client:{auth:{onAuthStateChange(){}}},recoverAuthSession:async()=>{throw Error('synthetic-private-token');},renderDemo(){demoCalls++;},document:{querySelector:()=>app},session:{user:{id:'old'}},workspaces:[{}],selectedWorkspace:{},campaigns:[{}],members:[{}],inviteURL:'private-old-link',location:{reload(){}}});
const initializationHelpers=source.slice(source.indexOf('function operation()'),source.indexOf('function readDemoRole()'));
await vm.runInContext(initializationHelpers+initializer+'\ninitialize();',context);
assert.equal(demoCalls,0);assert.match(app.innerHTML,/Workspace is unavailable/);assert.ok(!app.innerHTML.includes('synthetic-private-token'));assert.equal(context.session,null);assert.equal(context.members.length,0);assert.equal(context.inviteURL,'');assert.equal(retryBound,true);
console.log('Workspace failure PASS: configured initialization failure clears old team state and offers explicit retry/demo choice without silent fallback.');

const {normalizeWorkspaceRole,WORKSPACE_ROLES}=await import('../workspace-core.js');
const bridgeSource=await readFile(new URL('../studio-workspace-bridge.js',import.meta.url),'utf8');
const bridgeInitializer=bridgeSource.slice(bridgeSource.indexOf('async function initializeSession()'),bridgeSource.indexOf('\nif (ADMIN_MODE) {'));
for(const response of [{data:null},{data:'owner',error:{message:'synthetic-private-token'}},{data:'editor'}]){
 const bridge=vm.createContext({ADMIN_MODE:true,DEMO_WORKSPACE:false,VALID_WORKSPACE:true,WORKSPACE_ID:'synthetic',session:null,role:null,normalizeWorkspaceRole,WORKSPACE_ROLES,recoverAuthSession:async()=>session,client:{rpc:async()=>response}});
 await vm.runInContext(bridgeInitializer+'\ninitializeSession();',bridge);
 assert.equal(bridge.role,response.error||response.data===null?null:'editor','missing/error role must never become a claimed viewer or owner');
}
console.log('Studio role recovery PASS: missing/failed role lookup grants no team role, valid role preserved.');
