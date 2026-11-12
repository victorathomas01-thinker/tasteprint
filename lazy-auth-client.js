// The optional SDK must not suspend evaluation of the whole application.
// Keep the existing, used SDK surface; the real SDK still owns sessions and JWTs.
export function lazyAuthClient({loadSdk,create,timeoutMs=10000}){
 if(typeof loadSdk!=='function'||typeof create!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<=0)throw Error('Invalid account loader.');
 let pending;
 const unavailable=()=>Error('Account client could not be initialized. Reload to retry.');
 const load=()=>pending??=(async()=>{
  let timer;
  try{
   const sdk=await Promise.race([Promise.resolve().then(loadSdk),new Promise((_,reject)=>{timer=setTimeout(()=>reject(unavailable()),timeoutMs);})]);
   // A late SDK resolution after timeout cannot reach this constructor.
   const client=create(sdk);if(!client?.auth||typeof client.rpc!=='function')throw unavailable();return client;
  }catch{throw unavailable();}finally{clearTimeout(timer);}
 })();
 const auth={
  onAuthStateChange(callback){
   let active=true,subscription;
   void load().then(client=>{if(active)subscription=client.auth.onAuthStateChange((...args)=>{if(active)callback(...args);}).data.subscription;},()=>{});
   return {data:{subscription:{unsubscribe(){active=false;subscription?.unsubscribe();}}}};
  }
 };
 for(const name of ['getSession','signInWithOtp','signOut'])auth[name]=async(...args)=>{
  let client;try{client=await load();}catch{return {data:{session:null,user:null},error:unavailable()};}
  return client.auth[name](...args);
 };
 return Object.freeze({auth:Object.freeze(auth),async rpc(...args){let client;try{client=await load();}catch{return {data:null,error:unavailable()};}return client.rpc(...args);}});
}
