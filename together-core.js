import { sanitizeInterests } from './interests-core.js';
import { catalogItems } from './catalog.js';
import { MASTER_DIMENSIONS } from './platform-core.js';
export const dimensions=['curiosity','serenity','energy'];
export function projection(scores,keys=dimensions){
 return Object.fromEntries(keys.filter(k=>MASTER_DIMENSIONS.includes(k)&&Number.isFinite(scores?.[k])).map(k=>[k,Math.max(0,Math.min(100,Math.round(scores[k])))]));
}
export function encodeShare(scores,now=Date.now()){
 const p=projection(scores);if(!Object.keys(p).length)throw Error('Choose at least one preference to share.');
 return btoa(JSON.stringify({v:1,expires:now+7*86400000,scores:p}));
}
export function decodeShare(value,now=Date.now()){
 try{if(value.length>1000)return null;const p=JSON.parse(atob(value));if(p.v!==1||!Number.isFinite(p.expires)||p.expires<=now||p.expires>now+8*86400000)return null;const scores=projection(p.scores);return Object.keys(scores).length? scores:null;}catch{return null;}
}
// Editorial activity formats, not listings or availability. No external data claims.
export const ideas=[
 {id:'film',title:'Pick a film for a relaxed movie night',copy:'Choose a film you can legally access, then agree where to watch.',vector:{curiosity:65,serenity:85,energy:20},active:false},
 {id:'walk',title:'Take a discovery walk together',copy:'Choose a public route you both know is suitable. Check weather and access yourselves.',vector:{curiosity:80,serenity:60,energy:70},active:true},
 {id:'cook',title:'Try a new recipe together',copy:'Choose a recipe and check ingredients, dietary needs and equipment together.',vector:{curiosity:85,serenity:50,energy:45},active:false}
];
export function rankTogether(a,b,{excludeActive=false}={}){
 const keys=dimensions.filter(k=>Number.isFinite(a[k])&&Number.isFinite(b[k]));if(!keys.length)return [];
 const fit=(p,item)=>1-keys.reduce((s,k)=>s+Math.abs(p[k]-item.vector[k]),0)/(100*keys.length);
 return ideas.filter(x=>!excludeActive||!x.active).map(item=>{const fits=[fit(a,item),fit(b,item)];return {...item,score:.6*Math.min(...fits)+.4*(fits[0]+fits[1])/2,tradeoff:keys.reduce((x,k)=>Math.abs(a[k]-b[k])>Math.abs(a[x]-b[x])?k:x,keys[0]),reason:keys.map(k=>`${k}: ${a[k]>=50?'more':'less'} for you, ${b[k]>=50?'more':'less'} for your friend`).join('; ')};}).sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id));
}
export function transition(plan,actor,event,details=''){
 if(!['you','friend'].includes(actor))throw Error('Unknown participant');
 if(['cancelled','declined','expired'].includes(plan.state))throw Error('This proposal is closed');
 const next=structuredClone(plan);
 if(event==='cancel'){next.state='cancelled';return next;}
 if(event==='decline'){next.state='declined';return next;}
 if(event==='expire'){next.state='expired';return next;}
 if(event==='interest'){if(!['proposed','interested','mutual_interest'].includes(next.state))throw Error('Interest cannot reopen an agreed plan');next.interest={...next.interest,[actor]:true};next.state=next.interest.you&&next.interest.friend?'mutual_interest':'interested';return next;}
 if(event==='details'){
  if(!['mutual_interest','scheduled'].includes(next.state)||!details.trim()||details.length>300)throw Error('Mutual interest and clear details required');
  next.details=details.trim();next.version=(next.version||0)+1;next.approvals={};next.state='mutual_interest';return next;
 }
 if(event==='agree'){
  if(!next.details||next.state!=='mutual_interest')throw Error('Both must be interested in these details');
  next.approvals={...next.approvals,[actor]:next.version};if(next.approvals.you===next.version&&next.approvals.friend===next.version)next.state='scheduled';return next;
 }
 if(event==='complete'){
  if(!['scheduled','completed_self_reported'].includes(next.state))throw Error('Agree details first');next.completed={...next.completed,[actor]:true};next.state='completed_self_reported';return next;
 }
 throw Error('Invalid action');
}

// v2 shares a minimal, explicitly selected interest/item snapshot. v1 links remain readable.

const publicItems = new Set(catalogItems().filter(item => item.status === 'active').map(item => item.id));
function shareFields(value) {
 const approved = sanitizeInterests({liked:value?.interests,shared:value?.interests,saved:value?.saved});
 return {scores:projection(value?.scores),interests:approved.shared,saved:approved.saved.filter(id=>publicItems.has(id))};
}
export function encodeTasteShare(value, now=Date.now()) {
 const fields=shareFields(value);
 if(!Object.keys(fields.scores).length&&!fields.interests.length&&!fields.saved.length)throw Error('Choose at least one preference, interest or film to share.');
 return btoa(JSON.stringify({v:2,expires:now+7*86400000,...fields}));
}
export function decodeTasteShare(value, now=Date.now()) {
 try {
  if(typeof value!=='string'||value.length>4000)return null;
  const payload=JSON.parse(atob(value));
  if(payload?.v===1){const scores=decodeShare(value,now);return scores?{scores,interests:[],saved:[]}:null;}
  if(payload?.v!==2||!Number.isFinite(payload.expires)||payload.expires<=now||payload.expires>now+8*86400000)return null;
  const fields=shareFields(payload);
  return Object.keys(fields.scores).length||fields.interests.length||fields.saved.length?fields:null;
 } catch {return null;}
}
export function commonGround(own,shared) {
 const likes=sanitizeInterests(own);
 return { interests:likes.liked.filter(id=>shared.interests.includes(id)),items:likes.saved.filter(id=>shared.saved.includes(id)) };
}
