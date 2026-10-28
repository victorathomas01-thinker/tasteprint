import {authenticatedSocialRequest} from './social-request.js';
import {validPlanId} from './plans-core.js';
export const updateLabels=Object.freeze({plan_joined:'Your plan invitation was joined',plan_changed:'Shared plan or response changed',friend_claimed:'Your friend invitation needs confirmation',friend_confirmed:'Your connection was confirmed',friend_changed:'Your friend’s shared profile changed'});
export function updateInbox(value){
 if(!value||typeof value.enabled!=='boolean'||!Array.isArray(value.items)||value.items.length>500||!Array.isArray(value.upcoming))throw Error('Updates unavailable.');
 const seen=new Set();
 const items=value.items.map(row=>{if(!validPlanId(row?.id)||!validPlanId(row.subject_id)||!['plan','friend'].includes(row.subject_type)||!Object.hasOwn(updateLabels,row.kind)||!row.kind.startsWith(row.subject_type+'_')||!Number.isSafeInteger(row.sequence)||row.sequence<1||typeof row.read!=='boolean'||typeof row.title!=='string'||row.title.length>120||!Number.isFinite(Date.parse(row.occurred_at))||seen.has(row.id))throw Error('Updates unavailable.');seen.add(row.id);return {id:row.id,subject_id:row.subject_id,subject_type:row.subject_type,kind:row.kind,sequence:row.sequence,read:row.read,title:row.title,occurred_at:row.occurred_at};});
 const upcoming=value.upcoming.map(row=>{if(!validPlanId(row?.id)||typeof row.title!=='string'||row.title.length>120||!Number.isFinite(Date.parse(row.starts_at)))throw Error('Updates unavailable.');return {id:row.id,title:row.title,starts_at:row.starts_at};});
 if(!value.enabled&&(items.length||upcoming.length))throw Error('Updates unavailable.');
 return {enabled:value.enabled,items,upcoming};
}
export function updatesClient(config){
 const send=authenticatedSocialRequest({...config,label:'Private updates'});
 const rpc=(name,body,context)=>{if(!context?.actor)throw Error('Account changed. Reload and try again.');return send(`rpc/tasteprint_${name}`,{body,expectedActor:context.actor});};
 return Object.freeze({async read(context){return updateInbox(await rpc('my_updates',{},context));},async enable(enabled,context){if(typeof enabled!=='boolean')throw Error('Invalid setting.');if(await rpc('set_my_updates',{p_enabled:enabled},context)!==enabled)throw Error('Setting was not confirmed.');},async mark(row,context){if(!validPlanId(row?.id)||!Number.isSafeInteger(row.sequence)||row.sequence<1)throw Error('Invalid update.');return await rpc('read_my_update',{p_id:row.id,p_sequence:row.sequence},context)===true;}});
}
