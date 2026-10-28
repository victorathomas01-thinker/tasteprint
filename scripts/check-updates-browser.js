import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=process.env.TASTEPRINT_TEST_URL;if(!root||new URL(root).hostname!=='127.0.0.1')throw Error('Local preview required.');
const id='11111111-1111-4111-8111-111111111111',actor='22222222-2222-4222-8222-222222222222';
let inbox={enabled:false,items:[],upcoming:[]},fail=false,hold=false,release,calls=[];
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:375,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.goto(root+'?updates=1');await page.getByRole('heading',{name:'Connected updates are not enabled.',exact:true}).waitFor();
 await page.goto(root+'?updates=1&discover=1');await page.getByRole('heading',{name:'Find something worth sharing.',exact:true}).waitFor();
 const files=new Set(['updates-view.js','updates-client.js','social-request.js','plans-core.js','item-view.js','catalog-core.js','interests-core.js','platform-core.js']);
 await page.route('**/__updates__/*.js',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();assert.ok(files.has(name));await route.fulfill({contentType:'text/javascript',body:await readFile(new URL('../'+name,import.meta.url),'utf8')});});
 await page.exposeFunction('__updateCall',async(method,args)=>{calls.push({method,args});if(fail)throw Error('Synthetic outage');if(hold)await new Promise(resolve=>release=resolve);if(method==='read')return inbox;if(method==='enable'){inbox={enabled:args[0],items:[],upcoming:[]};return;}if(method==='mark'){inbox.items=inbox.items.map(row=>({...row,read:true}));return true;}});
 await page.evaluate(async({actor})=>{const {mountUpdates}=await import('/__updates__/updates-view.js');window.__updates=mountUpdates({app:document.querySelector('#app'),getSession:async()=>({user:{id:actor}}),client:Object.fromEntries(['read','enable','mark'].map(name=>[name,(...args)=>window.__updateCall(name,args)])),download:value=>window.__updateExport=value});},{actor});
 await page.getByRole('button',{name:'Turn on private updates',exact:true}).click();await page.getByText('Private updates are on.',{exact:true}).waitFor();
 inbox={enabled:true,items:[{id,subject_id:id,subject_type:'plan',kind:'plan_changed',sequence:2,read:false,title:'<img src=x onerror=alert(1)>',occurred_at:'2026-10-23T00:00:00Z'}],upcoming:[]};
 await page.getByRole('button',{name:'Refresh updates',exact:true}).click();await page.getByRole('heading',{name:inbox.items[0].title,exact:true}).waitFor();assert.equal(await page.locator('.updates-view img').count(),0);
 await page.getByRole('button',{name:'Mark seen',exact:true}).click();await page.getByText('Marked seen.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Mark seen',exact:true}).count(),0);
 await page.getByRole('button',{name:'Export visible updates',exact:true}).click();await page.waitForFunction(()=>window.__updateExport);assert.ok(!(await page.evaluate(()=>JSON.stringify(window.__updateExport))).includes(actor));
 for(const width of [375,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 fail=true;await page.getByRole('button',{name:'Refresh updates',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.locator('[data-update]').count(),0);fail=false;
 await page.getByRole('button',{name:'Refresh updates',exact:true}).click();await page.getByRole('button',{name:'Turn off and erase updates',exact:true}).click();await page.getByRole('heading',{name:'Updates are off.',exact:true}).waitFor();assert.equal(inbox.enabled,false);
 hold=true;await page.getByRole('button',{name:'Refresh updates',exact:true}).click();await page.waitForTimeout(50);await page.evaluate(()=>window.__updates.clearSession());release?.();await page.waitForTimeout(50);await page.getByRole('heading',{name:'Sign in for private updates.',exact:true}).waitFor();assert.equal(await page.locator('[data-update]').count(),0);assert.ok(calls.every(call=>call.args.at(-1)?.actor===actor));assert.deepEqual(errors,[]);
 console.log('Updates browser PASS: disabled gate, canonical route, opt-in/read/export/off, escaped titles, responsive layout, outage clears content and late account isolation. Injectable synthetic transport; real-service flow tested separately.');
}finally{await browser.close();}
