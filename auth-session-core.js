// Bound SDK recovery itself, including providers that never settle. This cannot
// cancel an SDK refresh already in progress; its later Auth event is handled normally.
export async function recoverAuthSession(auth,{timeoutMs=10000}={}){
 if(!auth)return null;
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw Error('Use a positive session recovery deadline.');
 let timer;const timeoutError=Error('Account session recovery timed out. Try again.');
 const pending=Promise.resolve().then(()=>auth.getSession()).then(result=>{
  if(result?.error)throw Error('Account session is unavailable. Try again.');
  if(!result?.data||!Object.hasOwn(result.data,'session'))throw Error('Account session is unavailable. Try again.');
  return result.data.session||null;
 });
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(timeoutError),timeoutMs);});
 try{return await Promise.race([pending,deadline]);}catch(error){if(error===timeoutError)throw error;throw Error('Account session is unavailable. Try again.');}finally{clearTimeout(timer);}
}
