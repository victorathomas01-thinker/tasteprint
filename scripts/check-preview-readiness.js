import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {waitForArtifact} from './preview-readiness.js';
let ready=false;
const http=createServer((req,res)=>{res.writeHead(200);res.end(ready?'owned-build':'unrelated-build');});
await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${http.address().port}/demo-build.json`,server={exitCode:null};
try{
 assert.equal(await (await fetch(url)).text(),'unrelated-build');
 await assert.rejects(waitForArtifact({server,url,expected:'owned-build',timeoutMs:300,pollMs:20}),/identity did not match/);
 const timer=setTimeout(()=>{ready=true;},100);
 await waitForArtifact({server,url,expected:'owned-build',timeoutMs:1000,pollMs:10});clearTimeout(timer);
 // No readiness log exists: silence, chunks and ANSI output cannot gate HTTP checks.
 await waitForArtifact({server,url,expected:'owned-build',timeoutMs:200});
 await assert.rejects(waitForArtifact({server:{exitCode:1},url,expected:'owned-build'}),/process exited/);
 await assert.rejects(waitForArtifact({server,url,expected:'owned-build',timeoutMs:80,pollMs:10,fetchImpl:async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(Error(),{name:'TimeoutError'})),{once:true}))}),/timed out/);
 console.log('Preview readiness PASS: exact owned artifact, delayed readiness, silent logs, wrong server, exited process and bounded stalled request.');
}finally{await new Promise(resolve=>http.close(resolve));}
