// Network evidence from the actual production bundle, with the backend disabled.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=process.env.TASTEPRINT_TEST_URL;
if(!root||new URL(root).hostname!=='127.0.0.1')throw Error('Use the local production review server.');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[],scripts=new Map();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.ok()&&response.request().resourceType()==='script')scripts.set(response.url(),response.body().then(body=>body.length).catch(()=>null));});
 for(const route of ['','?discover=1','?profile=1','?plans=1','?friends=1','?together=1','?saved=1','?updates=1']){
  await page.goto(root+route);await page.locator('#app').waitFor();await page.waitForLoadState('networkidle');
  assert.ok(![...scripts.keys()].some(url=>/\/supabase-sdk-/.test(url)),'unconfigured routes must not download optional Auth SDK');
 }
 assert.deepEqual(errors,[]);
 let bytes=0;for(const size of scripts.values()){const value=await size;assert.ok(Number.isFinite(value),'response bytes must be captured before navigation');bytes+=value;}
 console.log(`Loading PASS: eight unconfigured production routes request no optional Auth SDK chunk; ${bytes} distinct JavaScript response bytes observed across routes. No field-performance or physical-device claim.`);
}finally{await browser.close();}
