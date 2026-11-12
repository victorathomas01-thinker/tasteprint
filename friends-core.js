import {INTERESTS} from './interests-core.js';
import {validPlanId} from './plans-core.js';
const known=new Set(INTERESTS.map(x=>x.id));
export function friendShare(alias,interests){
 if(typeof alias!=='string'||!alias.trim()||alias.trim().length>40||!Array.isArray(interests)||interests.length>12||interests.some(x=>!known.has(x)))throw Error('Choose a display alias and known interests only.');
 return {alias:alias.trim(),interests:[...new Set(interests)].sort()};
}
export function validConnection(row){
 try{
  if(!validPlanId(row?.id)||!validPlanId(row.inviter_id)||!['invited','pending','accepted'].includes(row.state))return false;
  friendShare(row.inviter_share?.alias,row.inviter_share?.interests);
  if(row.state==='invited'){if(row.recipient_id!==null||row.recipient_share!==null)return false;}
  else{if(!validPlanId(row.recipient_id)||row.recipient_id===row.inviter_id)return false;friendShare(row.recipient_share?.alias,row.recipient_share?.interests);}
  return row.state==='accepted'?row.expires_at===null:typeof row.expires_at==='string'&&Number.isFinite(Date.parse(row.expires_at));
 }catch{return false;}
}
export function ownFriendShare(row,actor){
 if(!validConnection(row)||![row.inviter_id,row.recipient_id].includes(actor))throw Error('Connection unavailable.');
 return actor===row.inviter_id?row.inviter_share:row.recipient_share;
}
