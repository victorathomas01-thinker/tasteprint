import {validPlanId} from './plans-core.js';
export function reflectionAnswers(value){
 const {attendance,enjoyment=null,again=null}=value||{};
 if(!['attended','did_not_attend','prefer_not_to_say'].includes(attendance)||!(enjoyment===null||['enjoyed','mixed','did_not_enjoy'].includes(enjoyment))||!(again===null||['yes','no','unsure'].includes(again))||attendance!=='attended'&&enjoyment!==null)throw Error('Choose valid feedback. Enjoyment applies only if you attended.');
 return {attendance,enjoyment,again};
}
export function reflectionRow(value,id,revision){
 if(value===null)return null;
 if(!validPlanId(value?.plan_id)||value.plan_id!==id||value.revision!==revision||!Number.isInteger(revision)||revision<1||typeof value.updated_at!=='string'||!Number.isFinite(Date.parse(value.updated_at))||Object.keys(value).some(key=>!['plan_id','revision','attendance','enjoyment','again','updated_at'].includes(key)))throw Error('Private feedback unavailable.');
 return {plan_id:id,revision,...reflectionAnswers(value),updated_at:value.updated_at};
}
export function reflectionOpen(plan,now=Date.now()){
 return Boolean(plan&&['scheduled','completed_self_reported'].includes(plan.state)&&Number.isFinite(Date.parse(plan.details?.starts_at))&&Date.parse(plan.details.starts_at)<=now);
}
