// Readiness comes from the owned process and exact artifact, not console formatting.
export async function waitForArtifact({server,url,expected,timeoutMs=30000,pollMs=100,fetchImpl=fetch}){
 const deadline=Date.now()+timeoutMs;
 let diagnostic='No successful artifact response';
 while(Date.now()<deadline){
  if(server.exitCode!==null)throw Error('Preview process exited before readiness');
  try{
   const response=await fetchImpl(url,{signal:AbortSignal.timeout(Math.max(1,Math.min(1000,deadline-Date.now()))),cache:'no-store'});
   diagnostic=response.ok?'Artifact identity did not match':`Artifact HTTP ${response.status}`;
   if(response.ok&&await response.text()===expected){
    if(server.exitCode!==null)throw Error('Preview process exited during readiness');
    return;
   }
  }catch(error){if(diagnostic==='No successful artifact response')diagnostic=error.name||'Artifact request failed';}
  await new Promise(resolve=>setTimeout(resolve,pollMs));
 }
 throw Error(`Preview readiness timed out: ${diagnostic}`);
}
