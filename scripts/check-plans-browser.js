import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
const root=process.env.TASTEPRINT_TEST_URL||'http://127.0.0.1:4191/';
const creator='11111111-1111-1111-1111-111111111111',recipient='22222222-2222-2222-2222-222222222222',id='33333333-3333-3333-3333-333333333333',token='a'.repeat(64);
let plan=null,answers=[],fail=false,calls=[],claimed=false,blocked=false;
const files=new Set(['reflection-view.js','reflection-core.js','plans-view.js','plans-core.js','item-view.js','catalog-core.js','interests-core.js','platform-core.js']);
async function fixture(actor,method,args){
 calls.push({actor,method,args});if(fail)throw Error('Synthetic unavailable');
 if(method==='blocks')return blocked?[{blocked_id:recipient}]:[];
 if(method==='block'){blocked=true;return null;}
 if(method==='unblock'){blocked=false;return null;}
 if(method==='create'){plan={id,creator_id:creator,recipient_id:null,title:args[0],idea_url:args[1],state:'proposed',revision:1,details:{},expires_at:'2099-01-01T00:00:00Z'};answers=[{actor_id:creator,interest:'pending',approved_revision:null}];return{plan_id:id,invite_token:token};}
 if(method==='list')return !blocked&&plan&&[plan.creator_id,plan.recipient_id].includes(actor)?[plan]:[];
 if(method==='accept'){if(claimed||args[0]!==token||actor===creator)throw Error('Unavailable');claimed=true;plan.recipient_id=actor;answers.push({actor_id:actor,interest:'pending',approved_revision:null});return id;}
 if(method==='read'){if(blocked||!plan||![plan.creator_id,plan.recipient_id].includes(actor))throw Error('Unavailable');return plan;}
 if(method==='responses')return answers;
 if(method==='deleteCreatedPlan'){plan=null;answers=[];return true;}
 if(method==='respond'){
  const [,action,revision,details]=args;if(revision!==plan.revision)throw Error('Stale revision');const mine=answers.find(row=>row.actor_id===actor);
  if(action==='interest'){mine.interest='interested';plan.state=answers.length===2&&answers.every(row=>row.interest==='interested')?'mutual_interest':'interested';}
  if(action==='details'){plan.details=details;plan.revision++;plan.state='mutual_interest';answers.forEach(row=>row.approved_revision=null);}
  if(action==='approve'){mine.approved_revision=revision;if(answers.every(row=>row.approved_revision===revision))plan.state='scheduled';}
  if(action==='complete'){mine.completed_at='2099-01-02T00:00:00Z';plan.state='completed_self_reported';}
  if(action==='cancel')plan.state='cancelled';
  return {plan_id:id,state:plan.state,revision:plan.revision};
 }
 throw Error('Unexpected fixture method');
}
async function mount(page,actor,query='?plans=1'){
 await page.goto(root+query);
 await page.route('**/__plans_harness__/*.js',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();assert.ok(files.has(name));await route.fulfill({contentType:'text/javascript',body:await readFile(new URL('../'+name,import.meta.url),'utf8')});});
 await page.evaluate(query=>history.replaceState(null,'',query),query);
 await page.exposeFunction('__planCall',(method,args)=>fixture(actor,method,args));
 await page.evaluate(async actor=>{
  const {mountPlans}=await import('/__plans_harness__/plans-view.js');
  const client=Object.fromEntries(['create','accept','list','read','responses','respond','deleteCreatedPlan','blocks','block','unblock'].map(method=>[method,(...args)=>window.__planCall(method,args)]));
  window.__view=mountPlans({app:document.querySelector('#app'),client,getSession:async()=>({user:{id:actor}}),download:value=>{window.__calendar=value;}});
 },actor);
 await page.getByText('Loaded current account state.',{exact:true}).waitFor();
}
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 page.setDefaultTimeout(10000);
 const requests=[];page.on('request',request=>requests.push(request.url()));
 await page.goto(root+'?plans=1#invite='+token);await page.getByRole('heading',{name:'Connected plans are not enabled.'}).waitFor();assert.equal(new URL(page.url()).hash,'');assert.ok(!requests.some(url=>url.includes(token)));assert.equal(await page.locator('[aria-current=page]').textContent(),'Plans');
 await page.goto(root+'?plans=1&campaign=unknown-campaign');await page.getByRole('heading',{name:'This campaign is unavailable.'}).waitFor();
 console.log('Plans browser: disabled production gate passed; checking synthetic view.');
 await mount(page,creator);
 await page.getByLabel('Plan title',{exact:true}).fill('<img src=x onerror=alert(1)> Film night');await page.getByLabel('Official or suggested HTTPS link (optional)').fill('https://example.com/film');await page.getByRole('button',{name:'Create private invitation'}).click();
 await page.getByLabel('Private invitation link').waitFor();const link=await page.getByLabel('Private invitation link').inputValue();assert.ok(link.endsWith('#invite='+token));assert.equal(await page.locator('.plans-view img').count(),0);assert.equal(await page.getByRole('button',{name:"I'm interested",exact:true}).count(),0);plan.title='Spring film night';
 const friend=await browser.newPage({viewport:{width:375,height:900},reducedMotion:'reduce'});friend.setDefaultTimeout(10000);friend.on('pageerror',error=>errors.push(error.message));
 await mount(friend,recipient,'?plans=1#invite='+token);assert.equal(new URL(friend.url()).hash,'');await friend.getByRole('button',{name:'Join invitation',exact:true}).click();await friend.getByText('Invitation joined. This does not express interest or approve details.').waitFor();
 await friend.getByRole('button',{name:"I'm interested",exact:true}).click();await friend.getByText('One person interested · Revision 1',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Refresh plan',exact:true}).click();await page.getByRole('button',{name:"I'm interested",exact:true}).click();await page.getByRole('heading',{name:'Suggest time and place'}).waitFor();
 await page.getByLabel('Start',{exact:true}).fill('2099-01-02T18:00');await page.getByLabel('End (optional)').fill('2099-01-02T20:00');await page.getByLabel('Meeting place',{exact:true}).fill('Synthetic private screening');await page.getByRole('button',{name:'Propose revised details'}).click();await page.getByText('Details changed. Both people must approve this new revision.').waitFor();
 await page.getByRole('button',{name:'Approve this revision',exact:true}).click();await page.getByRole('alert').filter({hasText:'Confirm that you reviewed'}).waitFor();await page.locator('#confirm-action').check();await page.getByRole('button',{name:'Approve this revision',exact:true}).click();await page.getByText('Your approval was saved for this revision. Both people must approve the same details.').waitFor();assert.equal(plan.state,'mutual_interest');
 await friend.getByRole('button',{name:'Refresh plan',exact:true}).click();await friend.locator('#confirm-action').check();await friend.getByRole('button',{name:'Approve this revision',exact:true}).click();await friend.getByText('Both approved these details · Revision 2',{exact:true}).waitFor();
 await friend.getByRole('button',{name:'Download private calendar file'}).click();assert.match(await friend.evaluate(()=>window.__calendar),/BEGIN:VCALENDAR/);
 if(process.env.TASTEPRINT_SCREENSHOT_DIR){await friend.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await friend.screenshot({path:process.env.TASTEPRINT_SCREENSHOT_DIR+'/plans-375.png',fullPage:true});}
 assert.ok(await friend.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Editing resets both approvals; the stale creator cannot approve a superseded version.
 await friend.getByLabel('Meeting place',{exact:true}).fill('Revised synthetic location');await friend.getByRole('button',{name:'Propose revised details'}).click();await friend.getByText('Both interested · Revision 3',{exact:true}).waitFor();assert.ok(answers.every(row=>row.approved_revision===null));
 await page.getByLabel('Meeting place',{exact:true}).fill('Stale creator edit');await page.getByRole('button',{name:'Propose revised details'}).click();await page.getByRole('alert').filter({hasText:'Could not confirm'}).waitFor();assert.equal(plan.revision,3);assert.equal(plan.details.place,'Revised synthetic location');
 await page.getByRole('button',{name:'Refresh plans',exact:true}).click();await page.getByText('Both interested · Revision 3',{exact:true}).waitFor();
 fail=true;await page.getByRole('button',{name:'Refresh plan',exact:true}).click();await page.getByRole('alert').filter({hasText:'no local agreement was substituted'}).waitFor();assert.equal(await page.getByRole('button',{name:'Approve this revision',exact:true}).count(),0);fail=false;
 await page.getByRole('button',{name:'Refresh plans',exact:true}).click();await page.getByText('Both interested · Revision 3',{exact:true}).waitFor();
 if(process.env.TASTEPRINT_SCREENSHOT_DIR){await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await page.screenshot({path:process.env.TASTEPRINT_SCREENSHOT_DIR+'/plans-1280.png',fullPage:true});}
 await friend.locator('#confirm-action').check();await friend.getByRole('button',{name:'Cancel plan',exact:true}).click();await friend.getByText('Cancelled · Revision 3',{exact:true}).waitFor();assert.equal(await friend.getByRole('button',{name:'Approve this revision',exact:true}).count(),0);
 await page.getByRole('button',{name:'Refresh plan',exact:true}).click();await page.getByText('Cancelled · Revision 3',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Export private plan data'}).click();const exported=JSON.parse(await page.evaluate(()=>window.__calendar));assert.equal(exported.plan.id,id);assert.ok(!JSON.stringify(exported).includes(token));
 await page.locator('#confirm-action').check();await page.getByRole('button',{name:'Block other participant'}).click();await page.getByText(/Account blocked. Both participants/).waitFor();assert.equal(await page.getByText('Revised synthetic location',{exact:true}).count(),0);
 await page.getByText('Blocked accounts (1)',{exact:true}).click();await page.getByRole('button',{name:'Unblock account',exact:true}).click();await page.getByText(/Account unblocked/).waitFor();
 await page.getByText('Delete a plan you created, including while blocked',{exact:true}).click();await page.getByLabel('Created plan ID',{exact:true}).fill(id);await page.getByLabel('Permanently delete this shared plan and its responses',{exact:true}).check();await page.getByRole('button',{name:'Delete created plan by ID'}).click();await page.getByText(/Your created plan was permanently deleted/).waitFor();assert.equal(plan,null);
 // A session change clears all visible identities, details and invitation material.
 await page.evaluate(()=>window.__view.clearSession());await page.getByRole('heading',{name:'Sign in to access private plans.'}).waitFor();assert.equal(await page.getByText('Revised synthetic location',{exact:true}).count(),0);
 const events=await page.evaluate(()=>window.TasteprintAnalytics?.localEvents?.()||[]);assert.equal(events.filter(event=>/plan|invite/.test(event.event_name)).length,0);
 await page.evaluate(async ({creator,recipient,id})=>{
  const {mountPlans}=await import('/__plans_harness__/plans-view.js');
  history.replaceState(null,'','?plans=1&plan='+id);
  const pending=new Promise(resolve=>window.__finishRead=resolve);
  window.__lateView=mountPlans({app:document.querySelector('#app'),getSession:async()=>({user:{id:creator}}),client:{read:()=>pending,responses:async()=>[]}});
 },{creator,recipient,id});
 await page.getByText('Working…',{exact:true}).waitFor();
 await page.evaluate(async ({creator,recipient,id})=>{window.__lateView.clearSession();window.__finishRead({id,creator_id:creator,recipient_id:recipient,title:'Late private record',state:'scheduled',revision:1,details:{place:'Never disclose after logout'}});await new Promise(resolve=>setTimeout(resolve,50));},{creator,recipient,id});
 await page.getByRole('heading',{name:'Sign in to access private plans.'}).waitFor();assert.equal(await page.getByText('Late private record',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log('Plans browser PASS: built disabled gate/route precedence, source-view synthetic two-participant invite/interest/revision/approval/calendar/cancel/export/block/delete, stale writes and in-flight logout, network failure, XSS, mobile and account clearing. Hosted accounts remain unverified.');
}finally{await browser.close();}
