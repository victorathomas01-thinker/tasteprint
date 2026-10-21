import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
const root=process.env.TASTEPRINT_TEST_URL||'http://127.0.0.1:4192/';
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(root+'?profile=1');await page.getByRole('heading',{name:'What do you actually enjoy?'}).waitFor();
 const legacy=await page.evaluate(()=>localStorage.getItem('tasteprint.platform-history.v1'));
 await page.getByLabel('Animation preference',{exact:true}).selectOption('liked');await page.locator('[data-share-interest=animation]').check();await page.getByLabel('Drama preference',{exact:true}).selectOption('disliked');await page.getByRole('button',{name:'Save interests',exact:true}).click();await page.getByText('Interests saved on this browser. Nothing was shared.').waitFor();
 await page.reload();assert.equal(await page.getByLabel('Animation preference',{exact:true}).inputValue(),'liked');assert.equal(await page.getByLabel('Drama preference',{exact:true}).inputValue(),'disliked');assert.equal(await page.locator('[data-share-interest=animation]').isChecked(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('tasteprint.platform-history.v1')),legacy);
 await page.getByRole('link',{name:'Find specific things',exact:true}).click();await page.locator('[data-catalog-item]').first().waitFor();assert.equal(await page.locator('[data-catalog-item]').count(),4);assert.equal(await page.locator('[data-catalog-item=sintel]').count(),0);
 await page.locator('[data-catalog-item=spring] [data-item-action=save]').click();await page.reload();assert.equal(await page.locator('[data-catalog-item=spring] [data-item-action=unsave]').count(),1);
 await page.getByLabel('Maximum cost in USD (unknown excluded)').fill('0');await page.getByRole('button',{name:'Apply filters'}).click();await page.getByRole('heading',{name:'No confirmed options with these filters.'}).waitFor();
 await page.getByLabel('Maximum cost in USD (unknown excluded)').fill('');await page.getByRole('button',{name:'Apply filters'}).click();await page.locator('[data-catalog-item=spring] [data-item-action=dismiss]').click();assert.equal(await page.locator('[data-catalog-item=spring]').count(),0);
 await page.getByRole('button',{name:'Restore hidden items'}).click();await page.getByLabel('Search films').fill('Spring');await page.getByRole('button',{name:'Apply filters'}).click();assert.equal(await page.locator('[data-catalog-item]').count(),1);
 await page.locator('[data-catalog-item=spring] [data-item-detail]').click();
 await page.getByRole('heading',{name:'Spring',exact:true}).waitFor();assert.ok(page.url().includes('item=spring'));
 await page.getByRole('heading',{name:'Source and provenance'}).waitFor();await page.reload();await page.getByRole('heading',{name:'Spring',exact:true}).waitFor();
 await page.getByRole('link',{name:'Back to results',exact:true}).click();assert.equal(await page.getByLabel('Search films').inputValue(),'Spring');
 await page.goBack();await page.getByRole('heading',{name:'Spring',exact:true}).waitFor();
 await page.goto(root+'?discover=1&item=%3Cimg%20src=x%3E');await page.getByRole('heading',{name:'This item is unavailable.'}).waitFor();assert.equal(await page.locator('.discovery-view img').count(),0);
 await page.getByRole('link',{name:'Back to results',exact:true}).click();
 await page.getByLabel('Category',{exact:true}).selectOption('cafe');await page.getByRole('button',{name:'Apply filters'}).click();await page.getByRole('heading',{name:'No confirmed options with these filters.'}).waitFor();
 await page.getByRole('link',{name:'Clear filters',exact:true}).click();
 await page.getByLabel('Maximum duration in minutes (unknown excluded)',{exact:true}).fill('20');await page.getByRole('button',{name:'Apply filters'}).click();await page.getByRole('heading',{name:'No confirmed options with these filters.'}).waitFor();
 await page.getByRole('link',{name:'Clear filters',exact:true}).click();
 for(const width of [375,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(process.env.TASTEPRINT_SCREENSHOT_DIR){await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0)});await page.screenshot({path:process.env.TASTEPRINT_SCREENSHOT_DIR+`/discovery-${width}.png`,fullPage:true});}}
 await page.locator('.item-source summary').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.item-source[open]').count(),1);
 const events=await page.evaluate(()=>window.TasteprintAnalytics?.localEvents?.()||[]);assert.equal(events.filter(e=>/interest|discovery/.test(e.event_name)).length,0);
 // Simulate blocked storage rather than claiming a successful save.
 await page.goto(root+'?profile=1');await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('blocked')}});await page.getByRole('button',{name:'Save interests',exact:true}).click();await page.getByText(/Could not save: browser storage is unavailable/).waitFor();
 assert.deepEqual(errors,[]);console.log('Discovery browser PASS: optional private interests, legacy data unchanged, persistence, exact-item discovery, hard unknown filter, save/dismiss/search, blocked storage and responsive layouts.');
}finally{await browser.close()}
