import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
const root=process.env.TASTEPRINT_TEST_URL||'http://127.0.0.1:4186/';
try{
const context=await browser.newContext({viewport:{width:1280,height:950},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(root+'?together=1');await page.getByRole('heading',{name:'Find your common ground.'}).waitFor();
await page.getByRole('button',{name:'Create preference link'}).click();const link=await page.locator('#social-link').inputValue();assert.ok(link.includes('#taste='));
const recipient=await browser.newContext();const other=await recipient.newPage();await other.goto(link);await other.getByRole('heading',{name:'A friend shared their preferences'}).waitFor();await other.getByRole('button',{name:'Find joint ideas'}).click();assert.equal(await other.locator('.social-ideas article').count(),3);
await page.getByRole('button',{name:'Use sample friend'}).click();await page.getByRole('button',{name:'Find joint ideas'}).click();await page.getByRole('button',{name:'Suggest this idea'}).first().click();
await page.getByRole('button',{name:'I am interested',exact:true}).click();await page.getByRole('button',{name:'Simulate friend interest',exact:true}).click();
await page.getByLabel('Proposed date, time and place (local only)').fill('Friday 7pm, choose venue together');await page.getByRole('button',{name:'Propose details / request reapproval'}).click();await page.getByRole('button',{name:'I agree to these details',exact:true}).click();await page.getByRole('button',{name:'Simulate friend agreeing',exact:true}).click();assert.match(await page.locator('#shared-plan').innerText(),/State: scheduled/);
for(const width of [1280,375]){await page.setViewportSize({width,height:950});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(process.env.TASTEPRINT_SCREENSHOT_DIR)await page.screenshot({path:process.env.TASTEPRINT_SCREENSHOT_DIR+`/together-${width}.png`,fullPage:true});}
await page.getByRole('button',{name:'Withdraw / cancel'}).click();assert.match(await page.locator('#shared-plan').innerText(),/State: cancelled/);
assert.equal(await page.locator('#shared-plan script').count(),0);
await page.getByLabel('Title',{exact:true}).fill('<img src=x onerror=alert(1)>');await page.getByLabel('Optional HTTPS source link').fill('https://example.com/idea');await page.getByRole('button',{name:'Suggest your idea',exact:true}).click();assert.equal(await page.locator('#shared-plan img').count(),0);assert.match(await page.locator('#shared-plan h2').innerText(),/<img/);
const events=await page.evaluate(()=>window.TasteprintAnalytics?.localEvents?.()||[]);assert.equal(events.length,0,'Together does not create anonymous activity events');
await page.goto(root+'?together=1#taste=invalid');await page.getByText(/This preference link is invalid or expired/).waitFor();assert.deepEqual(errors,[]);console.log('Together browser: separate recipient context, shortlist, local mutual-plan demo, cancellation, invalid link and responsive widths passed.');
}finally{await browser.close()}
