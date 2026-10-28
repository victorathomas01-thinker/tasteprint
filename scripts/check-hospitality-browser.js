import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}),args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:950},reducedMotion:'reduce'});
page.setDefaultTimeout(10000);
try {
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const root=process.env.TASTEPRINT_TEST_URL || 'http://127.0.0.1:4173/';const id='charlotte-boutique-demo';
const screenshots=process.env.TASTEPRINT_SCREENSHOT_DIR;
const capture=async name=>{if(screenshots){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:screenshots+'/'+name,fullPage:true,animations:'disabled'});}};
for(let attempt=0;attempt<100;attempt++){try{if((await fetch(root)).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
await page.goto(root+'?campaign='+id);
await page.getByRole('button',{name:'Find my kind of stay',exact:true}).waitFor();
await capture('hotel-guest-desktop.png');
await page.getByRole('button',{name:'Find my kind of stay',exact:true}).click();
await page.getByRole('heading',{name:'You’ve checked in. What sounds good first?'}).waitFor();
for(let i=0;i<8;i++)await page.locator('[data-option]').nth(i%4).click();
await page.locator('.hotel-offer').first().waitFor();
assert.equal(await page.locator('.hotel-offer').count(),3);
assert.equal(await page.locator('.story').count(),0,'no irrelevant destination/share result');
assert.equal(await page.locator('.campaign-lead-form').count(),0,'contact collection disabled');
await page.locator('.hospitality-result h1').focus();
await page.evaluate(()=>scrollTo(0,0));
await capture('hotel-results-desktop.png');
await page.locator('[data-hotel-offer]').first().click();
await page.locator('#hotel-next-0').waitFor({state:'visible'});
assert.match(await page.locator('#hotel-next-0').innerText(),/nothing has been booked/);
assert.equal(await page.locator('[data-hotel-offer]').first().getAttribute('aria-expanded'),'true');
await page.setViewportSize({width:375,height:812});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await capture('hotel-results-mobile.png');
await page.goto(root+`?campaignReport=${id}&demo=1`);
await page.getByRole('heading',{name:'Local browser demo'}).waitFor();
await page.getByText('Quiz starts',{exact:true}).waitFor();
for(const metric of ['Quiz starts','Quiz completions','Result matches','CTA clicks']) { assert.equal(await page.getByText(metric,{exact:true}).locator('..').locator('h2').innerText(),'1',metric+' reflects the completed flow'); }
const local=await page.evaluate(()=>window.TasteprintAnalytics.localEvents());
assert.equal(local.filter(e=>e.event_name==='quiz_start'&&e.properties.campaign_id==='charlotte-boutique-demo').length,1);
assert.equal(local.filter(e=>e.event_name==='quiz_complete'&&e.properties.campaign_id==='charlotte-boutique-demo').length,1);
assert.equal(local.filter(e=>e.event_name==='campaign_cta'&&e.properties.campaign_id==='charlotte-boutique-demo').length,1);
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tasteprint.platform-history.v1')||'[]').length),0,'hotel result not added to consumer Passport');
await page.setViewportSize({width:1280,height:950});
await page.goto(root+`?campaignGuide=${id}`);
await page.getByRole('heading',{name:'A guest experience. A simpler next choice.'}).waitFor();
await capture('hotel-operator-desktop.png');
await page.getByRole('link',{name:'Edit the demo in Studio →'}).click();
await page.getByLabel('Landing title',{exact:true}).fill('Your locally edited hotel introduction');
await page.getByLabel('Description, offer 1',{exact:true}).fill('Edited courtyard offer for the operator walkthrough.');
await page.getByLabel('Offer name, offer 1',{exact:true}).fill('Edited courtyard pause');
const before=await page.evaluate(()=>window.TasteprintStudio.manifest());
assert.equal(before.demo,true);assert.equal(before.questions.length,8);assert.equal(before.presentation.kind,'hospitality');
assert.equal(before.catalog[0].name,'Edited courtyard pause');
await page.getByRole('button',{name:'Save draft & preview',exact:true}).click();
await page.getByRole('heading',{name:'Your locally edited hotel introduction'}).waitFor();
await page.getByRole('button',{name:'Find my kind of stay',exact:true}).click();
await page.getByRole('heading',{name:'You’ve checked in. What sounds good first?'}).waitFor();
for(let i=0;i<8;i++)await page.locator('[data-option]').first().click();
await page.locator('.hotel-offer').first().waitFor();
await page.getByRole('heading',{name:'Edited courtyard pause'}).waitFor();
for(const width of [375,768,1440]){
 await page.setViewportSize({width,height:900});
 for(const query of ['?campaign='+id,'?campaignGuide='+id]){
  await page.goto(root+query);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),query+' fits '+width);
 }
}
await page.goto(root+'?campaign='+id);
await page.waitForTimeout(100);
for(let step=0;step<20;step++){ if(await page.evaluate(()=>document.activeElement.classList.contains('skip-link')))break;await page.keyboard.press('Shift+Tab'); }
assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('skip-link')),true);
await page.keyboard.press('Enter');
assert.equal(await page.evaluate(()=>document.activeElement.id),'app');
// Protect the shared consumer product while adding campaign-only presentation.
for(const module of ['escape','wear','watch','move','eat','live']) {
 await page.goto(root+'?module='+module);
 assert.equal(await page.locator('.hospitality-result').count(),0);
 await page.locator('#app h1').waitFor();
}
await page.goto(root+'?module=escape');
await page.getByRole('button',{name:'Find my escape',exact:true}).click();
for(let step=0;step<8;step++) {
 const commit=page.locator('[data-action="continue"]');
 if(await commit.count()) {
  for(let option=0;option<6;option++) {
   await page.locator('[data-option]').nth(option).click();
   if(await page.locator('[data-action="continue"]:not([disabled])').count())break;
  }
  await commit.click();
 } else await page.locator('[data-option]').first().click();
}
await page.locator('.story').first().waitFor();
await page.waitForFunction(()=>window.TasteprintPassport?.history().length>0);
assert.ok(await page.locator('.send-challenge').count());
await page.goto(await page.evaluate(()=>window.TasteprintLinks.resultURL()));
await page.locator('.story').first().waitFor();
await page.goto(root+'?profile=1');
await page.locator('.passport-view').waitFor();
await page.goto(root+'?next=1');
await page.locator('#app h1').waitFor();
assert.deepEqual(errors,[]);
console.log('Browser PASS: complete guest flow, safe demo action, scoped local events/report, Passport separation, operator edit/save/preview preserving questions/demo, responsive widths, keyboard, six consumer entries, Escape completion/shared result, Passport and Next Moves.');
} finally { await browser.close(); }
