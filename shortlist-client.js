import {authenticatedSocialRequest} from './social-request.js';
import {validPlanId as validId,safeIdeaURL} from './plans-core.js';
import {shortlistSnapshot} from './shortlist-core.js';
export function shortlistClient(config={}){
 const send=authenticatedSocialRequest({...config,label:'Shared shortlists'});
 const uuid=value=>{if(!validId(value))throw Error('Shortlist unavailable.');return value;};
 const rpc=(name,body,context)=>{if(!validId(context?.actor))throw Error('Confirm your current account.');return send('rpc/'+name,{body,expectedActor:context.actor});};
 return Object.freeze({
  async read(connection,context){return shortlistSnapshot(await rpc('tasteprint_read_shared_shortlist',{p_connection_id:uuid(connection)},context),context.actor,connection);},
  async add(connection,title,url=null,catalogId=null,context){if(typeof title!=='string'||!title.trim()||title.trim().length>120||url!==null&&(!safeIdeaURL(url)||url.length>2048)||catalogId!==null&&!/^[a-z0-9][a-z0-9-]{0,63}$/.test(catalogId))throw Error('Add a title and optional HTTPS source without credentials.');const result=await rpc('tasteprint_add_shortlist_option',{p_connection_id:uuid(connection),p_title:title.trim(),p_url:url,p_catalog_id:catalogId},context);return uuid(result);},
  async respond(connection,option,action,context){if(!['interest','pass','clear','remove','choose','unchoose'].includes(action))throw Error('Invalid shortlist action.');const result=await rpc('tasteprint_respond_shortlist',{p_connection_id:uuid(connection),p_option_id:uuid(option),p_action:action},context);if(result!==true)throw Error('Could not confirm your response.');return true;},
  async repeat(connection,option,context){return uuid(await rpc('tasteprint_repeat_shortlist_option',{p_connection_id:uuid(connection),p_option_id:uuid(option)},context));},
  async plan(connection,option,context){return uuid(await rpc('tasteprint_plan_from_shortlist',{p_connection_id:uuid(connection),p_option_id:uuid(option)},context));},
  async export(connection,context){const result=await rpc('tasteprint_export_my_shortlist',{p_connection_id:uuid(connection)},context);if(result?.version!==1||result.connection_id!==connection||!Array.isArray(result.own_suggestions)||!Array.isArray(result.own_responses))throw Error('Invalid shortlist export.');return result;}
 });
}
