import {ingestCatalog,validateItem,freshness} from './catalog-core.js';
// Public editorial records only. No Passport, session, cookie, location or social data.
export async function readPublishedCatalog({url='',publicKey='',request=globalThis.fetch,timeoutMs=10000,pageSize=100,maxItems=2000,now=Date.now()}={}){
 let base;try{base=new URL(url);if(base.username||base.password||base.search||base.hash||!['','/'].includes(base.pathname)||!(base.protocol==='https:'||base.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(base.hostname)))throw Error();}catch{throw Error('Reviewed catalog configuration is unavailable.');}
 if(!publicKey||!Number.isFinite(timeoutMs)||timeoutMs<=0||!Number.isInteger(pageSize)||pageSize<1||pageSize>100||!Number.isInteger(maxItems)||maxItems<1||maxItems>10000)throw Error('Reviewed catalog configuration is unavailable.');
 const controller=new AbortController();let timer;
 const assertCurrent=()=>{if(controller.signal.aborted)throw Error('Reviewed catalog request timed out. Retry to check current listings.');};
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Reviewed catalog request timed out. Retry to check current listings.'));},timeoutMs);});
 const pending=(async()=>{
  const items=[],seen=new Set();let after='';
  for(let page=0;page<=Math.ceil(maxItems/pageSize);page++){
   assertCurrent();const headers={apikey:publicKey,'Content-Type':'application/json'};
   if(!publicKey.startsWith('sb_publishable_'))headers.Authorization=`Bearer ${publicKey}`;
   let response;try{response=await request(`${base.origin}/rest/v1/rpc/tasteprint_published_catalog`,{method:'POST',headers,body:JSON.stringify({p_after:after,p_limit:pageSize}),signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});}catch{assertCurrent();throw Error('Reviewed catalog could not be reached.');}
   assertCurrent();if(!response.ok)throw Error('Reviewed catalog is unavailable. No local listings were substituted.');
   let rows;try{rows=await response.json();}catch{throw Error('Reviewed catalog returned invalid data.');}assertCurrent();
   if(!Array.isArray(rows)||rows.length>pageSize||items.length+rows.length>maxItems)throw Error('Reviewed catalog exceeds its supported page or size limit.');
   for(const item of rows){if(validateItem(item,now).length||item.status!=='active'||freshness(item,now)!=='Source checked'||seen.has(item.id))throw Error('Reviewed catalog contains invalid, stale or duplicate records.');seen.add(item.id);items.push(item);}
   if(rows.length<pageSize){const result=ingestCatalog([],items,now);if(result.errors.length)throw Error('Reviewed catalog contains conflicting sources.');return result.items;}
   after=rows.at(-1).id;
  }
  throw Error('Reviewed catalog pagination could not be completed.');
 })();
 try{return await Promise.race([pending,timeout]);}finally{clearTimeout(timer);}
}
