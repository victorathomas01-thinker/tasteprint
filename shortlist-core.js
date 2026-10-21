import {validPlanId as validId,safeIdeaURL} from './plans-core.js';
import {validConnection} from './friends-core.js';
export function shortlistSnapshot(value,actor,connection){
 const fail=()=>{throw Error('Shared shortlist unavailable.');};
 if(value?.version!==1||!validConnection(value.connection)||value.connection.state!=='accepted'||value.connection.id!==connection||![value.connection.inviter_id,value.connection.recipient_id].includes(actor)||!Array.isArray(value.options)||value.options.length>50||!Array.isArray(value.choices)||value.choices.length>2)fail();
 const actors=[value.connection.inviter_id,value.connection.recipient_id],ids=new Set();
 for(const option of value.options){
  if(!validId(option?.id)||ids.has(option.id)||!actors.includes(option.added_by)||typeof option.title!=='string'||!option.title.trim()||option.title.length>120||!(option.idea_url===null||typeof option.idea_url==='string'&&option.idea_url.length<=2048&&safeIdeaURL(option.idea_url))||!(option.catalog_id===null||typeof option.catalog_id==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(option.catalog_id))||(option.repeat_of!=null&&!validId(option.repeat_of))||typeof option.planned!=='boolean'||(!option.planned&&option.plan_id!==null)||!(option.plan_id===null||validId(option.plan_id))||!Array.isArray(option.responses)||option.responses.length>2)fail();
  const seen=new Set();for(const row of option.responses){if(!actors.includes(row.actor_id)||seen.has(row.actor_id)||!['interested','dismissed'].includes(row.response))fail();seen.add(row.actor_id);}ids.add(option.id);
 }
 const seen=new Set();for(const choice of value.choices){if(!actors.includes(choice.actor_id)||seen.has(choice.actor_id)||!ids.has(choice.option_id))fail();seen.add(choice.actor_id);}
 return structuredClone(value);
}
export function shortlistDecision(snapshot,option,actor){
 const mine=option.responses.find(row=>row.actor_id===actor)?.response||'not answered';
 const other=option.responses.find(row=>row.actor_id!==actor)?.response||'not answered';
 const mineChosen=snapshot.choices.some(row=>row.actor_id===actor&&row.option_id===option.id);
 const bothChosen=snapshot.choices.filter(row=>row.option_id===option.id).length===2&&option.responses.filter(row=>row.response==='interested').length===2;
 return {mine,other,mineChosen,bothChosen,canChoose:mine==='interested'&&!option.planned};
}
// Never turn a caller-supplied catalog ID into verified source/ranking metadata.
export function catalogReference(option,catalog){
 return catalog.find(item=>item.id===option.catalog_id&&item.title===option.title&&safeIdeaURL(item.action_url||item.source.url)===safeIdeaURL(option.idea_url))||null;
}
