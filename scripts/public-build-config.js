// Node-only build gate. VITE_* values become public JavaScript, including unused ones.
const keys=new Set(['VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','VITE_SUPABASE_PUBLISHABLE_KEY','VITE_PRIVATE_PLANS_ENABLED','VITE_PRIVATE_FRIENDS_ENABLED','VITE_PRIVATE_SHORTLISTS_ENABLED']);
export function validatePublicBuildConfig(env={}){
 const reject=()=>{throw Error('Unsafe or invalid public build configuration. Only documented public keys and feature flags are allowed; keep server credentials outside VITE_ variables.');};
 if(Object.keys(env).some(key=>key.startsWith('VITE_')&&!keys.has(key)))reject();
 const values=Object.fromEntries([...keys].map(key=>[key,String(env[key]||'')]));
 for(const key of [...keys].filter(key=>key.endsWith('_ENABLED')))if(!['','true','false'].includes(values[key]))reject();
 const url=values.VITE_SUPABASE_URL,anon=values.VITE_SUPABASE_ANON_KEY,publishable=values.VITE_SUPABASE_PUBLISHABLE_KEY,key=publishable||anon;
 if(Boolean(url)!==Boolean(key))reject();
 if(url){let parsed;try{parsed=new URL(url);}catch{reject();}if(parsed.username||parsed.password||parsed.search||parsed.hash||!['','/'].includes(parsed.pathname)||!(parsed.protocol==='https:'||parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname)))reject();
  for(const key of [anon,publishable].filter(Boolean))if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)){
   try{const parts=key.split('.');if(parts.length!==3||!parts.every(part=>/^[A-Za-z0-9_-]+$/.test(part))||JSON.parse(Buffer.from(parts[1],'base64url').toString()).role!=='anon')reject();}catch{reject();}
  }
 }
 if([...keys].some(name=>name.endsWith('_ENABLED')&&values[name]==='true')&&!url)reject();
 if(values.VITE_PRIVATE_SHORTLISTS_ENABLED==='true'&&(values.VITE_PRIVATE_PLANS_ENABLED!=='true'||values.VITE_PRIVATE_FRIENDS_ENABLED!=='true'))reject();
 return values;
}
