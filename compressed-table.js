export async function checkedTableResponse(response,entry){
 if(!response.ok)throw Error('Table unavailable');const packed=await response.arrayBuffer();
 const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(packed.byteLength!==entry.bytes||await hash(packed)!==entry.sha256)throw Error('Table checksum / integrity mismatch');
 if(entry.rawBytes===undefined)return packed;
 if(typeof DecompressionStream!=='function')throw Error('Browser decompression unavailable');
 const raw=await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 if(raw.byteLength!==entry.rawBytes||await hash(raw)!==entry.rawSha256)throw Error('Decompressed table checksum / integrity mismatch');return raw;
}
