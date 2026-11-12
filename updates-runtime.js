import {updatesRoute} from './navigation-core.js';
if(updatesRoute(new URL(location.href).searchParams)){
 const app=document.querySelector('#app');app.textContent='Loading private updates…';
 try{
  const [{mountUpdates},{updatesClient},{watchSocialActor},{currentSupabaseSession,supabaseAuthClient},{SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY}]=await Promise.all([import('./updates-view.js'),import('./updates-client.js'),import('./social-auth-lifecycle.js'),import('./supabase-auth.js'),import('./supabase-public.js')]);
  document.title='Private updates · Tasteprint';
  const enabled=import.meta.env.VITE_PRIVATE_UPDATES_ENABLED==='true'&&SUPABASE_PUBLIC_ENABLED;
  const view=mountUpdates({app,client:enabled?updatesClient({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession}):null,getSession:currentSupabaseSession});
  if(enabled)watchSocialActor(supabaseAuthClient.auth,view);
 }catch{app.textContent='Private updates could not load. Reload to retry.';app.setAttribute('role','alert');}
}
