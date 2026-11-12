// Shared authenticated HTTP boundary. The deadline covers Auth, HTTP and parsing.
export function authenticatedSocialRequest({url='',publicKey='',getSession,request=globalThis.fetch,timeoutMs=10000,label='Private plans'}={}) {
 const base=String(url).replace(/\/$/,'');
 const singular=label.replace(/s$/,'');
 if(base){let parsed;try{parsed=new URL(base);}catch{throw Error('Use an approved HTTPS backend URL.');}if(parsed.username||parsed.password||parsed.search||parsed.hash||!(parsed.protocol==='https:'||(parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))))throw Error('Use an approved HTTPS backend URL.');}
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw Error('Use a positive request deadline.');
 return async function send(path,{body,method='POST',empty=false,expectedActor=null,api='rest/v1',headers={},guard=()=>true}={}) {
  if(!base||!publicKey)throw Error(`${label} require approved backend configuration.`);
  if(!['rest/v1','functions/v1'].includes(api))throw Error('Invalid backend API.');
  const controller=new AbortController();
  let timer;
  const assertCurrent=()=>{if(controller.signal.aborted)throw Error(`${singular} request timed out. Try again.`);if(!guard())throw Error('Account changed. Reload and try again.');};
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error(`${singular} request timed out. Try again.`));},timeoutMs);});
  const operation=(async()=>{
   assertCurrent();
   let session;try{session=await getSession?.();}catch{assertCurrent();throw Error(`Sign in again to access ${label.toLowerCase()}.`);}
   assertCurrent();
   if(!session?.access_token)throw Error(`Sign in to access ${label.toLowerCase()}.`);
   if(expectedActor&&session.user?.id!==expectedActor)throw Error('Account changed. Reload and try again.');
   if(typeof body==='function')body=body(session);
   let response;
   try{response=await request(`${base}/${api}/${path}`,{method,headers:{...headers,apikey:publicKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});}
   catch{assertCurrent();throw Error(`${label} are unavailable. Try again.`);}
   assertCurrent();
   if(!response.ok){
    // The one actionable deletion refusal is public; never expose arbitrary backend bodies.
    if(api==='functions/v1'&&response.status===409){const payload=await response.json().catch(()=>null);assertCurrent();if(payload?.error==='workspace_ownership_exists'){const error=Error('Transfer or delete the owned Campaign Workspace first.');error.code='workspace_ownership_exists';throw error;}}
    throw Error(response.status===401?`Sign in again to access ${label.toLowerCase()}.`:`${singular} request failed (${response.status}). No local response was substituted.`);
   }
   if(empty||response.status===204)return null;
   let result;try{result=await response.json();}catch{assertCurrent();throw Error(`${label} returned an invalid response.`);}
   assertCurrent();return result;
  })();
  try{return await Promise.race([operation,deadline]);}finally{clearTimeout(timer);}
 };
}
