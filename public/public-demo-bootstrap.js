// Public demo only. GitHub Pages project paths share an origin, so never use the
// production app's storage keys. Native Storage remains unchanged for other sites.
(()=>{
  'use strict';
  const prefix='tasteprint.public-demo.v1:';
  function scoped(name){
    const native=()=>window[name];
    const keys=()=>{const store=native(),result=[];for(let i=0;i<store.length;i++){const key=store.key(i);if(key?.startsWith(prefix))result.push(key.slice(prefix.length));}return result;};
    return Object.freeze({
      get length(){return keys().length;},
      key(index){return keys()[Number(index)]??null;},
      getItem(key){return native().getItem(prefix+String(key));},
      setItem(key,value){native().setItem(prefix+String(key),String(value));},
      removeItem(key){native().removeItem(prefix+String(key));},
      clear(){for(const key of keys())native().removeItem(prefix+key);}
    });
  }
  Object.defineProperty(globalThis,'__tasteprintPublicDemoStorage',{value:Object.freeze({localStorage:scoped('localStorage'),sessionStorage:scoped('sessionStorage')}),writable:false,configurable:false});
  // The script-free guide already labels its boundaries and needs no bootstrap.
  const show=()=>{
    const banner=document.createElement('aside');
    banner.setAttribute('aria-label','Public demo notice');
    banner.style.cssText='padding:12px 20px;background:#18251a;color:#e5f4df;border-bottom:1px solid #486644;font:14px/1.5 system-ui,sans-serif;text-align:center';
    const label=document.createElement('strong');label.textContent='PUBLIC DEMO · ';
    const link=document.createElement('a');link.href='./demo.html';link.textContent='Open the demo guide';link.style.color='inherit';
    banner.append(label,'Use sample details. Friend responses are simulated; no accounts or bookings. ',link);
    document.body.prepend(banner);
  };
  document.addEventListener('DOMContentLoaded',show,{once:true});
})();
