import {watchSocialActor} from './social-auth-lifecycle.js';
import {catalogItems} from './catalog.js';
import {plansRoute} from './navigation-core.js';
import {mountPlans} from './plans-view.js';
import {privatePlansClient} from './private-plans-client.js';
import {currentSupabaseSession,supabaseAuthClient} from './supabase-auth.js';
import {SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY} from './supabase-public.js';
if(plansRoute(new URL(location.href).searchParams)){
 document.body.classList.add('is-private-plans');document.title='Private plans · Tasteprint';
 const enabled=import.meta.env.VITE_PRIVATE_PLANS_ENABLED==='true'&&SUPABASE_PUBLIC_ENABLED;
 const client=enabled?privatePlansClient({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:currentSupabaseSession}):null;
 const item=catalogItems().find(item=>item.id===new URL(location.href).searchParams.get('item'));
 const view=mountPlans({app:document.querySelector('#app'),client,getSession:currentSupabaseSession,initialIdea:item?{title:item.title,url:item.action_url}:null});
 // Clear visible participant information immediately after a session changes.
 if(enabled)watchSocialActor(supabaseAuthClient.auth,view);
}
