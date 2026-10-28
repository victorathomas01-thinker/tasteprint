// Execute the real base entry after an unavailable screen, forcing late initialization.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let source=await readFile(new URL('../app.js',import.meta.url),'utf8');
source=source.replace("import { getCampaign } from './campaign-config.js';","const getCampaign=()=>globalThis.__startupCampaign;")
 .replace("import { landingView, bindLanding } from './landing.js';","const landingView=()=>'<h1>Base home</h1>',bindLanding=()=>{};")
 .replace("import { hospitalityResultView, bindHospitalityResult } from './hospitality.js';","const hospitalityResultView=()=>'',bindHospitalityResult=()=>{};")
 .replaceAll("from './comparison-core.js'",`from '${new URL('../comparison-core.js',import.meta.url).href}'`)
 .replaceAll("from './data.js'",`from '${new URL('../data.js',import.meta.url).href}'`);
const missing='<h1>This campaign is unavailable.</h1>';
for(const [query,campaign,expected] of [['?campaign=missing',null,missing],['?plans=1&campaign=missing',null,missing],['?campaign=aster&published=1',null,missing],['',null,'<h1>Base home</h1>'],['?campaign=aster',{id:'aster'},'<h1>Base home</h1>']]){
 const app={innerHTML:missing,querySelector:()=>null,querySelectorAll:()=>[]};globalThis.document={querySelector:()=>app};globalThis.location={href:'https://synthetic.invalid/'+query};globalThis.__startupCampaign=campaign;
 await import('data:text/javascript;base64,'+Buffer.from(source+'\n//'+query+Math.random()).toString('base64'));
 assert.equal(app.innerHTML,expected,'late base initialization must preserve missing/published-unavailable campaign screens while keeping valid entry routes');
}
console.log('Campaign startup PASS: forced late base entry cannot overwrite an unavailable campaign; valid campaign and home initialization preserved.');
