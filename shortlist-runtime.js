import {watchSocialActor} from './social-auth-lifecycle.js';
import {loadConsumerCatalog} from './consumer-catalog.js';
import {socialRoute} from './navigation-core.js';
const params=new URL(location.href).searchParams;
if(socialRoute(params)==='together'&&params.has('connection')){
 const app=document.querySelector('#app');app.textContent='Loading private shared shortlist…';
 try{
  const [{mountShortlist},{shortlistClient},{friendsClient},{validPlanId},{currentSupabaseSession,supabaseAuthClient},{SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY}]=await Promise.all([import('./shortlist-view.js'),import('./shortlist-client.js'),import('./friends-client.js'),import('./plans-core.js'),import('./supabase-auth.js'),import('./supabase-public.js')]);
  document.body.classList.add('is-shared-shortlist');document.title='Together shared shortlist · Tasteprint';
  const connection=params.get('connection');
  if(!validPlanId(connection)){app.innerHTML='<section class="panel pad"><h1>This shared shortlist link is invalid.</h1><a href="?friends=1">Open Friends</a></section>';}
  else{
   const enabled=SUPABASE_PUBLIC_ENABLED&&import.meta.env.VITE_PRIVATE_SHORTLISTS_ENABLED==='true'&&import.meta.env.VITE_PRIVATE_FRIENDS_ENABLED==='true'&&import.meta.env.VITE_PRIVATE_PLANS_ENABLED==='true';
   const requirements=enabled&&import.meta.env.VITE_SHORTLIST_REQUIREMENTS_ENABLED==='true'&&import.meta.env.VITE_REVIEWED_CATALOG_ENABLED==='true';
   const config={requirements,url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession};
   let catalog={items:[]},catalogError=false;if(enabled)try{catalog=await loadConsumerCatalog();}catch{catalogError=true;}
   const view=mountShortlist({app,connection,items:catalog.items,catalogError,requirements,client:enabled?shortlistClient(config):null,friends:enabled?friendsClient(config):null,getSession:currentSupabaseSession});
   if(enabled)watchSocialActor(supabaseAuthClient.auth,view);
  }
 }catch{app.textContent='Shared shortlist could not load. Reload to retry. No simulated decisions were substituted.';app.setAttribute('role','alert');}
}
