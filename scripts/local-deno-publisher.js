// Owned loopback Deno process for synthetic integration tests. Never deploys.
import {execFileSync,spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function startLocalDenoPublisher({root,temp,environment}){
 const executable=process.env.TASTEPRINT_DENO_EXECUTABLE||'deno';
 const baseEnvironment={PATH:process.env.PATH,DENO_DIR:process.env.DENO_DIR||join(temp,'deno-cache'),DENO_TLS_CA_STORE:'system,mozilla'};
 const version=execFileSync(executable,['--version'],{env:baseEnvironment,encoding:'utf8'});
 if(!version.startsWith('deno 2.6.0 '))throw Error('This synthetic Deno check requires the reviewed Deno 2.6.0 runtime.');
 const source=join(root,'supabase/functions/publish-campaign/index.ts'),lock=join(root,'supabase/publish-deno.lock');
 // Only public module downloads occur here, before any synthetic key is supplied.
 execFileSync(executable,['cache','--no-config','--frozen','--lock='+lock,source],{env:baseEnvironment,stdio:['ignore','ignore','pipe'],timeout:120000});
 const wrapper=join(temp,'deno-publisher.js');
 await writeFile(wrapper,`const serve=Deno.serve.bind(Deno);Deno.serve=handler=>serve({hostname:'127.0.0.1',port:0,onListen:({port})=>console.log('TASTEPRINT_EDGE_READY '+port)},handler);await import(${JSON.stringify(pathToFileURL(source).href)});\n`,{mode:0o600});
 // SDK modules are cached/frozen. Runtime egress is limited to loopback; only
 // generated synthetic credentials and the minimum runtime environment exist.
 const child=spawn(executable,['run','--no-config','--cached-only','--frozen','--lock='+lock,'--allow-net=127.0.0.1','--allow-env',wrapper],{env:{...baseEnvironment,...environment},stdio:['ignore','pipe','pipe']});
 let output='',diagnostic='';child.stdout.on('data',chunk=>{output=(output+chunk).slice(-1000);});child.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk).slice(-2000);});
 const close=async()=>{if(child.exitCode!==null||child.signalCode!==null)return;const done=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await done;};
 try{
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){
   const match=output.match(/TASTEPRINT_EDGE_READY (\d+)/);
   if(match){const port=Number(match[1]);if(port>0&&port<=65535)return {target:'http://127.0.0.1:'+port,close};}
   if(child.exitCode!==null)throw Error('Local Deno publisher exited before readiness (code '+child.exitCode+', '+(diagnostic.includes('NotCapable')?'permission failure':diagnostic.includes('SyntaxError')?'syntax failure':'runtime failure')+').');
   await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw Error('Local Deno publisher did not become ready.');
 }catch(error){await close();await writeFile(join(temp,'deno-failure.log'),diagnostic,{mode:0o600});throw error;}
}
