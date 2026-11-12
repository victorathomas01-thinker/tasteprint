// An existing HTTP server must never be mistaken for this branch's production preview.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const occupied = createServer((request,response)=>{response.writeHead(200,{'Content-Type':'text/html'});response.end('<h1>Unrelated preview</h1>');});
await new Promise(resolve=>occupied.listen(0,'127.0.0.1',resolve));
const child = spawn(process.execPath,['scripts/review.js','--check'],{env:{...process.env,TASTEPRINT_REVIEW_PORT:String(occupied.address().port)},stdio:['ignore','pipe','pipe']});
let output='';const collect=data=>{output+=data;if(output.includes('LOCAL REVIEW:'))child.kill('SIGTERM');};
child.stdout.on('data',collect);child.stderr.on('data',collect);
const timeout=setTimeout(()=>child.kill('SIGTERM'),20000);
try{
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
 assert.equal(code,1,'occupied port must fail clearly');assert.doesNotMatch(output,/LOCAL REVIEW:/,'must not announce an unrelated server as ready');assert.match(output,/already in use/);
 console.log('Preview startup PASS: an occupied HTTP port fails before browser tests or a ready claim.');
}finally{clearTimeout(timeout);child.kill('SIGTERM');await new Promise(resolve=>occupied.close(resolve));}
