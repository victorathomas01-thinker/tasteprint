import {catalogTeamRoute} from './navigation-core.js';
if(catalogTeamRoute(new URL(location.href).searchParams)){
 const app=document.querySelector('#app');app.textContent='Loading catalog review…';
 try{
  const [{mountCatalogTeam},{catalogTeamClient},{watchSocialActor},{currentSupabaseSession,supabaseAuthClient},{SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY}]=await Promise.all([import('./catalog-team-view.js'),import('./catalog-team-client.js'),import('./social-auth-lifecycle.js'),import('./supabase-auth.js'),import('./supabase-public.js')]);
  document.body.classList.add('is-catalog-team');document.title='Catalog review · Tasteprint';
  const enabled=import.meta.env.VITE_CATALOG_TEAM_ENABLED==='true'&&SUPABASE_PUBLIC_ENABLED;
  const view=mountCatalogTeam({app,client:enabled?catalogTeamClient({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession}):null,getSession:currentSupabaseSession});
  if(enabled)watchSocialActor(supabaseAuthClient.auth,view);
 }catch{app.textContent='Catalog review could not load. Reload to retry. Local work was kept.';app.setAttribute('role','alert');}
}
