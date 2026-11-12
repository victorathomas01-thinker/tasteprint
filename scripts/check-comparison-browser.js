import {chromium} from 'playwright';import assert from 'node:assert/strict';
import {QUESTIONS,DIMENSIONS} from '../data.js';import {comparePreferencePatterns} from '../comparison-core.js';
const root=process.env.TASTEPRINT_TEST_URL||'http://127.0.0.1:4192/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:375,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function finish(target,index=0){for(const q of QUESTIONS){await target.locator('[data-option]').first().waitFor();if(q.multi){for(let i=0;i<q.multi;i++)await target.locator('[data-option]').nth(i).click();await target.locator('[data-action=continue]').click();}else await target.locator('[data-option]').nth(index).click();}}
 await page.goto(root+'?module=escape');await page.locator('[data-action=start]').click();await finish(page);await page.locator('.story').first().waitFor();
 const scores=await page.evaluate(()=>window.TasteprintLinks.decodeScores(new URL(window.TasteprintLinks.resultURL()).searchParams.get('result')));
 const challenge=await page.evaluate(()=>window.TasteprintLinks.challengeURL());
 await page.locator('[data-action=compare]').click();await page.locator('#friend-input').fill('Synthetic friend');await page.locator('[data-action=friend-start]').click();await finish(page,1);
 await page.locator('.comparison-evidence').waitFor();assert.match(await page.locator('.comparison-evidence').innerText(),/\d+ of 10/);assert.match(await page.locator('#app').innerText(),/not relationship compatibility/);assert.equal(await page.locator('.ring-value').count(),0);assert.ok(!/\d+%/.test(await page.locator('#app').innerText()));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('[data-action=back-mine]').click();await page.locator('.story').first().waitFor();
 const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});const friend=await context.newPage();friend.on('pageerror',e=>errors.push(e.message));await friend.goto(challenge);await friend.locator('[data-action=start]').click();await finish(friend,1);await friend.locator('.remote-match').waitFor();
 const other=await friend.evaluate(()=>window.TasteprintLinks.decodeScores(new URL(window.TasteprintLinks.resultURL()).searchParams.get('result')));const expected=comparePreferencePatterns(scores,other,DIMENSIONS);
 assert.ok(!(await friend.locator('.remote-score').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('conic-gradient'));assert.match(await friend.locator('.remote-score').innerText(),new RegExp(`${expected.closeCount}/${expected.dimensions}`));assert.ok(!/\d+%/.test(await friend.locator('.remote-match').innerText()));await friend.getByRole('heading',{name:'Shared travel preferences',exact:true}).waitFor();assert.match(await friend.locator('.remote-story').innerText(),/Not relationship compatibility/);
 for(const width of [375,1280]){await friend.setViewportSize({width,height:900});assert.ok(await friend.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(process.env.TASTEPRINT_SCREENSHOT_DIR)await friend.screenshot({path:process.env.TASTEPRINT_SCREENSHOT_DIR+`/comparison-${width}.png`,fullPage:true,animations:'disabled'});}
 assert.deepEqual(errors,[]);await context.close();console.log('Comparison browser PASS: full same-phone and separate-context challenge journeys, exact quiz-count evidence, no fabricated percentages, share story, Back and responsive layouts.');
}finally{await browser.close();}
