import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});
const root=process.env.TASTEPRINT_TEST_URL||'http://127.0.0.1:4186/';
try {
for(const query of ['?module=escape','?campaign=aster','?campaign=charlotte-boutique-demo']){
 await page.goto(root+query);await page.locator('[data-action=start]').click();
 const first=await page.locator('#app h2').first().innerText();
 assert.equal(await page.getByRole('button',{name:'Back',exact:true}).isDisabled(),true);
 await page.locator('[data-option]').first().click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 assert.equal(await page.locator('#app h2').first().innerText(),first);
 await page.locator('[data-option]').nth(1).click();
 assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'),'1');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(query.includes('charlotte')){
  const colors=await page.locator('.choice strong').first().evaluate(el=>({fg:getComputedStyle(el).color,bg:getComputedStyle(el.closest('button')).backgroundColor}));
  const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
  assert.ok((Math.max(lum(colors.fg),lum(colors.bg))+.05)/(Math.min(lum(colors.fg),lum(colors.bg))+.05)>=4.5);
 }
}
await page.goto(root+'?business=1');const help=page.getByLabel('About Campaign reporting');await help.focus();await page.keyboard.press('Enter');await page.getByText(/Counts are events recorded/).waitFor({state:'visible'});
console.log('Phase 0 browser: Back, progression, mobile contrast and keyboard help passed.');
}finally{await browser.close()}
