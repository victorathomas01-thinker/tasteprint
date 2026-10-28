// Exercise Vite itself, proving validation runs before producing public artifacts.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const output=mkdtempSync(join(tmpdir(),'tasteprint-refuse-public-secret-'));
const env=Object.fromEntries(Object.entries(process.env).filter(([name])=>!name.startsWith('VITE_')));
try{
 const marker='synthetic-private-marker-do-not-bundle';
 const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',output],{cwd:new URL('../',import.meta.url),env:{...env,VITE_SUPABASE_SERVICE_ROLE_KEY:marker},encoding:'utf8',timeout:15000});
 assert.equal(result.status,1,'actual Vite build must reject an unknown public credential');
 const logs=result.stdout+result.stderr;
 assert.match(logs,/Unsafe or invalid public build configuration/);assert.ok(!logs.includes(marker),'failure must not echo credential values');assert.deepEqual(readdirSync(output),[],'no public artifacts may be emitted');
 console.log('Public build refusal PASS: Vite rejects a synthetic private credential before emitting artifacts and never logs its value.');
}finally{rmSync(output,{recursive:true,force:true});}
