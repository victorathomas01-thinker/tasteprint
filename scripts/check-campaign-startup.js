// Execute the real base entry after a dedicated screen, forcing late initialization.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let source=await readFile(new URL('../app.js',import.meta.url),'utf8');
source=source.replace("import { getCampaign } from './campaign-config.js';","const getCampaign=()=>globalThis.__startupCampaign;")
 .replace("import { landingView, bindLanding } from './landing.js';","const landingView=()=>'<h1>Base home</h1>',bindLanding=()=>{};")
 .replace("import { hospitalityResultView, bindHospitalityResult } from './hospitality.js';","const hospitalityResultView=()=>'',bindHospitalityResult=()=>{};")
 .replaceAll("from './comparison-core.js'",`from '${new URL('../comparison-core.js',import.meta.url).href}'`)
 .replaceAll("from './consumer-route-core.js'",`from '${new URL('../consumer-route-core.js',import.meta.url).href}'`)
 .replaceAll("from './data.js'",`from '${new URL('../data.js',import.meta.url).href}'`);
const missing='<h1>This campaign is unavailable.</h1>';
for(const [query,campaign,expected] of [['?campaign=missing',null,missing],['?plans=1&campaign=missing',null,missing],['?campaign=aster&published=1',null,missing],['',null,'<h1>Base home</h1>'],['?campaign=aster',{id:'aster'},'<h1>Base home</h1>'],...['?profile=1&module=wear','?workspace=1&module=eat','?campaignAdmin=1&module=move','?modules=1','?module=watch'].map(query=>[query,null,missing])]){
 const app={innerHTML:missing,querySelector:()=>null,querySelectorAll:()=>[]};globalThis.document={querySelector:()=>app};globalThis.location={href:'https://synthetic.invalid/'+query};globalThis.__startupCampaign=campaign;
 await import('data:text/javascript;base64,'+Buffer.from(source+'\n//'+query+Math.random()).toString('base64'));
 assert.equal(app.innerHTML,expected,'late base initialization must preserve campaign/dedicated-page owners while retaining valid base routes');
}
console.log('Base startup PASS: forced late entry preserves unavailable campaigns and dedicated pages/modules; valid campaign and home entry retained.');
