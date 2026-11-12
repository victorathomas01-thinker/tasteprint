import {authenticatedSocialRequest} from './social-request.js';
import {validateItem} from './catalog-core.js';
export const catalogRoles=['contributor','reviewer','publisher','admin'];
export const catalogStates=['draft','review','approved','published','withdrawn'];
export function catalogTeamState(value){
 if(!value||!(value.role===null||catalogRoles.includes(value.role))||!Array.isArray(value.entries)||value.entries.length>2000)throw Error('Catalog queue unavailable.');
 const seen=new Set();const entries=value.entries.map(row=>{if(!row||validateItem(row.item).length||row.id!==row.item.id||!Number.isSafeInteger(row.version)||row.version<1||!catalogStates.includes(row.state)||typeof row.own!=='boolean'||seen.has(row.id))throw Error('Catalog queue unavailable.');seen.add(row.id);return {id:row.id,item:structuredClone(row.item),version:row.version,state:row.state,own:row.own};});
 if(value.role===null&&entries.length)throw Error('Catalog queue unavailable.');return {role:value.role,entries};
}
export function catalogTeamActions(row,role){
 const actions=[];
 if(row.own&&row.state==='draft'&&row.item.status==='active')actions.push('submit');
 if(!row.own&&['reviewer','admin'].includes(role)&&row.state==='review')actions.push('approve','return');
 if(!row.own&&['publisher','admin'].includes(role)&&row.state==='approved')actions.push('publish');
 if((row.own||['reviewer','publisher','admin'].includes(role))&&row.state!=='withdrawn')actions.push('withdraw');
 if(row.own&&['draft','withdrawn'].includes(row.state))actions.push('remove');
 return actions;
}
export function catalogTeamClient(config){
 const send=authenticatedSocialRequest({...config,label:'Catalog review'});
 const rpc=(name,body,context)=>{if(!context?.actor)throw Error('Account changed. Reload and try again.');return send(`rpc/tasteprint_${name}`,{body,expectedActor:context.actor});};
 return Object.freeze({async read(context){return catalogTeamState(await rpc('my_catalog_entries',{},context));},async save(item,version,context){if(validateItem(item).length||!Number.isSafeInteger(version)||version<0)throw Error('Invalid listing.');const result=await rpc('save_catalog_entry',{p_item:item,p_expected_version:version},context);if(!Number.isSafeInteger(result)||result<1)throw Error('Save was not confirmed.');return result;},async review(row,action,note,context){if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(row?.id)||!Number.isSafeInteger(row.version)||row.version<1||!['submit','approve','return','publish','withdraw','remove'].includes(action)||typeof note!=='string'||note.length>500)throw Error('Invalid review.');const result=await rpc('review_catalog_entry',{p_id:row.id,p_expected_version:row.version,p_action:action,p_note:note},context);if(!Number.isSafeInteger(result)||result<0)throw Error('Review was not confirmed.');return result;},async history(id,context){const rows=await rpc('catalog_entry_history',{p_id:id},context);if(!Array.isArray(rows)||rows.length>2000||rows.some(row=>!Number.isSafeInteger(row?.version)||typeof row.action!=='string'||typeof row.note!=='string'||validateItem(row.item).length))throw Error('History unavailable.');return rows.map(({version,action,note,item,occurred_at})=>({version,action,note,item,occurred_at}));}});
}
