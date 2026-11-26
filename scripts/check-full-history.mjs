// Read-only diagnostic against the published fixed history. No snapshot writes.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {crossCheck,mapTx,cacheFrom,unpackTransaction} from "../docs/analytics.mjs";
const seed=JSON.parse(await readFile(new URL("../docs/snapshot.json",import.meta.url),"utf8"));
const snapshot=cacheFrom(seed.transactions.map(unpackTransaction),seed.source,null,seed.asOf);
const source=seed.source==="toncenter"?"tonapi":"toncenter";
const original=globalThis.fetch;
let requests=0;
globalThis.fetch=async(url,options)=>{
 requests++;
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
 const full=await crossCheck(snapshot,p=>{if(p.pages)console.log("Audit page",p.pages,p.scanned);else if(p.retry)console.log("Audit retry")});
 assert.equal(full.status,"match","Complete transaction identities or classified rows disagree, or history unavailable");
 assert.equal(full.method,"full");
 assert.equal(full.scanned,snapshot.scanned);
 assert.equal(full.rows,snapshot.rows.length);
 assert.match(full.proof.digest,/^[0-9a-f]{64}$/);
 const fullRequests=requests;
 console.log("Full live cross-check successful",source,full.scanned,full.rows,"requests",fullRequests);
 requests=0;
 const fast=await crossCheck(snapshot,p=>{if(p.pages)console.log("Checkpoint page",p.pages,p.scanned)},{checkpoint:{...snapshot,audit:full}});
 assert.equal(fast.status,"match");
 assert.equal(fast.method,"incremental","Verified checkpoint must be reusable against the live API");
 assert.equal(fast.proof.digest,full.proof.digest);
 assert.equal(fast.proof.fullAt,full.proof.fullAt);
 console.log("Incremental live cross-check successful",source,fast.scanned,fast.rows,"requests",requests,"vs full",fullRequests);
}finally{globalThis.fetch=original}
