// Authenticated transport; runtime activation requires a separate explicit build gate.
// Participant identity always comes from the Auth JWT, never caller-supplied IDs.
export function privatePlansClient({url='',publicKey='',getSession,request=globalThis.fetch,timeoutMs=10000}={}) {
 const base=String(url).replace(/\/$/,'');
 if(base){let parsed;try{parsed=new URL(base);}catch{throw Error('Use an approved HTTPS backend URL.');}if(parsed.username||parsed.password||parsed.search||parsed.hash||!(parsed.protocol==='https:'||(parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))))throw Error('Use an approved HTTPS backend URL.');}
 const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
 async function send(path,{body,method='POST',empty=false,expectedActor=null}={}) {
  if(!base||!publicKey)throw Error('Private plans require approved backend configuration.');
  let session;try{session=await getSession?.();}catch{throw Error('Sign in again to access private plans.');}
  if(!session?.access_token)throw Error('Sign in to access private plans.');
  if(expectedActor&&session.user?.id!==expectedActor)throw Error('Account changed during export. Start again.');
  if(typeof body==='function')body=body(session);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   let response;
   try{response=await request(`${base}/rest/v1/${path}`,{method,headers:{apikey:publicKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});}
   catch{throw Error(controller.signal.aborted?'Private plan request timed out. Try again.':'Private plans are unavailable. Try again.');}
   if(!response.ok)throw Error(response.status===401?'Sign in again to access private plans.':`Private plan request failed (${response.status}). No local response was substituted.`);
   if(empty||response.status===204)return null;
   try{return await response.json();}catch{throw Error('Private plans returned an invalid response.');}
  }finally{clearTimeout(timer);}
 }
 const expiry=plan=>plan.expires_at&&Date.parse(plan.expires_at)<=Date.now()?{...plan,state:'expired'}:plan;
 const rpc=(name,body)=>send(`rpc/${name}`,{body});
 const planId=id=>{if(!uuid(id))throw Error('Invalid private plan ID.');return id;};
 return Object.freeze({
  create(title,ideaURL=null){return rpc('tasteprint_create_private_plan',{p_title:title,p_idea_url:ideaURL});},
  accept(token){if(typeof token!=='string'||! /^[0-9a-f]{64}$/.test(token))throw Error('Invitation unavailable.');return rpc('tasteprint_accept_plan_invite',{p_token:token});},
  respond(id,action,revision,details=null){return rpc('tasteprint_respond_private_plan',{p_plan_id:planId(id),p_action:action,p_revision:revision,p_details:details});},
  deleteCreatedPlan(id){return rpc('tasteprint_delete_my_private_plan',{p_plan_id:planId(id)});},
  removeParticipation(id){return rpc('tasteprint_remove_my_plan_participation',{p_plan_id:planId(id)});},
  cleanupExpiredInvites(){return rpc('tasteprint_cleanup_my_expired_plan_invites',{});},
  async exportParticipation(){
   if(!base||!publicKey)throw Error('Private plans require approved backend configuration.');
   let session;try{session=await getSession?.();}catch{throw Error('Sign in again to export plans.');}
   const actor=session?.user?.id;if(!uuid(actor))throw Error('Sign in to export plans.');
   const records=[],seen=new Set();let after=null,lastId=null;
   for(let page=0;page<100;page++){
    const result=await send('rpc/tasteprint_export_my_plan_participation',{body:{p_after:after,p_limit:100},expectedActor:actor});
    if(result?.version!==1||!Array.isArray(result.records)||result.records.length>100||!(result.next_cursor===null||uuid(result.next_cursor)))throw Error('Invalid plan export. No partial download was created.');
    for(const row of result.records){if(!uuid(row?.plan_id)||seen.has(row.plan_id.toLowerCase())||(lastId&&row.plan_id.toLowerCase()<=lastId))throw Error('Invalid plan export. No partial download was created.');seen.add(row.plan_id.toLowerCase());lastId=row.plan_id.toLowerCase();records.push(row);}
    if(result.next_cursor===null)return {version:1,exported_at:new Date().toISOString(),scope:'Own plan participation and currently accessible shared content. Pages are not a single point-in-time snapshot.',records};
    if(!result.records.length||result.next_cursor!==result.records.at(-1).plan_id||result.next_cursor===after)throw Error('Invalid plan export. No partial download was created.');
    after=result.next_cursor;
   }
   throw Error('Export limit reached. No partial download was created.');
  },
  block(other){const blocked=planId(other);return send('tasteprint_social_blocks',{body:session=>{if(!uuid(session.user?.id)||session.user.id===blocked)throw Error('Invalid block.');return {blocker_id:session.user.id,blocked_id:blocked};},empty:true});},
  unblock(other){return send(`tasteprint_social_blocks?blocked_id=eq.${planId(other)}`,{method:'DELETE',empty:true});},
  async blocks(){const rows=await send('tasteprint_social_blocks?select=blocked_id&limit=50',{method:'GET'});if(!Array.isArray(rows))throw Error('Blocks unavailable.');return rows;},
  async list(){const rows=await send('tasteprint_social_plans?select=id,title,state,revision,expires_at&order=updated_at.desc&limit=50',{method:'GET'});if(!Array.isArray(rows))throw Error('Plans unavailable.');return rows.map(expiry);},
  async responses(id){const rows=await send(`tasteprint_social_plan_responses?plan_id=eq.${planId(id)}&select=actor_id,interest,approved_revision,completed_at`,{method:'GET'});if(!Array.isArray(rows))throw Error('Responses unavailable.');return rows;},
  async read(id){const rows=await send(`tasteprint_social_plans?id=eq.${planId(id)}&select=id,creator_id,recipient_id,title,idea_url,state,revision,details,expires_at`,{method:'GET'});if(!Array.isArray(rows)||rows.length!==1)throw Error('Plan unavailable.');const plan=rows[0];return expiry(plan);}
 });
}
