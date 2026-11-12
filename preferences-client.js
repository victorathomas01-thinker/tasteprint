import {authenticatedSocialRequest} from './social-request.js';
import {privatePreferenceValue,privatePreferenceRecord} from './preferences-core.js';
export function privatePreferencesClient(config){
 const send=authenticatedSocialRequest({...config,label:'Private Passport preferences'});
 const rpc=(name,body,context)=>{if(!context?.actor)throw Error('Account changed. Review your account copy again.');return send(`rpc/tasteprint_${name}`,{body,expectedActor:context.actor});};
 return Object.freeze({async read(context){return privatePreferenceRecord(await rpc('read_my_private_preferences',{},context));},async write(revision,value,context){if(!Number.isSafeInteger(revision)||revision<0)throw Error('Review current account copy.');const preferences=value===null?null:privatePreferenceValue(value);const result=privatePreferenceRecord(await rpc('write_my_private_preferences',{p_expected_revision:revision,p_preferences:preferences},context));if(result.revision!==revision+1||JSON.stringify(result.preferences)!==JSON.stringify(preferences))throw Error('Account write was not confirmed.');return result;}});
}
