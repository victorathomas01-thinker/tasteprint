// Owned, disposable loopback-only services. No hosted project, production credentials or real accounts.
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {randomBytes,createHmac} from 'node:crypto';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,extname,resolve} from 'node:path';
import {createServer} from 'node:http';
const root=new URL('../',import.meta.url).pathname;
const temp=await mkdtemp(join(tmpdir(),'tasteprint-local-auth-'));
const prefix=`tasteprint-auth-${process.pid}-${randomBytes(4).toString('hex')}`;
const images={pg:'postgres:17@sha256:a63c1ea3f6a3a5a1621f97d2aba3b30faecfab4224c1b0000cc85ced57bb1939',auth:'supabase/gotrue@sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b',rest:'postgrest/postgrest@sha256:c7cd7e265a85b05248abf53f4473fcec7e327c282d0bd0cf60f1551996d09fcf'};
const apiPaths=[],apiFailures=[];let stage='social';
const owned=[];let network=null,browser=null,server=null;
const secret=randomBytes(48).toString('hex'),dbPassword=randomBytes(24).toString('hex');
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:8e6,timeout:20000}).trim();
const token=(role,extra={})=>{const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const value=enc({alg:'HS256',typ:'JWT'})+'.'+enc({role,iss:'tasteprint-local-synthetic',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,...extra});return value+'.'+createHmac('sha256',secret).update(value).digest('base64url');};
const publicKey=token('anon'),adminKey=token('service_role');
async function container(kind,env,port){const file=join(temp,`${kind}.env`);await writeFile(file,Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});const name=prefix+'-'+kind;const id=docker('run','--detach','--network',network,'--name',name,'--env-file',file,images[kind]);owned.push(id);if(!port)return name;const details=JSON.parse(docker('inspect',id))[0];const address=Object.values(details.NetworkSettings.Networks)[0]?.IPAddress;if(!address)throw Error(`${kind} has no internal service address`);return `http://${address}:${port}`;}
async function wait(check,label){for(let i=0;i<150;i++){try{if(await check())return;}catch{}if(owned.some(id=>JSON.parse(docker('inspect',id))[0].State.Status==='exited'))throw Error(`${label} service exited during startup`);await new Promise(r=>setTimeout(r,200));}throw Error(`${label} failed to become ready; logs retained only in the owned temporary workspace until cleanup.`);}
function sql(pg,text){return execFileSync('docker',['exec','-i',pg,'psql','-X','-q','-t','-A','-v','ON_ERROR_STOP=1','--host=127.0.0.1','-U','postgres'],{input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();}
async function json(url,{key=publicKey,bearer=key,body,method='POST',status=200,empty=false}={}){const response=await fetch(url,{signal:AbortSignal.timeout(10000),method,headers:{apikey:key,Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});assert.equal(response.status,status,`Unexpected status for ${new URL(url).pathname}: ${response.status}`);return empty||response.status===204?null:response.json();}
for(const [signal,code] of [['SIGINT',130],['SIGTERM',143]])process.once(signal,()=>{void cleanup().finally(()=>process.exit(code));});
try{
 network=docker('network','create','--internal','--label','tasteprint.synthetic=true',prefix);
 const pg=await container('pg',{POSTGRES_PASSWORD:dbPassword});
 await wait(()=>{docker('exec',pg,'pg_isready','--host=127.0.0.1','-U','postgres');return true;},'PostgreSQL');
 sql(pg,`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create role authenticator login noinherit password '${dbPassword}';grant anon,authenticated,service_role to authenticator;create role supabase_auth_admin login createrole password '${dbPassword}';create schema auth authorization supabase_auth_admin;grant all on database postgres to supabase_auth_admin;create schema extensions;create extension pgcrypto with schema extensions;grant usage on schema extensions to supabase_auth_admin;alter role supabase_auth_admin set search_path=auth,public,extensions;grant usage on schema auth,public to anon,authenticated,service_role;`);
 const auth=await container('auth',{GOTRUE_API_HOST:'0.0.0.0',GOTRUE_API_PORT:'9999',API_EXTERNAL_URL:'http://127.0.0.1',GOTRUE_DB_DRIVER:'postgres',GOTRUE_DB_DATABASE_URL:`postgres://supabase_auth_admin:${dbPassword}@${pg}:5432/postgres`,GOTRUE_SITE_URL:'http://127.0.0.1',GOTRUE_DISABLE_SIGNUP:'true',GOTRUE_JWT_ADMIN_ROLES:'service_role',GOTRUE_JWT_AUD:'authenticated',GOTRUE_JWT_DEFAULT_GROUP_NAME:'authenticated',GOTRUE_JWT_EXP:'3600',GOTRUE_JWT_SECRET:secret,GOTRUE_JWT_ISSUER:'tasteprint-local-synthetic',GOTRUE_EXTERNAL_EMAIL_ENABLED:'true',GOTRUE_MAILER_AUTOCONFIRM:'true',GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED:'false',GOTRUE_EXTERNAL_PHONE_ENABLED:'false',GOTRUE_LOG_LEVEL:'error'},9999);
 await wait(async()=>{const response=await fetch(auth+'/health',{signal:AbortSignal.timeout(1000)});return response.ok;},'local Auth');
 sql(pg,`create or replace function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;grant execute on function auth.uid() to anon,authenticated,service_role;`);
 for(const file of ['schema.sql','campaigns.sql','campaign-registry.sql','workspaces.sql','workspace-member-refs.sql','workspace-lifecycle.sql','workspace-reporting.sql','social-plans.sql','social-plan-privacy.sql','social-friends.sql','social-shortlists.sql','social-reflection.sql'])sql(pg,await readFile(join(root,'supabase',file),'utf8'));
 const rest=await container('rest',{PGRST_DB_URI:`postgres://authenticator:${dbPassword}@${pg}:5432/postgres`,PGRST_DB_SCHEMAS:'public',PGRST_DB_ANON_ROLE:'anon',PGRST_JWT_SECRET:secret,PGRST_SERVER_PORT:'3000',PGRST_LOG_LEVEL:'error'},3000);
 await wait(async()=>{const r=await fetch(rest+'/',{signal:AbortSignal.timeout(1000)});return r.ok;},'PostgREST');
 const accounts=[];
 for(let i=0;i<3;i++){const email=`fixture-${i}@synthetic.invalid`,password=randomBytes(24).toString('hex');const user=await json(auth+'/admin/users',{key:adminKey,body:{email,password,email_confirm:true}});const session=await json(auth+'/token?grant_type=password',{body:{email,password}});assert.equal(session.user.id,user.id);accounts.push({user,session});}
 const [a,b,intruder]=accounts;
 const rpc=(actor,name,body={})=>json(`${rest}/rpc/tasteprint_${name}`,{bearer:actor.session.access_token,body});
 const invite=await rpc(a,'create_friend_invite',{p_alias:'Synthetic sender',p_interests:['nature','animation']});
 await rpc(b,'claim_friend_invite',{p_token:invite.invite_token,p_alias:'Synthetic recipient',p_interests:['fantasy','animation']});
 await rpc(a,'respond_friend_connection',{p_id:invite.connection_id,p_action:'approve'});
 const connection=invite.connection_id;
 assert.deepEqual(await rpc(intruder,'my_friend_connections'),[]);
 for(const bearer of [publicKey,intruder.session.access_token]){const r=await fetch(rest+'/tasteprint_friend_connections',{headers:{apikey:publicKey,Authorization:`Bearer ${bearer}`}});assert.ok([401,403].includes(r.status),'no raw relationship access');}
 const tampered=a.session.access_token.slice(0,-8)+'tampered';
 for(const bearer of [tampered,token('authenticated',{sub:a.user.id,exp:1})]){const r=await fetch(rest+'/rpc/tasteprint_my_friend_connections',{method:'POST',headers:{Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401);}
 const forbidden=await fetch(rest+'/rpc/tasteprint_read_shared_shortlist',{method:'POST',headers:{Authorization:`Bearer ${intruder.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({p_connection_id:connection})});assert.ok([400,403].includes(forbidden.status));
 // Genuine refresh rotation, not intercepted JWT fixtures.
 const refreshed=await json(auth+'/token?grant_type=refresh_token',{body:{refresh_token:a.session.refresh_token}});assert.equal(refreshed.user.id,a.user.id);a.session=refreshed;
 const out=join(temp,'dist');
 server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const target=path.startsWith('/auth/v1/')?auth+req.url.slice(8):path.startsWith('/rest/v1/')?rest+req.url.slice(8):null;if(target){apiPaths.push(path);const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const headers={...req.headers};delete headers.host;delete headers.connection;const result=await fetch(target,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body}),redirect:'manual'});if(!result.ok)apiFailures.push({path,status:result.status});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;}const file=resolve(out,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(out+'/')){res.writeHead(403).end();return;}const bytes=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'}[extname(file)]||'application/octet-stream'));res.end(bytes);}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('VITE_')));Object.assign(env,{VITE_SUPABASE_URL:origin,VITE_SUPABASE_ANON_KEY:publicKey,VITE_PRIVATE_PLANS_ENABLED:'true',VITE_PRIVATE_FRIENDS_ENABLED:'true',VITE_PRIVATE_SHORTLISTS_ENABLED:'true',VITE_PRIVATE_REFLECTION_ENABLED:'true'});
 const buildLog=join(temp,'build.log');const build=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'build','--base','/','--outDir',out],{cwd:root,env,stdio:['ignore','pipe','pipe']});let output='';build.stdout.on('data',d=>output+=d);build.stderr.on('data',d=>output+=d);assert.equal(await new Promise(r=>build.on('exit',r)),0,'local configured build');await writeFile(buildLog,output,{mode:0o600});
 const {chromium}=await import('playwright');browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[],outside=[];const contexts=[];
 for(const actor of [a,b]){const context=await browser.newContext({viewport:{width:375,height:850}});await context.addInitScript(({origin,session})=>{if(location.origin===origin)localStorage.setItem('tasteprint.auth.v1',JSON.stringify({...session,expires_at:Math.floor(Date.now()/1000)+session.expires_in}));},{origin,session:actor.session});const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(!request.url().startsWith(origin+'/')&&!request.url().startsWith('data:'))outside.push(new URL(request.url()).origin);});contexts.push({context,page});}
 const p=contexts[0].page,q=contexts[1].page;
 await p.goto(origin+'/?friends=1');await p.getByRole('link',{name:'Open our shared shortlist',exact:true}).click();await p.getByText('Loaded current shared shortlist.',{exact:true}).waitFor();await p.locator('[data-catalog-item=spring] [data-suggest-item]').click();
 const option=p.locator('[data-shortlist-option]').first();await option.waitFor();const optionId=await option.getAttribute('data-shortlist-option');await option.getByRole('button',{name:'Interested',exact:true}).click();await option.locator('[name=reviewed]').check();await option.getByRole('button',{name:'Choose this idea',exact:true}).click();await p.getByText('Your choice was saved. Your friend must independently choose the same idea.',{exact:true}).waitFor();
 await q.goto(origin+'/?together=1&connection='+connection);const other=q.locator('[data-shortlist-option]').first();await other.getByRole('button',{name:'Interested',exact:true}).click();await other.locator('[name=reviewed]').check();await other.getByRole('button',{name:'Choose this idea',exact:true}).click();await q.getByText('Both people chose this idea. You can now create a private plan proposal.',{exact:true}).waitFor();await other.locator('[name=reviewed]').check();await other.getByRole('button',{name:'Create our private plan proposal',exact:true}).click();await q.getByRole('link',{name:'Open private plan proposal',exact:true}).click();await q.getByText('Both interested · Revision 1',{exact:true}).waitFor();
 await q.getByLabel('Start',{exact:true}).fill('2099-01-02T18:00');await q.getByLabel('Meeting place',{exact:true}).fill('Synthetic test room');await q.getByRole('button',{name:'Propose revised details',exact:true}).click();await q.getByText('Both interested · Revision 2',{exact:true}).waitFor();
 // Real API evidence remains authoritative alongside browser rendering.
 const snapshot=await rpc(a,'read_shared_shortlist',{p_connection_id:connection});assert.equal(snapshot.options.find(o=>o.id===optionId).planned,true);const planId=snapshot.options.find(o=>o.id===optionId).plan_id;
 const plans=await json(rest+'/tasteprint_social_plans?select=*',{bearer:a.session.access_token,method:'GET'});assert.equal(plans.find(row=>row.id===planId).revision,2);
 await q.locator('#confirm-action').check();await q.getByRole('button',{name:'Approve this revision',exact:true}).click();
 const firstApproval=await json(rest+'/tasteprint_social_plans?select=*',{bearer:a.session.access_token,method:'GET'});assert.equal(firstApproval.find(row=>row.id===planId).state,'mutual_interest','one approval must not schedule a plan');
 await p.goto(origin+'/?plans=1&plan='+planId);await p.getByText('Both interested · Revision 2',{exact:true}).waitFor();await p.locator('#confirm-action').check();await p.getByRole('button',{name:'Approve this revision',exact:true}).click();await p.getByText('Both approved these details · Revision 2',{exact:true}).waitFor();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));

 // Move only this owned synthetic fixture to the past to exercise post-plan feedback.
 sql(pg,`update public.tasteprint_social_plans set details=jsonb_set(details,'{starts_at}',to_jsonb('${new Date(Date.now()-86400000).toISOString()}'::text)) where id='${planId}';`);
 assert.equal(await rpc(a,'read_my_plan_reflection',{p_plan_id:planId,p_revision:2}),null);
 await p.reload();await p.getByRole('heading',{name:'Your private reflection',exact:true}).waitFor();await p.getByLabel('Did you attend?',{exact:true}).selectOption('attended');await p.getByLabel('Did you enjoy it? (optional)',{exact:true}).selectOption('enjoyed');await p.getByLabel('Would you do something together again? (optional)',{exact:true}).selectOption('yes');await p.getByRole('button',{name:'Save private reflection',exact:true}).click();await p.getByText('Your private reflection was saved. Attendance remains self-reported.',{exact:true}).waitFor();
 assert.equal((await rpc(a,'read_my_plan_reflection',{p_plan_id:planId,p_revision:2})).enjoyment,'enjoyed');assert.equal(await rpc(b,'read_my_plan_reflection',{p_plan_id:planId,p_revision:2}),null,'the other participant cannot read private feedback');assert.deepEqual(await rpc(intruder,'export_my_plan_reflections'),[]);
 for(const width of [375,1280]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(process.env.TASTEPRINT_SCREENSHOT_DIR)await p.locator('[data-private-reflection]').screenshot({path:join(process.env.TASTEPRINT_SCREENSHOT_DIR,`reflection-${width}.jpg`),type:'jpeg',quality:85});}
 // Scoped local backup/restore of feedback with its owned parents preserved in place.
 const fingerprint=()=>sql(pg,"select md5(coalesce(jsonb_agg(to_jsonb(r) order by plan_id,actor_id,revision)::text,'')) from public.tasteprint_plan_reflections r;");
 const before=fingerprint();docker('exec',pg,'pg_dump','--host=127.0.0.1','--username=postgres','--format=custom','--no-owner','--no-privileges','--table=public.tasteprint_plan_reflections','--file=/tmp/reflection.dump','postgres');docker('exec',pg,'chmod','600','/tmp/reflection.dump');
 assert.throws(()=>docker('exec',pg,'pg_restore','--host=127.0.0.1','--username=postgres','--dbname=postgres','--data-only','--single-transaction','--no-owner','--no-privileges','/tmp/reflection.dump'));assert.equal(fingerprint(),before,'failed duplicate restore must be atomic');
 sql(pg,'delete from public.tasteprint_plan_reflections;');docker('exec',pg,'pg_restore','--host=127.0.0.1','--username=postgres','--dbname=postgres','--data-only','--single-transaction','--no-owner','--no-privileges','/tmp/reflection.dump');assert.equal(fingerprint(),before);assert.equal((await rpc(a,'read_my_plan_reflection',{p_plan_id:planId,p_revision:2})).enjoyment,'enjoyed');
 // Genuine authenticated Workspace: create, invite, own permissions, revocation and explicit unknown-team denial.
 stage='workspace creation';const businessStart=apiPaths.length;
 await p.goto(origin+'/?workspace=1');await p.getByRole('heading',{name:'Create your first workspace.',exact:true}).waitFor();assert.equal(await p.evaluate(()=>window.TasteprintWorkspace.can('member.manage')),false);
 await p.getByLabel('Workspace name',{exact:true}).fill('Synthetic team');await p.getByLabel('Workspace URL slug',{exact:true}).fill('synthetic-team');await p.getByRole('button',{name:'Create private workspace',exact:true}).click();await p.getByRole('heading',{name:'Synthetic team',exact:true}).waitFor();for(const width of [375,1280]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 const workspace=await p.evaluate(()=>window.TasteprintWorkspace.selected().id);assert.equal(await p.evaluate(()=>window.TasteprintWorkspace.can('member.manage')),true);
 const {getCampaign}=await import('../campaign-config.js');const teamManifest={...getCampaign('aster'),id:'synthetic-team-campaign',name:'Synthetic hosted draft'};delete teamManifest.localDraft;
 await json(rest+'/tasteprint_workspace_campaigns',{bearer:a.session.access_token,status:201,empty:true,body:{workspace_id:workspace,campaign_id:teamManifest.id,manifest:teamManifest,status:'draft'}});
 const ownB=await rpc(b,'create_workspace',{p_name:'Synthetic other team',p_slug:'synthetic-other'});
 stage='workspace invitation';
 await p.getByLabel('Invitation role',{exact:true}).selectOption('editor');await p.getByRole('button',{name:'Create invite link',exact:true}).click();const inviteInput=p.locator('.workspace-invite-output input');await inviteInput.waitFor();const workspaceInvite=await inviteInput.inputValue();await q.goto(workspaceInvite);await q.getByRole('heading',{name:'Synthetic team',exact:true}).waitFor();assert.equal(await q.evaluate(()=>window.TasteprintWorkspace.selected().role),'editor');assert.equal(await q.evaluate(()=>window.TasteprintWorkspace.can('campaign.publish')),false);
 stage='Studio shared draft edit';
 await q.getByRole('link',{name:'Edit',exact:true}).click();await q.locator('.campaign-admin [name=name]').waitFor();await q.waitForFunction(()=>document.querySelector('.campaign-admin [name=name]')?.value==='Synthetic hosted draft');assert.equal(await q.locator('[data-team-publish]').isDisabled(),true);await q.locator('.campaign-admin [name=name]').fill('Synthetic editor revision');await q.locator('[data-team-save]').click();await q.getByText('Hosted draft saved for your workspace. No consumer or lead data was copied into it.',{exact:true}).waitFor();
 const editedRows=await json(rest+'/tasteprint_workspace_campaigns?select=created_by,updated_by,manifest',{bearer:a.session.access_token,method:'GET'});const edited=editedRows.find(row=>row.manifest.id===teamManifest.id);assert.equal(edited.created_by,a.user.id,'editor save must preserve the original creator');assert.equal(edited.updated_by,b.user.id);assert.equal(edited.manifest.name,'Synthetic editor revision');
 await q.goto(origin+'/?workspace=1&team='+workspace);await q.getByRole('heading',{name:'Synthetic team',exact:true}).waitFor();
 stage='workspace removal';
 await p.reload();await p.getByRole('heading',{name:'Synthetic team',exact:true}).waitFor();const remove=p.locator('[data-member-remove]');assert.equal(await remove.count(),1);await remove.click();await p.getByRole('button',{name:'Click again to remove',exact:true}).click();await p.getByText('Member removed.',{exact:true}).waitFor();
 await q.reload();await q.getByRole('heading',{name:'Workspace is unavailable.',exact:true}).waitFor();assert.equal(await q.getByRole('heading',{name:'Synthetic other team',exact:true}).count(),0);assert.equal(await q.evaluate(()=>window.TasteprintWorkspace.can('member.manage')),false);assert.equal(await rpc(b,'delete_workspace',{p_workspace_id:ownB.id}),true);
 await p.getByRole('button',{name:'Sign out',exact:true}).click();await p.getByRole('heading',{name:'Sign in to your team workspace.',exact:true}).waitFor();assert.equal(await p.evaluate(()=>window.TasteprintWorkspace.workspaces().length),0);assert.equal(await p.evaluate(()=>window.TasteprintWorkspace.can('member.manage')),false);
 await p.waitForTimeout(750);assert.ok(!apiPaths.slice(businessStart).some(path=>/passport_snapshots|prune_my_passport/.test(path)),'business pages must not automatically sync the unrelated consumer Passport');
 const savedStart=apiPaths.length;await p.goto(origin+'/?saved=1');await p.getByRole('heading',{name:'Saved for later.',exact:true}).waitFor();await p.waitForTimeout(750);assert.ok(!apiPaths.slice(savedStart).some(path=>/tasteprint_(events|profiles)|passport_snapshots|prune_my_passport/.test(path)),'Saved is a private local surface, not an anonymous telemetry/account-sync event');
 // Delete an actual local Auth account. Database foreign keys must erase private social data.
 await json(auth+'/admin/users/'+b.user.id,{key:adminKey,method:'DELETE'});
 assert.equal(sql(pg,`select count(*) from public.tasteprint_plan_reflections where plan_id='${planId}';`),'0');
 assert.equal(sql(pg,`select count(*) from public.tasteprint_friend_connections where id='${connection}';`),'0');assert.equal(sql(pg,`select count(*) from public.tasteprint_shortlist_options where connection_id='${connection}';`),'0');assert.equal(sql(pg,`select count(*) from public.tasteprint_social_plans where id='${planId}';`),'0');
 assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
 for(const {context} of contexts)await context.close();
 console.log('Local real-service PASS: pinned Auth + PostgREST + PostgreSQL, genuine password/refresh JWTs, forged/expired/anonymous/nonmember denial, two browser accounts independently choosing one option, versioned mutual plan agreement, mobile overflow, private post-plan reflection/read isolation/scoped backup and restore, genuine Workspace creation/invite/Studio shared editor save/original creator preservation/revocation/no wrong-team fallback/signout, Auth deletion cascades, no external browser requests. Synthetic-only; no hosted recovery or physical-device claim.');
}catch(error){
 // Provider logs can contain JWTs or account data; do not print them or raw response bodies.
 console.error('Local synthetic integration failed at',stage,':',error.message,'API failures:',apiFailures);

 if(browser)for(const context of browser.contexts())for(const page of context.pages()){try{console.error('Browser error states:',await page.locator('[role=alert]').allTextContents(),'Headings:',await page.locator('#app h1').allTextContents(),'Studio state:',await page.locator('[data-studio-workspace-status]').allTextContents());}catch{}}


 process.exitCode=1;
}finally{
 await cleanup();
}
async function cleanup(){
 if(cleanup.promise)return cleanup.promise;
 cleanup.promise=(async()=>{
  await browser?.close();
  if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
  for(const id of owned.reverse()){try{docker('rm','--force',id);}catch{console.error('Could not remove an owned synthetic container:',id);process.exitCode=1;}}
  if(network){try{docker('network','rm',network);}catch{console.error('Could not remove the owned synthetic network:',prefix);process.exitCode=1;}}
  await rm(temp,{recursive:true,force:true});
 })();
 return cleanup.promise;
}
