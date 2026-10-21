// Transport seam for approved staging later. Not mounted or activated by the UI.
// Participant identity always comes from the Auth JWT, never caller-supplied IDs.
export function privatePlansClient({url='',publicKey='',getSession,request=globalThis.fetch,timeoutMs=10000}={}) {
 const base=String(url).replace(/\/$/,'');
 if(base){let parsed;try{parsed=new URL(base);}catch{throw Error('Use an approved HTTPS backend URL.');}if(parsed.username||parsed.password||parsed.search||parsed.hash||!(parsed.protocol==='https:'||(parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))))throw Error('Use an approved HTTPS backend URL.');}
 const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
 async function send(path,{body,method='POST'}={}) {
  if(!base||!publicKey)throw Error('Private plans require approved backend configuration.');
  let session;try{session=await getSession?.();}catch{throw Error('Sign in again to access private plans.');}
  if(!session?.access_token)throw Error('Sign in to access private plans.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   let response;
   try{response=await request(`${base}/rest/v1/${path}`,{method,headers:{apikey:publicKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});}
   catch{throw Error(controller.signal.aborted?'Private plan request timed out. Try again.':'Private plans are unavailable. Try again.');}
   if(!response.ok)throw Error(response.status===401?'Sign in again to access private plans.':`Private plan request failed (${response.status}). No local response was substituted.`);
   try{return await response.json();}catch{throw Error('Private plans returned an invalid response.');}
  }finally{clearTimeout(timer);}
 }
 const rpc=(name,body)=>send(`rpc/${name}`,{body});
 const planId=id=>{if(!uuid(id))throw Error('Invalid private plan ID.');return id;};
 return Object.freeze({
  create(title,ideaURL=null){return rpc('tasteprint_create_private_plan',{p_title:title,p_idea_url:ideaURL});},
  accept(token){if(typeof token!=='string'||! /^[0-9a-f]{64}$/.test(token))throw Error('Invitation unavailable.');return rpc('tasteprint_accept_plan_invite',{p_token:token});},
  respond(id,action,revision,details=null){return rpc('tasteprint_respond_private_plan',{p_plan_id:planId(id),p_action:action,p_revision:revision,p_details:details});},
  deleteCreatedPlan(id){return rpc('tasteprint_delete_my_private_plan',{p_plan_id:planId(id)});},
  async read(id){const rows=await send(`tasteprint_social_plans?id=eq.${planId(id)}&select=id,title,idea_url,state,revision,details,expires_at`,{method:'GET'});if(!Array.isArray(rows)||rows.length!==1)throw Error('Plan unavailable.');const plan=rows[0];return plan.expires_at&&Date.parse(plan.expires_at)<=Date.now()?{...plan,state:'expired'}:plan;}
 });
}
