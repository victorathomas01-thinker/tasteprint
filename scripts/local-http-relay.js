// fetch decodes compressed bodies. Forward decoded bytes with fresh transport
// framing, while retaining application status, content type, CORS and privacy.
export async function relayDecodedResponse(result,res){
 const headers=Object.fromEntries(result.headers);
 for(const name of ['content-encoding','content-length','transfer-encoding'])delete headers[name];
 res.writeHead(result.status,headers);
 res.end(Buffer.from(await result.arrayBuffer()));
}
