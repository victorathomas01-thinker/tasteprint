import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {validatePublicBuildConfig} from './public-build-config.js';
const output=mkdtempSync(join(tmpdir(),'tasteprint-public-demo-'));
let server;
try{
 const refusalEnv={...process.env,TASTEPRINT_PUBLIC_DEMO:'1',...validatePublicBuildConfig({}),VITE_SUPABASE_URL:'https://synthetic.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_only'};
 assert.throws(()=>execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',output],{env:refusalEnv,stdio:'pipe'}),error=>String(error.stderr).includes('Public demo must have every backend key and feature flag blank.'));
 execFileSync(process.execPath,['scripts/build-public-demo.js'],{env:{...process.env,TASTEPRINT_DEMO_OUTPUT:output,VITE_SUPABASE_URL:'https://synthetic.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_only'},stdio:'inherit'});
 assert.equal(JSON.parse(readFileSync(join(output,'demo-build.json'),'utf8')).backend_enabled,false);
 const reservation=createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 const root=`http://127.0.0.1:${port}/tastesocial-demo/`;
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--base','/tastesocial-demo/','--outDir',output,'--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
 let logs='';server.stdout.on('data',data=>logs+=data);server.stderr.on('data',data=>logs+=data);
 let ready=false;
 for(let attempt=0;attempt<100;attempt++){
  if(server.exitCode!==null)throw Error('Public demo preview failed: '+logs);
  if(logs.includes(root))try{ready=(await fetch(root+'demo.html')).ok;}catch{}
  if(ready)break;await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.ok(ready,'owned artifact preview becomes ready');
 for(const script of ['check-demo-browser.js','check-public-demo-browser.js'])execFileSync(process.execPath,['scripts/'+script],{env:{...process.env,TASTEPRINT_TEST_URL:root},stdio:'inherit'});
 console.log('Public demo preview PASS: connected-build refusal, inherited-config stripping, exact public base, complete mobile/desktop journey and real storage isolation. No publication.');
}finally{server?.kill('SIGTERM');rmSync(output,{recursive:true,force:true});}
