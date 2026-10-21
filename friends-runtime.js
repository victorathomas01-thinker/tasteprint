import {watchSocialActor} from './social-auth-lifecycle.js';
import {friendsRoute} from './navigation-core.js';
if(friendsRoute(new URL(location.href).searchParams)){
 document.querySelector('#app').textContent='Loading private friends…';
 try{
  const [{mountFriends},{friendsClient},{privatePlansClient},{currentSupabaseSession,supabaseAuthClient},{SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY}]=await Promise.all([import('./friends-view.js'),import('./friends-client.js'),import('./private-plans-client.js'),import('./supabase-auth.js'),import('./supabase-public.js')]);
  document.body.classList.add('is-private-friends');document.title='Private friends · Tasteprint';
  const enabled=import.meta.env.VITE_PRIVATE_FRIENDS_ENABLED==='true'&&SUPABASE_PUBLIC_ENABLED;
  const config={url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession};
  const view=mountFriends({app:document.querySelector('#app'),client:enabled?friendsClient(config):null,blockClient:enabled?privatePlansClient(config):null,getSession:currentSupabaseSession});
  if(enabled)watchSocialActor(supabaseAuthClient.auth,view);
 }catch{const app=document.querySelector('#app');app.textContent='Private friends could not load. Reload to retry; no local connection was substituted.';app.setAttribute('role','alert');}
}
