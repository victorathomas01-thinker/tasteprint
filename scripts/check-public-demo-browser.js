import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=process.env.TASTEPRINT_TEST_URL;
if(!root)throw Error('Set TASTEPRINT_TEST_URL to the public-demo artifact preview.');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:375,height:950},reducedMotion:'reduce'}),page=await context.newPage();
 const errors=[],external=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(new URL(request.url()).origin!==new URL(root).origin)external.push(new URL(request.url()).origin);});
 await page.goto(root+'demo.html');
 assert.equal(await page.locator('script').count(),0);
 await page.evaluate(()=>{
  localStorage.setItem('tasteprint.interests.v1',JSON.stringify({liked:['drama'],shared:['drama'],saved:['sintel']}));
  localStorage.setItem('tasteprint.platform-history.v1','preserve existing Passport history');
  sessionStorage.setItem('tasteprint.workspace-demo-role.v1','production-owner');
 });
 await page.getByRole('link',{name:'Start with your interests',exact:true}).click();
 await page.getByRole('heading',{name:'What do you actually enjoy?'}).waitFor();
 await page.getByRole('complementary',{name:'Public demo notice'}).waitFor();
 assert.equal(await page.getByLabel('Drama preference',{exact:true}).inputValue(),'neutral','app cannot see production preferences');
 await page.getByLabel('Animation preference',{exact:true}).selectOption('liked');
 await page.getByRole('button',{name:'Save interests',exact:true}).click();
 await page.reload();
 assert.equal(await page.getByLabel('Animation preference',{exact:true}).inputValue(),'liked','demo survives reload under its own namespace');
 const stored=await page.evaluate(()=>({production:JSON.parse(localStorage.getItem('tasteprint.interests.v1')),demo:JSON.parse(localStorage.getItem('tasteprint.public-demo.v1:tasteprint.interests.v1')),history:localStorage.getItem('tasteprint.platform-history.v1'),session:sessionStorage.getItem('tasteprint.workspace-demo-role.v1')}));
 assert.deepEqual(stored.production,{liked:['drama'],shared:['drama'],saved:['sintel']});
 assert.deepEqual(stored.demo.liked,['animation']);
 assert.equal(stored.history,'preserve existing Passport history');assert.equal(stored.session,'production-owner');
 assert.match(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),/connect-src 'none'/);
 await page.goto(root+'?friends=1');await page.getByRole('heading',{name:'Account-backed friends are not enabled.'}).waitFor();
 assert.deepEqual(external,[],'public demo has no external API requests');assert.deepEqual(errors,[]);
 await context.close();
 console.log('Public demo browser PASS: real production bundle uses isolated preferences/history, reload works, original local/session data survives, notice visible and no external API traffic.');
}finally{await browser.close();}
