import {INTERESTS} from './interests-core.js';
import {eligibility} from './catalog-core.js';
const tags=new Set(INTERESTS.map(item=>item.id));
const keys=['maxCost','maxMinutes','currency','stepFree','requireAvailable','excludedTags'];
export function normalizeRequirements(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.includes(key)))throw Error('Invalid shared requirements.');
 const result={maxCost:null,maxMinutes:null,currency:'USD',stepFree:false,requireAvailable:false,excludedTags:[]};
 for(const [key,max] of [['maxCost',1000000],['maxMinutes',10080]])if(value[key]!=null){if(!Number.isFinite(value[key])||value[key]<0||value[key]>max)throw Error('Invalid shared limit.');result[key]=value[key];}
 if(value.currency!==undefined&&value.currency!=='USD')throw Error('Shared budgets currently use USD.');
 for(const key of ['stepFree','requireAvailable'])if(value[key]!==undefined){if(typeof value[key]!=='boolean')throw Error('Invalid shared requirement.');result[key]=value[key];}
 if(value.excludedTags!==undefined){if(!Array.isArray(value.excludedTags)||value.excludedTags.length>12||value.excludedTags.some(tag=>!tags.has(tag))||new Set(value.excludedTags).size!==value.excludedTags.length)throw Error('Use known exclusions.');result.excludedTags=[...value.excludedTags].sort();}
 return result;
}
export function hasRequirements(value){const rules=normalizeRequirements(value||{});return rules.maxCost!==null||rules.maxMinutes!==null||rules.stepFree||rules.requireAvailable||rules.excludedTags.length>0;}
export function validateDecision(value,actors){
 if(!value||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.participants)||value.participants.length!==2)throw Error('Shared requirements unavailable.');
 const seen=new Set();for(const row of value.participants){if(!actors.includes(row?.actor_id)||seen.has(row.actor_id)||!(row.requirements===null||row.requirements&&typeof row.requirements==='object'))throw Error('Invalid requirement participant.');seen.add(row.actor_id);if(row.requirements!==null){normalizeRequirements(row.requirements);if(!hasRequirements(row.requirements)||value.revision===0)throw Error('Invalid requirement state.');}}
 return structuredClone(value);
}
export function requirementsFor(snapshot,actor){return snapshot?.decision?.participants.find(row=>row.actor_id===actor)?.requirements||null;}
export function sharedEligibility(reference,decision,now=Date.now()){
 const rules=(decision?.participants||[]).map(row=>row.requirements).filter(hasRequirements);
 if(!rules.length)return [];
 const checked=Date.parse(reference?.source?.verified_at);
 if(!reference||!Number.isFinite(checked)||checked>now||now-checked>30*86400000)return ['Current reviewed source and facts are not confirmed'];
 return [...new Set(rules.flatMap(rule=>eligibility(reference,normalizeRequirements(rule),now)))];
}
export function requirementSummary(value){
 const r=normalizeRequirements(value||{}),parts=[];
 if(r.maxCost!==null)parts.push(`Up to $${r.maxCost} USD`);
 if(r.maxMinutes!==null)parts.push(`Up to ${r.maxMinutes} minutes`);
 if(r.stepFree)parts.push('Confirmed step-free access');if(r.requireAvailable)parts.push('Confirmed availability');
 if(r.excludedTags.length)parts.push('Exclude: '+r.excludedTags.map(tag=>INTERESTS.find(item=>item.id===tag).label).join(', '));
 return parts.length?parts.join(' · '):'No shared hard requirements';
}
