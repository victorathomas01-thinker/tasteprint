import {sanitizeInterests} from './interests-core.js';
// Session intent is an in-memory lens, never a change to sharing or hard avoids.
export function visitTastes(durable,selected=[]){
 const current=sanitizeInterests(durable);
 return sanitizeInterests({...current,liked:[...current.liked,...selected]});
}
export function rememberVisitLikes(durable,selected=[]){return visitTastes(durable,selected);}
export function saveScopeCopy(accountCopies=false){
 return accountCopies?'Saved on this device. Optional account copies are managed in Passport; these saves are not uploaded automatically.':'Saved on this device only. Account backup is not enabled in this build.';
}
