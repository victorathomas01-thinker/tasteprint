import {SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY} from './supabase-public.js';
if(import.meta.env.VITE_PRIVATE_PREFERENCES_ENABLED==='true'&&SUPABASE_PUBLIC_ENABLED){
 let activeHost=null,view=null,subscription=null,loading=false,holds=0;
 window.addEventListener('tasteprint:interests-updated',()=>view?.refreshLocal());
 window.addEventListener('tasteprint:passport-account-operation',event=>{holds=Math.max(0,holds+(event.detail?.active?1:-1));view?.clearSession();if(!holds)setTimeout(()=>view?.reload(),0);});
 async function bind(){
  const host=document.querySelector('[data-private-preferences-host]');if(loading||host===activeHost)return;
  subscription?.unsubscribe();view?.clearSession();subscription=null;view=null;activeHost=host;if(!host)return;
  loading=true;
  try{
   const [{mountPrivatePreferences},{privatePreferencesClient},{currentSupabaseSession,supabaseAuthClient},{watchSocialActor}]=await Promise.all([import('./preferences-view.js'),import('./preferences-client.js'),import('./supabase-auth.js'),import('./social-auth-lifecycle.js')]);
   if(!host.isConnected||host!==document.querySelector('[data-private-preferences-host]')){activeHost=null;return;}
   view=mountPrivatePreferences({host,client:privatePreferencesClient({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession}),getSession:currentSupabaseSession,isBlocked:()=>holds>0});
   subscription=watchSocialActor(supabaseAuthClient.auth,view);
  }catch{if(host.isConnected)host.textContent='Private account preferences could not load. Local choices were kept.';}finally{loading=false;if(activeHost!==document.querySelector('[data-private-preferences-host]'))void bind();}
 }
 new MutationObserver(()=>void bind()).observe(document.querySelector('#app'),{childList:true,subtree:true});void bind();
}
