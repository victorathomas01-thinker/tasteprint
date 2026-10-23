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
const owned=[];let network=null,browser=null,server=null;
const secret=randomBytes(48).toString('hex'),dbPassword=randomBytes(24).toString('hex');
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:8e6,timeout:20000}).trim();
const token=(role,extra={})=>{const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const value=enc({alg:'HS256',typ:'JWT'})+'.'+enc({role,iss:'tasteprint-local-synthetic',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,...extra});return value+'.'+createHmac('sha256',secret).update(value).digest('base64url');};
const publicKey=token('anon'),adminKey=token('service_role');
async function container(kind,env,port){const file=join(temp,`${kind}.env`);await writeFile(file,Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});const name=prefix+'-'+kind;const id=docker('run','--detach','--network',network,'--name',name,'--env-file',file,images[kind]);owned.push(id);if(!port)return name;const details=JSON.parse(docker('inspect',id))[0];const address=Object.values(details.NetworkSettings.Networks)[0]?.IPAddress;if(!address)throw Error(`${kind} has no internal service address`);return `http://${address}:${port}`;}
async function wait(check,label){for(let i=0;i<150;i++){try{if(await check())return;}catch{}if(owned.some(id=>JSON.parse(docker('inspect',id))[0].State.Status==='exited'))throw Error(`${label} service exited during startup`);await new Promise(r=>setTimeout(r,200));}throw Error(`${label} failed to become ready; logs retained only in the owned temporary workspace until cleanup.`);}
function sql(pg,text){return execFileSync('docker',['exec','-i',pg,'psql','-X','-q','-t','-A','-v','ON_ERROR_STOP=1','--host=127.0.0.1','-U','postgres'],{input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();}
async function json(url,{key=publicKey,bearer=key,body,method='POST',status=200}={}){const response=await fetch(url,{signal:AbortSignal.timeout(10000),method,headers:{apikey:key,Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});assert.equal(response.status,status,`Unexpected status for ${new URL(url).pathname}: ${response.status}`);return response.status===204?null:response.json();}
for(const [signal,code] of [['SIGINT',130],['SIGTERM',143]])process.once(signal,()=>{void cleanup().finally(()=>process.exit(code));});
try{
 network=docker('network','create','--internal','--label','tasteprint.synthetic=true',prefix);
 const pg=await container('pg',{POSTGRES_PASSWORD:dbPassword});
 await wait(()=>{docker('exec',pg,'pg_isready','--host=127.0.0.1','-U','postgres');return true;},'PostgreSQL');
 sql(pg,`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create role authenticator login noinherit password '${dbPassword}';grant anon,authenticated,service_role to authenticator;create role supabase_auth_admin login createrole password '${dbPassword}';create schema auth authorization supabase_auth_admin;grant all on database postgres to supabase_auth_admin;create schema extensions;create extension pgcrypto with schema extensions;grant usage on schema extensions to supabase_auth_admin;alter role supabase_auth_admin set search_path=auth,public,extensions;grant usage on schema auth,public to anon,authenticated,service_role;`);
 const auth=await container('auth',{GOTRUE_API_HOST:'0.0.0.0',GOTRUE_API_PORT:'9999',API_EXTERNAL_URL:'http://127.0.0.1',GOTRUE_DB_DRIVER:'postgres',GOTRUE_DB_DATABASE_URL:`postgres://supabase_auth_admin:${dbPassword}@${pg}:5432/postgres`,GOTRUE_SITE_URL:'http://127.0.0.1',GOTRUE_DISABLE_SIGNUP:'true',GOTRUE_JWT_ADMIN_ROLES:'service_role',GOTRUE_JWT_AUD:'authenticated',GOTRUE_JWT_DEFAULT_GROUP_NAME:'authenticated',GOTRUE_JWT_EXP:'3600',GOTRUE_JWT_SECRET:secret,GOTRUE_JWT_ISSUER:'tasteprint-local-synthetic',GOTRUE_EXTERNAL_EMAIL_ENABLED:'true',GOTRUE_MAILER_AUTOCONFIRM:'true',GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED:'false',GOTRUE_EXTERNAL_PHONE_ENABLED:'false',GOTRUE_LOG_LEVEL:'error'},9999);
 await wait(async()=>{const response=await fetch(auth+'/health',{signal:AbortSignal.timeout(1000)});return response.ok;},'local Auth');
 sql(pg,`create or replace function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;grant execute on function auth.uid() to anon,authenticated,service_role;`);
 for(const file of ['social-plans.sql','social-plan-privacy.sql','social-friends.sql','social-shortlists.sql'])sql(pg,await readFile(join(root,'supabase',file),'utf8'));
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
 server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const target=path.startsWith('/auth/v1/')?auth+req.url.slice(8):path.startsWith('/rest/v1/')?rest+req.url.slice(8):null;if(target){const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const headers={...req.headers};delete headers.host;delete headers.connection;const result=await fetch(target,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body}),redirect:'manual'});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;}const file=resolve(out,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(out+'/')){res.writeHead(403).end();return;}const bytes=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'}[extname(file)]||'application/octet-stream'));res.end(bytes);}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('VITE_')));Object.assign(env,{VITE_SUPABASE_URL:origin,VITE_SUPABASE_ANON_KEY:publicKey,VITE_PRIVATE_PLANS_ENABLED:'true',VITE_PRIVATE_FRIENDS_ENABLED:'true',VITE_PRIVATE_SHORTLISTS_ENABLED:'true'});
 const buildLog=join(temp,'build.log');const build=spawn(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'build','--outDir',out],{cwd:root,env,stdio:['ignore','pipe','pipe']});let output='';build.stdout.on('data',d=>output+=d);build.stderr.on('data',d=>output+=d);assert.equal(await new Promise(r=>build.on('exit',r)),0,'local configured build');await writeFile(buildLog,output,{mode:0o600});
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

 // Delete an actual local Auth account. Database foreign keys must erase private social data.
 await json(auth+'/admin/users/'+b.user.id,{key:adminKey,method:'DELETE'});
 assert.equal(sql(pg,`select count(*) from public.tasteprint_friend_connections where id='${connection}';`),'0');assert.equal(sql(pg,`select count(*) from public.tasteprint_shortlist_options where connection_id='${connection}';`),'0');assert.equal(sql(pg,`select count(*) from public.tasteprint_social_plans where id='${planId}';`),'0');
 assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
 for(const {context} of contexts)await context.close();
 console.log('Local real-service PASS: pinned Auth + PostgREST + PostgreSQL, genuine password/refresh JWTs, forged/expired/anonymous/nonmember denial, two browser accounts independently choosing one option, versioned mutual plan agreement, mobile overflow, Auth deletion cascades, no external browser requests. Synthetic-only; no hosted/physical-device/recovery claim.');
}catch(error){
 // Provider logs can contain JWTs or account data; do not print them or raw response bodies.
 console.error('Local synthetic integration failed:',error.message);

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
