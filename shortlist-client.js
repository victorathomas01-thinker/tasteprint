import {normalizeRequirements,validateDecision} from './shortlist-requirements.js';
import {authenticatedSocialRequest} from './social-request.js';
import {validPlanId as validId,safeIdeaURL} from './plans-core.js';
import {shortlistSnapshot} from './shortlist-core.js';
export function shortlistClient(config={}){
 const checked=config.requirements===true;
 const revision=context=>{if(!Number.isSafeInteger(context?.revision)||context.revision<0)throw Error('Refresh shared requirements.');return context.revision;};
 const send=authenticatedSocialRequest({...config,label:'Shared shortlists'});
 const uuid=value=>{if(!validId(value))throw Error('Shortlist unavailable.');return value;};
 const rpc=(name,body,context)=>{if(!validId(context?.actor))throw Error('Confirm your current account.');return send('rpc/'+name,{body,expectedActor:context.actor});};
 return Object.freeze({
  async read(connection,context){const result=shortlistSnapshot(await rpc(checked?'tasteprint_read_checked_shortlist':'tasteprint_read_shared_shortlist',{p_connection_id:uuid(connection)},context),context.actor,connection);if(checked)validateDecision(result.decision,[result.connection.inviter_id,result.connection.recipient_id]);return result;},
  async add(connection,title,url=null,catalogId=null,context){if(typeof title!=='string'||!title.trim()||title.trim().length>120||url!==null&&(!safeIdeaURL(url)||url.length>2048)||catalogId!==null&&!/^[a-z0-9][a-z0-9-]{0,63}$/.test(catalogId))throw Error('Add a title and optional HTTPS source without credentials.');const result=await rpc('tasteprint_add_shortlist_option',{p_connection_id:uuid(connection),p_title:title.trim(),p_url:url,p_catalog_id:catalogId},context);return uuid(result);},
  async respond(connection,option,action,context){if(!['interest','pass','clear','remove','choose','unchoose'].includes(action))throw Error('Invalid shortlist action.');const result=await rpc(checked?'tasteprint_respond_checked_shortlist':'tasteprint_respond_shortlist',{p_connection_id:uuid(connection),p_option_id:uuid(option),p_action:action,...(checked?{p_expected_revision:revision(context)}:{})},context);if(result!==true)throw Error('Could not confirm your response.');return true;},
  async repeat(connection,option,context){return uuid(await rpc('tasteprint_repeat_shortlist_option',{p_connection_id:uuid(connection),p_option_id:uuid(option)},context));},
  async plan(connection,option,context){return uuid(await rpc(checked?'tasteprint_plan_checked_shortlist':'tasteprint_plan_from_shortlist',{p_connection_id:uuid(connection),p_option_id:uuid(option),...(checked?{p_expected_revision:revision(context)}:{})},context));},
  async saveRequirements(connection,value,context){if(!checked)throw Error('Shared requirements are not enabled.');const expected=revision(context);const result=await rpc('tasteprint_save_shortlist_requirements',{p_connection_id:uuid(connection),p_expected_revision:expected,p_requirements:normalizeRequirements(value)},context);if(!Number.isSafeInteger(result)||![expected,expected+1].includes(result))throw Error('Could not confirm requirements.');return result;},
  async eraseRequirements(connection,context){if(!checked)throw Error('Shared requirements are not enabled.');if(await rpc('tasteprint_erase_my_shortlist_requirements',{p_connection_id:uuid(connection)},context)!==true)throw Error('Could not confirm erasure.');return true;},
  async export(connection,context){const result=await rpc(checked?'tasteprint_export_checked_shortlist':'tasteprint_export_my_shortlist',{p_connection_id:uuid(connection)},context);if(result?.version!==1||result.connection_id!==connection||!Array.isArray(result.own_suggestions)||!Array.isArray(result.own_responses))throw Error('Invalid shortlist export.');return result;}
 });
}
