import {catalogItems} from './catalog.js';
import {SUPABASE_PUBLIC_ENABLED,SUPABASE_URL,SUPABASE_PUBLIC_KEY} from './supabase-public.js';
import {readPublishedCatalog} from './published-catalog-client.js';
// Configured mode has one editorial authority. Missing/withdrawn records must not
// reappear from a bundled reference or a private device workbench.
export async function loadConsumerCatalog({enabled=import.meta.env?.VITE_REVIEWED_CATALOG_ENABLED==='true',configured=SUPABASE_PUBLIC_ENABLED,url=SUPABASE_URL,publicKey=SUPABASE_PUBLIC_KEY,...options}={}){
 if(!enabled)return {source:'bundled',items:catalogItems()};
 if(!configured)throw Error('Reviewed catalog configuration is unavailable.');
 return {source:'published',items:await readPublishedCatalog({url,publicKey,...options})};
}
export function catalogUnavailable(app){
 app.innerHTML='<section class="panel pad discovery-view"><h1 tabindex="-1">The catalog is temporarily unavailable.</h1><p role="alert">Current listings could not be checked. Your saved choices were kept. No bundled reference or private draft was substituted.</p><button class="secondary" data-catalog-retry>Retry current catalog</button><div class="row"><a class="secondary" href="?profile=1">My Passport</a><a class="secondary" href="?plans=1">Open existing plans</a></div></section>';
 app.querySelector('[data-catalog-retry]').onclick=()=>location.reload();
}
