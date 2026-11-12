import {authenticatedSocialRequest} from './social-request.js';
import {validPlanId} from './plans-core.js';
import {friendShare,validConnection} from './friends-core.js';
export function friendsClient(config={}){
 const send=authenticatedSocialRequest({...config,label:'Private friends'});
 const rpc=(name,body,context)=>{if(!validPlanId(context?.actor))throw Error('Confirm your current account before changing friends.');return send('rpc/'+name,{body,expectedActor:context.actor});};
 const id=value=>{if(!validPlanId(value))throw Error('Connection unavailable.');return value;};
 return Object.freeze({
  create(alias,interests=[],context){const share=friendShare(alias,interests);return rpc('tasteprint_create_friend_invite',{p_alias:share.alias,p_interests:share.interests},context);},
  async claim(token,alias,interests=[],context){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw Error('Invitation unavailable.');const share=friendShare(alias,interests);const result=await rpc('tasteprint_claim_friend_invite',{p_token:token,p_alias:share.alias,p_interests:share.interests},context);return id(result);},
  respond(connection,action,alias=null,interests=null,context){if(!['approve','remove','decline','share'].includes(action))throw Error('Invalid friend action.');const share=action==='share'?friendShare(alias,interests):null;return rpc('tasteprint_respond_friend_connection',{p_id:id(connection),p_action:action,p_alias:share?.alias||null,p_interests:share?.interests||null},context);},
  async list(context){const result=await rpc('tasteprint_my_friend_connections',{},context);if(!Array.isArray(result)||result.length>200||result.some(row=>!validConnection(row)||![row.inviter_id,row.recipient_id].includes(context.actor)))throw Error('Connections unavailable.');return result;},
  async export(context){const result=await rpc('tasteprint_export_my_friend_connections',{},context);if(result?.version!==1||!Array.isArray(result.connections)||result.connections.length>200||result.connections.some(row=>!validPlanId(row?.id)))throw Error('Invalid friend export.');return result;}
 });
}
