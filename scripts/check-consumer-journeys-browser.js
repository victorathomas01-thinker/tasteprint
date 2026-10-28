import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {QUESTIONS} from '../data.js';
import {WEAR_QUESTIONS} from '../wear-data.js';
import {WATCH_QUESTIONS} from '../watch-data.js';
import {MOVE_QUESTIONS} from '../move-data.js';
import {EAT_QUESTIONS} from '../eat-data.js';
import {LIVE_QUESTIONS} from '../live-data.js';
const root=process.env.TASTEPRINT_TEST_URL;if(!root||new URL(root).hostname!=='127.0.0.1')throw Error('Local production preview required.');
const modules=[['escape',QUESTIONS],['wear',WEAR_QUESTIONS],['watch',WATCH_QUESTIONS],['move',MOVE_QUESTIONS],['eat',EAT_QUESTIONS],['live',LIVE_QUESTIONS]];
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
let stage='startup',lastPage;
try{
 const page=await browser.newPage({viewport:{width:375,height:900}}),errors=[];lastPage=page;page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 // Hold animation callbacks to reproduce a user focusing an answer before the
 // next paint. Presentation work must never take that deliberate focus away.
 await page.addInitScript(()=>{
  const native=requestAnimationFrame,frames=new Map();let sequence=0;
  window.requestAnimationFrame=callback=>window.__holdFrames?(frames.set(--sequence,callback),sequence):native(callback);
  const cancel=cancelAnimationFrame;window.cancelAnimationFrame=id=>frames.delete(id)||cancel(id);
  window.__flushFrames=()=>{const pending=[...frames.values()];frames.clear();for(const callback of pending)callback(performance.now());};
 });
 for(const id of ['wear','eat']){
  stage='delayed paint keyboard focus '+id;await page.goto(root+'?module='+id);
  await page.evaluate(()=>{window.__holdFrames=true;});
  await page.locator(`[data-${id}-start]`).click();
  await page.getByText('Choice 1 of 8',{exact:true}).waitFor();
  const answer=page.locator(`[data-${id}-option]`).first();await answer.focus();
  await page.evaluate(()=>window.__flushFrames());
  assert.equal(await answer.evaluate(node=>document.activeElement===node),true,'a pending presentation frame must preserve deliberate answer focus');
  await page.keyboard.press('Enter');await page.getByText('Choice 2 of 8',{exact:true}).waitFor();
 }
 for(const [id,questions] of modules){
  stage='assessment '+id;
  await page.setViewportSize({width:375,height:900});await page.goto(root+'?module='+id);
  const start=page.locator(id==='escape'?'[data-action=start]':`[data-${id}-start]`);await start.focus();await page.keyboard.press('Enter');
  const selector=id==='escape'?'[data-option]':`[data-${id}-option]`;
  for(const [index,question] of questions.entries()){
   stage='assessment '+id+' question '+(index+1);
   if(id==='escape')await page.waitForFunction(step=>document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')===String(step),index);
   else await page.getByText(`Choice ${index+1} of ${questions.length}`,{exact:true}).waitFor();
   const choices=page.locator(selector);await choices.first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' question fits mobile');
   if(question.multi){for(let n=0;n<question.multi;n++)await choices.nth(n).click();await page.locator('[data-action=continue]').click();}
   else{await choices.first().focus();await page.keyboard.press('Enter');}
  }
  await page.locator(id==='escape'?'[data-action=retake]':`[data-${id}-retake]`).waitFor();
  await page.waitForFunction(module=>window.TasteprintPassport?.history().some(row=>row.module_id===module),id);
  for(const width of [375,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' result fits viewport');}
 }
 const ids=await page.evaluate(()=>[...new Set(window.TasteprintPassport.history().map(row=>row.module_id))].sort());assert.deepEqual(ids,modules.map(([id])=>id).sort());
 await page.goto(root+'?profile=1');await page.getByRole('heading',{name:'What do you actually enjoy?',exact:true}).waitFor();assert.equal(await page.evaluate(()=>new Set(window.TasteprintPassport.history().map(row=>row.module_id)).size),6,'Passport retains all six actual journeys');
 for(const [id] of modules){
  stage='campaign priority '+id;
  await page.goto(root+'?campaign=missing-campaign&module='+id);await page.getByRole('heading',{name:'This campaign is unavailable.',exact:true}).waitFor();
  if(id!=='escape')assert.equal(await page.locator(`[data-${id}-start]`).count(),0,'a module must not replace a missing campaign');
  await page.goto(root+'?campaign=aster&published=1&module='+id);await page.getByRole('heading',{name:'This campaign is unavailable.',exact:true}).waitFor();
  await page.goto(root+'?campaign=aster&module='+id);await page.getByRole('button',{name:'Find my Aster escape',exact:true}).waitFor();
 }
 assert.deepEqual(errors,[]);console.log('Consumer journeys PASS: all six real keyboard assessment flows, mobile/results, Passport persistence, missing/published campaign priority and valid branded guest entry. Synthetic choices only.');
}catch(error){if(lastPage)console.error('Consumer journey diagnostic:',{stage,path:new URL(lastPage.url()).pathname,queryKeys:[...new URL(lastPage.url()).searchParams.keys()],headings:await lastPage.locator('#app h1,#app h2').allTextContents(),progress:await lastPage.locator('#app .small').allTextContents()});throw error;}finally{await browser.close();}
