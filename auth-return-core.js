// A failed provider return is untrusted input. Never display its description or
// let a mixed error/token callback replace a currently valid account.
export const AUTH_RETURN_MESSAGE='This sign-in link could not be used. Request a new link. Your device data was kept.';
const authKeys=['error','error_code','error_description','sb','access_token','refresh_token','provider_token','provider_refresh_token','id_token','token','token_hash','expires_in','expires_at','token_type','type','code'];
const errorKeys=['error','error_code','error_description'];
export function failedAuthReturn(value){
 const url=new URL(value);
 if(url.searchParams.get('auth')!=='return'||!(url.searchParams.get('profile')==='1'||url.searchParams.get('workspace')==='1'))return null;
 const fragment=new URLSearchParams(url.hash.slice(1));
 if(!errorKeys.some(key=>url.searchParams.has(key)||fragment.has(key)))return null;
 const changedFragment=authKeys.some(key=>fragment.has(key));
 for(const key of authKeys){url.searchParams.delete(key);fragment.delete(key);}
 // A failed login must not silently claim a team invitation as an existing account.
 if(url.searchParams.get('workspace')==='1')url.searchParams.delete('workspaceInvite');
 if(changedFragment)url.hash=fragment.size?'#'+fragment.toString():'';
 return url.href;
}
export function authReturnNotice(failed,workspace=false){return failed?`<aside class="callout" data-auth-return-error role="alert"><p>${AUTH_RETURN_MESSAGE}</p>${workspace?'<p>For a team invitation, sign in first, then reopen the original invitation link.</p>':''}</aside>`:'';}

// Provider redirects can finish as a fragment-only navigation to the current
// callback page. Initialization alone will not run again in that case.
export function watchAuthReturns({href,replace,reload,notify,listen}){
 let reloading=false;
 const consume=(event={})=>{
  const value=href(),failed=failedAuthReturn(value);
  if(failed){try{replace(failed);}catch{}notify();return;}
  if(event.type!=='hashchange'||reloading)return;
  const url=new URL(value),fragment=new URLSearchParams(url.hash.slice(1));
  if(url.searchParams.get('auth')==='return'&&(url.searchParams.get('profile')==='1'||url.searchParams.get('workspace')==='1')&&(fragment.get('access_token')||fragment.get('refresh_token'))){
   // Let a fresh SDK instance validate the real provider credentials. Do not
   // parse them into a local session or display their contents ourselves.
   reloading=true;reload();
  }
 };
 consume();listen(consume);return consume;
}
