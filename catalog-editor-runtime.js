import {catalogEditorRoute} from './navigation-core.js';
// Keep contributor tools off the initial consumer download.
if(catalogEditorRoute(new URL(location.href).searchParams)){
  try{await import('./catalog-editor.js');}
  catch{const app=document.querySelector('#app');app.textContent='Catalog tools could not load. Reload to retry. Existing local drafts have not been changed.';app.setAttribute('role','alert');}
}
