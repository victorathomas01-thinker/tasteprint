import {authenticatedSocialRequest} from './social-request.js';
import {validPlanId} from './plans-core.js';
import {reflectionAnswers,reflectionRow} from './reflection-core.js';
export function planReflectionClient(config){
 const send=authenticatedSocialRequest({...config,label:'Private feedback'});
 const rpc=(name,body,context)=>{if(!context?.actor)throw Error('Account changed. Reload and try again.');return send(`rpc/tasteprint_${name}`,{body,expectedActor:context.actor});};
 const id=value=>{if(!validPlanId(value))throw Error('Invalid plan ID.');return value;};
 return Object.freeze({
  async read(plan,revision,context){const result=await rpc('read_my_plan_reflection',{p_plan_id:id(plan),p_revision:revision},context);return reflectionRow(result,plan,revision);},
  async save(plan,revision,answers,context){const value=reflectionAnswers(answers);const result=await rpc('save_my_plan_reflection',{p_plan_id:id(plan),p_revision:revision,p_attendance:value.attendance,p_enjoyment:value.enjoyment,p_again:value.again},context);if(result!==true)throw Error('Feedback was not confirmed.');return true;},
  async remove(plan,context){const count=await rpc('delete_my_plan_reflections',{p_plan_id:id(plan)},context);if(!Number.isInteger(count)||count<0)throw Error('Removal unavailable.');return count;},
  async export(context){const rows=await rpc('export_my_plan_reflections',{},context);if(!Array.isArray(rows)||rows.length>10000)throw Error('Export unavailable.');const seen=new Set();return rows.map(row=>{const value=reflectionRow(row,row?.plan_id,row?.revision),key=value.plan_id+':'+value.revision;if(seen.has(key))throw Error('Invalid export.');seen.add(key);return value;});}
 });
}
