// Test the actual configured production bundle. Every backend request is intercepted;
// no project is contacted and no source module is mounted by a test harness.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=process.env.TASTEPRINT_TEST_URL;
if(!root||new URL(root).hostname!=='127.0.0.1')throw Error('Configured Plans checks require the local isolated review server.');
const host='https://tasteprint-synthetic.supabase.co';
const creator='11111111-1111-1111-1111-111111111111',recipient='22222222-2222-2222-2222-222222222222',id='33333333-3333-3333-3333-333333333333',token='b'.repeat(64);
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
let plan=null,responses=[],claimed=false,blocked=false,offline=false;
const calls=[],external=[],errors=[];
async function downloadText(download){const stream=await download.createReadStream();let value='';for await(const chunk of stream)value+=chunk.toString('utf8');return value;}
function jwt(actor){return [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:actor,role:'authenticated',exp:4102444800})).toString('base64url'),'synthetic-signature'].join('.');}
async function contextFor(actor){
 const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 await context.addInitScript(({actor,accessToken,origin})=>{if(location.origin!==origin)return;localStorage.setItem('tasteprint.auth.v1',JSON.stringify({access_token:accessToken,refresh_token:'synthetic-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:actor,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}}));},{actor,accessToken:jwt(actor),origin:new URL(root).origin});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin===new URL(root).origin)return route.continue();
  if(url.origin!==host){external.push(url.origin);return route.abort();}
  // Read the bearer from the bundled client; actor is not accepted from a UI fixture.
  const headers=request.headers(),authorization=headers.authorization||'';
  const reply=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(url.pathname==='/auth/v1/user')return reply({id:actor});
  if(url.pathname==='/auth/v1/logout'){assert.equal(authorization,'Bearer '+jwt(actor));calls.push({actor,path:url.pathname,method:request.method()});return route.fulfill({status:204,body:''});}
  calls.push({actor,path:url.pathname,method:request.method(),query:url.search,body:request.postDataJSON()});
  if(offline)return reply({message:'Synthetic unavailable'},503);
  assert.equal(authorization,'Bearer '+jwt(actor));assert.equal(headers.apikey,'sb_publishable_synthetic_test_only');
  const body=request.postDataJSON(),name=url.pathname.split('/').pop();
  if(name==='tasteprint_create_private_plan'){
   assert.deepEqual(Object.keys(body).sort(),['p_idea_url','p_title']);
   plan={id,creator_id:creator,recipient_id:null,title:body.p_title,idea_url:body.p_idea_url,state:'proposed',revision:1,details:{},expires_at:'2099-01-01T00:00:00Z'};
   responses=[{actor_id:creator,interest:'pending',approved_revision:null,completed_at:null}];
   return reply({plan_id:id,invite_token:token,expires_at:plan.expires_at});
  }
  if(name==='tasteprint_accept_plan_invite'){
   assert.deepEqual(Object.keys(body),['p_token']);assert.equal(body.p_token,token);assert.ok(!request.url().includes(token));
   if(claimed||actor===creator)return reply({message:'Unavailable'},403);
   claimed=true;plan.recipient_id=actor;plan.expires_at=null;responses.push({actor_id:actor,interest:'pending',approved_revision:null,completed_at:null});return reply(id);
  }
  if(name==='tasteprint_respond_private_plan'){
   assert.deepEqual(Object.keys(body).sort(),['p_action','p_details','p_plan_id','p_revision']);assert.equal(body.p_plan_id,id);
   if(body.p_revision!==plan.revision)return reply({message:'Stale revision'},409);
   const mine=responses.find(row=>row.actor_id===actor);
   if(body.p_action==='interest'){mine.interest='interested';plan.state=responses.every(row=>row.interest==='interested')?'mutual_interest':'interested';}
   if(body.p_action==='details'){plan.details=body.p_details;plan.revision++;plan.state='mutual_interest';responses.forEach(row=>row.approved_revision=null);}
   if(body.p_action==='approve'){mine.approved_revision=plan.revision;if(responses.every(row=>row.approved_revision===plan.revision))plan.state='scheduled';}
   if(body.p_action==='cancel')plan.state='cancelled';
   if(body.p_action==='complete'){mine.completed_at='2099-01-02T23:00:00Z';plan.state='completed_self_reported';}
   return reply({plan_id:id,state:plan.state,revision:plan.revision});
  }
  if(name==='tasteprint_prune_my_passport'){assert.deepEqual(body,{p_keep:60});return reply(0);}
  if(name==='tasteprint_passport_snapshots'){assert.equal(request.method(),'GET');assert.equal(body,null);return reply([]);}
  if(name==='tasteprint_social_plans'){
   if(blocked||!plan)return reply([]);
   assert.equal(request.method(),'GET');return reply([plan]);
  }
  if(name==='tasteprint_social_plan_responses'){assert.equal(url.searchParams.get('plan_id'),'eq.'+id);return reply(responses);}
  if(name==='tasteprint_social_blocks'){
   if(request.method()==='POST'){assert.equal(body.blocker_id,actor);assert.equal(body.blocked_id,recipient);blocked=true;return route.fulfill({status:201,body:''});}
   if(request.method()==='DELETE'){blocked=false;return route.fulfill({status:204,body:''});}
   return reply(blocked?[{blocked_id:recipient}]:[]);
  }
  if(name==='tasteprint_export_my_plan_participation'){
   assert.deepEqual(body,{p_after:null,p_limit:100});const mine=responses.find(row=>row.actor_id===actor);
   return reply({version:1,records:plan?[{plan_id:id,role:actor===creator?'creator':'recipient',accessible:!blocked,own_response:mine?{interest:mine.interest,approved_revision:mine.approved_revision,completed_at:mine.completed_at}:null,shared_plan:blocked?null:plan}]:[],next_cursor:null});
  }
  if(name==='tasteprint_remove_my_plan_participation'){assert.deepEqual(body,{p_plan_id:id});assert.equal(actor,recipient);plan=null;responses=[];return reply(true);}
  if(name==='tasteprint_cleanup_my_expired_plan_invites'){assert.deepEqual(body,{});return reply(2);}
  if(name==='tasteprint_delete_my_private_plan'){assert.equal(actor,creator);assert.equal(body.p_plan_id,id);plan=null;responses=[];return reply(true);}
  // Nothing else is provisioned: unexpected integration calls fail visibly in the test.
  errors.push('Unexpected synthetic endpoint: '+url.pathname);return reply({message:'Not provisioned'},403);
 });
 context.on('page',page=>{page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));});
 return context;
}
try{
 const c1=await contextFor(creator),c2=await contextFor(recipient),p1=await c1.newPage(),p2=await c2.newPage();
 await p1.goto(root+'?plans=1&item=spring');await p1.getByRole('heading',{name:'Propose something specific'}).waitFor();
 assert.equal(await p1.getByLabel('Plan title',{exact:true}).inputValue(),'Spring');
 await p1.getByRole('button',{name:'Create private invitation',exact:true}).click();await p1.getByLabel('Private invitation link').waitFor();const invitation=await p1.getByLabel('Private invitation link').inputValue();assert.equal(new URL(invitation).hash,'#invite='+token);
 await p2.goto(invitation);await p2.getByRole('button',{name:'Join invitation',exact:true}).click();await p2.getByText(/Invitation joined. This does not express interest/).waitFor();assert.equal(new URL(p2.url()).hash,'');
 await p2.getByRole('button',{name:"I'm interested",exact:true}).click();await p2.getByText('One person interested · Revision 1',{exact:true}).waitFor();
 await p1.getByRole('button',{name:'Refresh plan',exact:true}).click();await p1.getByRole('button',{name:"I'm interested",exact:true}).click();await p1.getByText('Both interested · Revision 1',{exact:true}).waitFor();
 await p1.getByLabel('Start',{exact:true}).fill('2099-01-02T18:00');await p1.getByLabel('Meeting place',{exact:true}).fill('Synthetic venue');await p1.getByRole('button',{name:'Propose revised details',exact:true}).click();await p1.getByText('Both interested · Revision 2',{exact:true}).waitFor();
 await p1.locator('#confirm-action').check();await p1.getByRole('button',{name:'Approve this revision',exact:true}).focus();await p1.keyboard.press('Enter');await p1.getByText(/Your approval was saved/).waitFor();assert.equal(plan.state,'mutual_interest');
 await p2.getByRole('button',{name:'Refresh plan',exact:true}).click();await p2.locator('#confirm-action').check();await p2.getByRole('button',{name:'Approve this revision',exact:true}).click();await p2.getByText('Both approved these details · Revision 2',{exact:true}).waitFor();
 const calendarPromise=p2.waitForEvent('download');await p2.getByRole('button',{name:'Download private calendar file'}).click();const calendar=await calendarPromise;assert.equal(calendar.suggestedFilename(),'tasteprint-plan.ics');const calendarContents=await downloadText(calendar);assert.match(calendarContents,/BEGIN:VCALENDAR/);assert.match(calendarContents,/SUMMARY:Spring/);assert.ok(!calendarContents.includes(token));
 await p2.getByLabel('Meeting place',{exact:true}).fill('Changed synthetic venue');await p2.getByRole('button',{name:'Propose revised details',exact:true}).click();await p2.getByText('Both interested · Revision 3',{exact:true}).waitFor();assert.ok(responses.every(row=>row.approved_revision===null));
 await p1.getByRole('button',{name:'Refresh plan',exact:true}).click();await p1.getByText('Both interested · Revision 3',{exact:true}).waitFor();
 const exportPromise=p1.waitForEvent('download');await p1.getByRole('button',{name:'Export private plan data'}).click();const exported=await exportPromise;assert.equal(exported.suggestedFilename(),'tasteprint-plan.json');const exportedContents=await downloadText(exported);assert.equal(JSON.parse(exportedContents).plan.id,id);assert.ok(!exportedContents.includes(token));
 offline=true;await p1.getByRole('button',{name:'Refresh plan',exact:true}).click();await p1.getByRole('alert').filter({hasText:'no local agreement was substituted'}).waitFor();assert.equal(await p1.getByRole('button',{name:'Approve this revision',exact:true}).count(),0);offline=false;
 await p1.getByRole('button',{name:'Refresh plans',exact:true}).click();await p1.getByText('Both interested · Revision 3',{exact:true}).waitFor();
 assert.equal(await p1.evaluate(()=>window.TasteprintAccount.signOut()),true);await p1.getByRole('heading',{name:'Sign in to access private plans.'}).waitFor();assert.equal(await p1.getByText('Changed synthetic venue',{exact:true}).count(),0);
 await p1.reload();await p1.getByText('Both interested · Revision 3',{exact:true}).waitFor();
 await p1.locator('#confirm-action').check();await p1.getByRole('button',{name:'Block other participant'}).click();await p1.getByText(/Account blocked. Both participants/).waitFor();
 await p2.getByRole('button',{name:'Refresh plan',exact:true}).click();await p2.getByRole('heading',{name:'This plan is unavailable.'}).waitFor();assert.equal(await p2.getByText('Changed synthetic venue',{exact:true}).count(),0);
 await p2.getByText('Plan privacy and cleanup',{exact:true}).click();const participationPromise=p2.waitForEvent('download');await p2.getByRole('button',{name:'Export my plan participation',exact:true}).click();const participation=JSON.parse(await downloadText(await participationPromise));assert.equal(participation.records[0].plan_id,id);assert.equal(participation.records[0].shared_plan,null);assert.ok(!JSON.stringify(participation).includes(creator));assert.ok(!JSON.stringify(participation).includes(token));
 await p2.getByText('Plan privacy and cleanup',{exact:true}).click();await p2.getByLabel('Participation plan ID',{exact:true}).fill(id);if(process.env.TASTEPRINT_SCREENSHOT_DIR){for(const width of [375,1280]){await p2.setViewportSize({width,height:900});await p2.evaluate(()=>document.activeElement?.blur());await p2.locator('details.card').screenshot({path:process.env.TASTEPRINT_SCREENSHOT_DIR+`/plan-privacy-${width}.png`});}await p2.setViewportSize({width:375,height:900});}await p2.getByLabel('Erase this shared plan for both participants permanently',{exact:true}).check();await p2.getByRole('button',{name:'Remove my participation and erase shared plan',exact:true}).click();await p2.getByText(/Your participation and the shared plan/).waitFor();assert.equal(plan,null);
 await p1.getByText('Blocked accounts (1)',{exact:true}).click();await p1.getByRole('button',{name:'Unblock account',exact:true}).click();await p1.getByText(/Account unblocked/).waitFor();
 await p1.getByText('Plan privacy and cleanup',{exact:true}).click();await p1.getByRole('button',{name:'Clean up my old unclaimed invitations',exact:true}).click();await p1.getByText(/Removed 2 of your unclaimed invitations/).waitFor();
 assert.equal(plan,null);assert.ok(await p1.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.ok(!calls.some(row=>/analytics|event|lead/.test(row.path)));assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 console.log('Configured Plans bundle PASS: shared synthetic Auth sessions, catalog prefill, two-context invite/own interest/mutual revisions, keyboard approval, real downloads, failure recovery, real shared-client logout, block/unblock/blocked-recipient erasure/personal export/cleanup and exact REST/RPC wire contracts. All backend traffic intercepted; hosted behavior remains unverified.');
}finally{await browser.close();}
