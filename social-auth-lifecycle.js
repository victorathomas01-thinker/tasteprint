// Auth callbacks must not await SDK calls while its session lock is held.
// Recovery may arrive as INITIAL_SESSION, SIGNED_IN or TOKEN_REFRESHED. Preserve
// just-opened invitations unless a conflicting actor was already rendered. Logout always clears.
export function watchSocialActor(auth,view,queue=task=>setTimeout(task,0)){
 let previousActor;
 const registration=auth.onAuthStateChange((event,session)=>{
  const actor=event==='SIGNED_OUT'?null:session?.user?.id||null,displayed=view.getActor?.()||null;
  if(previousActor===undefined&&event!=='SIGNED_OUT'){
   previousActor=actor;
   if(!displayed||displayed===actor){
    if(event!=='INITIAL_SESSION'&&!displayed&&actor)queue(()=>view.reload());
    return;
   }
  }else{
   const changed=previousActor===undefined||previousActor!==actor;previousActor=actor;
   if(!changed)return;
  }
  view.clearSession();
  if(actor)queue(()=>view.reload());
 });
 return registration?.data?.subscription||registration;
}
