// Configured production build, failed optional SDK asset. Backend is never contacted.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=process.env.TASTEPRINT_TEST_URL;if(!root||new URL(root).hostname!=='127.0.0.1')throw Error('Local configured preview required.');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:375,height:900}}),errors=[],remote=[];let blocked=0;
 page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/supabase-sdk-*.js',route=>{blocked++;return route.abort();});
 await page.route('https://tasteprint-synthetic.supabase.co/**',route=>{remote.push(new URL(route.request().url()).pathname);return route.abort();});
 await page.goto(root+'?discover=1');await page.locator('[data-catalog-item]').first().waitFor();assert.ok(blocked>0,'actual SDK asset must have failed');
 await page.goto(root+'?saved=1');await page.getByRole('heading',{name:'Saved for later.',exact:true}).waitFor();
 await page.goto(root+'?workspace=1');await page.getByRole('heading',{name:'Workspace is unavailable.',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Team workflows without needing a backend for the demo.',exact:true}).count(),0);
 await page.goto(root+'?profile=1');await page.getByText('Account session could not be initialized. Local Passport still works normally.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.TasteprintAccount.signedIn()),false);
 assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('Configured SDK failure PASS: failed login-library download leaves Discover/Saved usable, explicit account/Workspace errors, no demo substitution or backend requests.');
}finally{await browser.close();}
