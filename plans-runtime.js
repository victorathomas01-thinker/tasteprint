import {planReflectionClient} from './reflection-client.js';
import {watchSocialActor} from './social-auth-lifecycle.js';
import {loadConsumerCatalog,catalogUnavailable} from './consumer-catalog.js';
import {plansRoute} from './navigation-core.js';
import {mountPlans} from './plans-view.js';
import {privatePlansClient} from './private-plans-client.js';
import {currentSupabaseSession,supabaseAuthClient} from './supabase-auth.js';
import {SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY} from './supabase-public.js';
if(plansRoute(new URL(location.href).searchParams)){
 document.body.classList.add('is-private-plans');document.title='Private plans · Tasteprint';
 const enabled=import.meta.env.VITE_PRIVATE_PLANS_ENABLED==='true'&&SUPABASE_PUBLIC_ENABLED;
 const client=enabled?privatePlansClient({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession}):null;
 const selectedItem=new URL(location.href).searchParams.get('item');let catalog,item;
 if(selectedItem){try{catalog=await loadConsumerCatalog();item=catalog.items.find(item=>item.id===selectedItem);}catch{catalogUnavailable(document.querySelector('#app'));}}
 if(!selectedItem||item){
 const reflectionClient=enabled&&import.meta.env.VITE_PRIVATE_REFLECTION_ENABLED==='true'?planReflectionClient({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession}):null;
 const view=mountPlans({reflectionClient,app:document.querySelector('#app'),client,getSession:currentSupabaseSession,initialIdea:item?{title:item.title,url:item.action_url}:null});
 // Clear visible participant information immediately after a session changes.
 if(enabled)watchSocialActor(supabaseAuthClient.auth,view);
 }else if(catalog){document.querySelector('#app').innerHTML='<section class="panel pad"><h1>This idea is unavailable.</h1><p>It is not in the current catalog. No replacement or private draft was selected.</p><a href="?discover=1">Browse current ideas</a> · <a href="?plans=1">Open existing plans</a></section>';}
}
