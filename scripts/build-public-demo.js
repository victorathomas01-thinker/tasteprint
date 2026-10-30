// Explicit opt-in artifact build. This script does not publish or enable Pages.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const output=resolve(process.env.TASTEPRINT_DEMO_OUTPUT||'dist-public-demo');
const env={...process.env,TASTEPRINT_PUBLIC_DEMO:'1'};
for(const key of Object.keys(env))if(key.startsWith('VITE_'))delete env[key];
const {validatePublicBuildConfig}=await import('./public-build-config.js');
Object.assign(env,validatePublicBuildConfig({}));
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--base','/tastesocial-demo/','--outDir',output],{env,stdio:'inherit'});
mkdirSync(output,{recursive:true});
writeFileSync(resolve(output,'.nojekyll'),'');
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
writeFileSync(resolve(output,'demo-build.json'),JSON.stringify({source_repository:'victorathomas01-thinker/tasteprint',source_commit:commit,backend_enabled:false,real_accounts:false,storage_namespace:'tasteprint.public-demo.v1:',built_at:new Date().toISOString()},null,2)+'\n');
writeFileSync(resolve(output,'README.md'),'# TasteSocial public demo\n\nOpen https://victorathomas01-thinker.github.io/tastesocial-demo/demo.html\n\nStatic development demo built from the public Tasteprint review branch. No backend, real accounts, real friend consent or bookings. Use sample details only. Source version is recorded in demo-build.json. This repository contains generated public assets only; it does not deploy the production Tasteprint site.\n');
console.log('PUBLIC DEMO ARTIFACT READY (not published): '+output);
