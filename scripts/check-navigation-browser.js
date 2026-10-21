import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=process.env.TASTEPRINT_TEST_URL||'http://127.0.0.1:4173/';
 await page.goto(root);
 await page.getByRole('heading',{name:/A little more you/}).waitFor();
 assert.equal(await page.locator('.entry-module').count(),6);
 assert.equal(await page.locator('nav[aria-label="Main navigation"] [aria-current="page"]').innerText(),'Home');
 await page.getByRole('link',{name:'For my business →',exact:true}).click();
 await page.getByRole('heading',{name:/Your offerings/}).waitFor();
 await page.getByRole('link',{name:'Hotel team walkthrough',exact:true}).click();
 await page.getByRole('heading',{name:'A guest experience. A simpler next choice.'}).waitFor();
 assert.equal(await page.locator('.entry-page').count(),0,'operator deep link never renders marketing home');
 await page.getByRole('link',{name:'Back to Tasteprint',exact:true}).click();
 await page.getByRole('link',{name:'Campaigns',exact:true}).click();
 await page.locator('#campaign-list article').first().waitFor();
 assert.equal(await page.locator('#campaign-list article').count(),2);
 await page.getByRole('searchbox').fill('no matching campaign');
 await page.getByText('No campaigns match your search.',{exact:false}).waitFor();
 await page.getByRole('searchbox').fill('charlotte');
 assert.equal(await page.locator('#campaign-list article').count(),1);
 await page.getByRole('link',{name:'Try this demo →',exact:true}).click();
 await page.getByRole('button',{name:'Find my kind of stay',exact:true}).waitFor();
 await page.goto(root+'?campaigns=1');
 await page.evaluate(()=>{const {getCampaign,saveCampaignDraft}=window.TasteprintCampaignConfig;saveCampaignDraft({...getCampaign('charlotte-boutique-demo'),id:'private-draft',name:'Private hotel draft'});});
 await page.reload();
 await page.locator('#campaign-list article').first().waitFor();
 assert.equal(await page.locator('#campaign-list article').count(),2,'private drafts stay out of public showcase');
 await page.getByRole('searchbox').fill('aster');
 await page.getByRole('link',{name:'Try this demo →',exact:true}).click();
 await page.getByRole('button',{name:'Find my Aster escape',exact:true}).waitFor();
 for(const width of [375,768,1440]) {
  await page.setViewportSize({width,height:900});
  for(const query of ['', '?business=1','?campaigns=1']) {
   await page.goto(root+query);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),query+' fits '+width);
  }
 }
 await page.goto(root+'?campaign=aster&together=1');await page.getByRole('button',{name:'Find my Aster escape',exact:true}).waitFor();
 await page.goto(root+'?profile=1&discover=1');await page.getByRole('heading',{name:'What do you actually enjoy?'}).waitFor();
 await page.goto(root+'?campaign=missing-campaign&together=1');await page.getByRole('heading',{name:'This campaign is unavailable.',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('Navigation browser PASS — people/business entry, hotel walkthrough, two searchable demos, private-draft exclusion, Aster and responsive layouts.');
} finally {await browser.close();}
