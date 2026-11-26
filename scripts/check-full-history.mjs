// Read-only diagnostic against the published fixed history. No snapshot writes.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {download,mapTx,verify,compareLt,cacheFrom,unpackTransaction,compareSnapshots} from "../docs/analytics.mjs";
const seed=JSON.parse(await readFile(new URL("../docs/snapshot.json",import.meta.url),"utf8"));
const snapshot=cacheFrom(seed.transactions.map(unpackTransaction),seed.source,null,seed.asOf);
const source=seed.source==="toncenter"?"tonapi":"toncenter";
const original=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 const response=await original(url,options);
 const u=new URL(url);
 if(!response.ok){console.log("Provider HTTP",response.status,"cursor",u.searchParams.get("before_lt")??u.searchParams.get("end_lt"));return response}
 const data=await response.clone().json();
 for(const raw of data.transactions??[]){
  try{mapTx(raw,source)}catch(e){
   console.error("Invalid provider row",{lt:raw.lt,prev_trans_lt:raw.prev_trans_lt,prev_trans_hash:raw.prev_trans_hash,hash:raw.hash,success:raw.success,aborted:raw.aborted,error:e.message});
   throw e;
  }
 }
 return response;
};
try{
 const rows=await download(source,null,p=>{if(p.pages)console.log("Audit page",p.pages,p.scanned);else if(p.retry)console.log("Audit retry")},AbortSignal.timeout(240000));
 const upto=rows.filter(t=>compareLt(t.lt,snapshot.tip)<=0);
 console.log("Provider history rows",rows.length,"common prefix",upto.length,"expected",snapshot.scanned,"first",upto[0]?.lt,"last",upto.at(-1)?.lt);
 for(let i=0;i<upto.length;i++){
  const tx=upto[i],previous=upto[i-1],p=previous?.lt??"0",h=previous?.h??"0".repeat(64);
  if(tx.prev!==p||(tx.prevHash!=null&&tx.prevHash!==h)){
   console.error("First chain break",{index:i,lt:tx.lt,prev:tx.prev,expectedPrev:p,prevHash:tx.prevHash,expectedHash:h});break;
  }
 }
 assert.ok(verify(upto,"0"),"Provider history continuity failed");
 assert.equal(upto.at(-1)?.lt,snapshot.tip,"Provider missing common tip");
 const other=cacheFrom(upto,source,null,snapshot.asOf);
 assert.ok(compareSnapshots(snapshot,other),"Complete transaction identities or classified rows disagree");
 console.log("Full live cross-check successful",source,other.scanned,other.rows.length);
}finally{globalThis.fetch=original}
