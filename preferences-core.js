import {savedInterests} from './saved-core.js';
export function privatePreferenceValue(value){
 const clean=savedInterests(JSON.stringify(value));
 if(!value||value.version!==1||Object.keys(clean).some(key=>!Object.hasOwn(value,key))||['liked','disliked','shared','saved','dismissed'].some(key=>JSON.stringify(clean[key])!==JSON.stringify(value[key])))throw Error('Private preferences could not be read safely.');
 return clean;
}
export function privatePreferenceRecord(value){
 if(!value||!Number.isSafeInteger(value.revision)||value.revision<0||(value.updated_at!==null&&!Number.isFinite(Date.parse(value.updated_at)))||value.revision===0&&value.preferences!==null)throw Error('Account copy unavailable.');
 return {revision:value.revision,preferences:value.preferences===null?null:privatePreferenceValue(value.preferences),updated_at:value.updated_at};
}
