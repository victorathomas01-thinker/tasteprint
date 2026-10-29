import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=process.env.TASTEPRINT_TEST_URL;if(!root||new URL(root).hostname!=='127.0.0.1')throw Error('Local preview required.');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});let stage='startup',page;
try{
 page=await browser.newPage({viewport:{width:375,height:900}});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const routes=[['profile=1','.passport-view'],['modules=1','.passport-view'],['workspace=1&demo=1','.workspace-shell'],['campaignAdmin=1','.campaign-admin'],['campaignGuide=charlotte-boutique-demo','.hotel-guide'],['campaignReport=charlotte-boutique-demo&demo=1','.campaign-report'],['next=1','.next-moves-shell'],['tour=1','.tour-shell'],['growth=1','.growth-view']];
 for(const module of ['wear','watch','move','eat','live']){
  for(const [query,selector] of routes){stage=module+' '+query;await page.goto(root+'?'+query+'&module='+module);await page.locator(selector).waitFor();assert.equal(await page.locator(`[data-${module}-start]`).count(),0,'a legacy assessment cannot replace a dedicated page');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  stage=module+' stats';await page.goto(root+'?stats=1&module='+module);await page.getByRole('heading',{name:'Population pulse',exact:true}).waitFor();assert.equal(await page.locator(`[data-${module}-start]`).count(),0);
  stage=module+' normal';await page.goto(root+'?module='+module);await page.locator(`[data-${module}-start]`).waitFor();
  // Existing specific module links retain priority over new discovery flags.
  await page.goto(root+'?module='+module+'&discover=1');await page.locator(`[data-${module}-start]`).waitFor();
 }
 assert.deepEqual(errors,[]);console.log('Legacy module routes PASS: all five modules defer to ten dedicated pages, responsive mobile, normal module entry and intentional newer-route priority. Actual production browser routes; synthetic local tools only.');
}catch(error){console.error('Legacy module route diagnostic:',{stage,path:page?new URL(page.url()).pathname:null,headings:page?await page.locator('#app h1,#app h2').allTextContents():[]});throw error;}finally{await browser.close();}
