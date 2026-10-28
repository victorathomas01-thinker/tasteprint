import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {gzipSync} from 'node:zlib';
import {relayDecodedResponse} from './local-http-relay.js';
const expected={error:'Synthetic response only',detail:'☕'.repeat(2048)},compressed=gzipSync(JSON.stringify(expected));
const upstream=createServer((_req,res)=>{res.writeHead(401,{'Content-Type':'application/json','Content-Encoding':'gzip','Content-Length':compressed.length,'Cache-Control':'no-store','Vary':'Origin'});res.end(compressed);});
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port)));
let proxy;
try{
 const origin=await listen(upstream);
 proxy=createServer(async(_req,res)=>{try{const response=await fetch(origin);assert.equal(response.headers.get('content-encoding'),'gzip','the regression requires a real compressed upstream response');await relayDecodedResponse(response,res);}catch{res.writeHead(500);res.end('Synthetic relay failed');}});
 const response=await fetch(await listen(proxy));assert.equal(response.status,401);assert.equal(response.headers.get('content-encoding'),null);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('vary'),'Origin');assert.deepEqual(await response.json(),expected);
 console.log('Local HTTP relay PASS: real gzip upstream, automatic fetch decoding, preserved JSON/status/privacy headers and correct browser-facing transport framing. Loopback/synthetic only.');
}finally{for(const server of [proxy,upstream])if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
