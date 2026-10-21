// Shared authenticated HTTP boundary. No local fallback or actor impersonation.
export function authenticatedSocialRequest({url='',publicKey='',getSession,request=globalThis.fetch,timeoutMs=10000,label='Private plans'}={}) {
 const base=String(url).replace(/\/$/,'');
 const singular=label.replace(/s$/,'');
 if(base){let parsed;try{parsed=new URL(base);}catch{throw Error('Use an approved HTTPS backend URL.');}if(parsed.username||parsed.password||parsed.search||parsed.hash||!(parsed.protocol==='https:'||(parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))))throw Error('Use an approved HTTPS backend URL.');}
 async function send(path,{body,method='POST',empty=false,expectedActor=null}={}) {
  if(!base||!publicKey)throw Error(`${label} require approved backend configuration.`);
  let session;try{session=await getSession?.();}catch{throw Error(`Sign in again to access ${label.toLowerCase()}.`);}
  if(!session?.access_token)throw Error(`Sign in to access ${label.toLowerCase()}.`);
  if(expectedActor&&session.user?.id!==expectedActor)throw Error('Account changed. Reload and try again.');
  if(typeof body==='function')body=body(session);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   let response;
   try{response=await request(`${base}/rest/v1/${path}`,{method,headers:{apikey:publicKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});}
   catch{throw Error(controller.signal.aborted?`${singular} request timed out. Try again.`:`${label} are unavailable. Try again.`);}
   if(!response.ok)throw Error(response.status===401?`Sign in again to access ${label.toLowerCase()}.`:`${singular} request failed (${response.status}). No local response was substituted.`);
   if(empty||response.status===204)return null;
   try{return await response.json();}catch{throw Error(`${label} returned an invalid response.`);}
  }finally{clearTimeout(timer);}
 }
 return send;
}
