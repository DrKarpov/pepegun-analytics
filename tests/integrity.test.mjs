import assert from "node:assert/strict";
import {RAW,cacheFrom,compareSnapshots,verify,validCache,mapTx,crossCheck,sync,auditTrust,mergeAudit,auditResult,historyConflict,packTransaction,unpackTransaction} from "../docs/analytics.mjs";
const hash=i=>String(i).padStart(64,"0");
const t=[1,2,3].map(i=>({h:hash(i),lt:String(i),prev:String(i-1),prevHash:hash(i-1),t:100+i,success:true,m:null}));
const c=cacheFrom(t,"toncenter"),other=cacheFrom(t,"tonapi");
assert.ok(validCache(c));
assert.ok(compareSnapshots(c,other));
const changed=t.map((x,i)=>i===1?{...x,h:"a".repeat(64)}:x);
assert.equal(compareSnapshots(c,cacheFrom(changed,"tonapi")),false);
assert.equal(verify(changed,"0"),false);
assert.equal(verify([t[0],t[2]],"0"),false);
assert.equal(verify([t[0],{...t[1],h:t[0].h}],"0"),false);
assert.equal(verify(t.slice(1),"1",hash(1)),true);
assert.equal(verify(t.slice(1),"1",hash(9)),false);
assert.equal(validCache({...c,history:[c.history[0],c.history[0],c.history[2]]}),false);
const legacy={...c};delete legacy.history;
assert.ok(validCache(legacy));
assert.equal(compareSnapshots(c,legacy),false);
assert.equal((await crossCheck(legacy)).status,"unavailable");
assert.ok(compareSnapshots(c,cacheFrom(t.map(x=>unpackTransaction(packTransaction(x))),"toncenter")));
const common={hash:hash(2),lt:"2",prev_trans_lt:"1",prev_trans_hash:hash(1)};
assert.equal(mapTx({...common,account:RAW,now:102,description:{aborted:false}},"toncenter").prevHash,hash(1));
assert.equal(mapTx({...common,account:{address:RAW},utime:102,aborted:false,success:true},"tonapi").prevHash,hash(1));
assert.throws(()=>mapTx({...common,prev_trans_lt:undefined,account:{address:RAW},utime:102,aborted:false,success:true},"tonapi"));
// TonAPI really omits both fields on the first account transaction (observed in live CI).
const genesisRaw={account:{address:RAW},hash:hash(1),lt:"1",utime:101,aborted:true,success:true};
const genesis=mapTx(genesisRaw,"tonapi");
assert.equal(genesis.prev,"0");assert.equal(genesis.prevHash,null);
assert.equal(genesis.success,false);
assert.ok(verify([genesis,t[1],t[2]],"0"));
assert.equal(verify([t[0],mapTx({...genesisRaw,hash:hash(2),lt:"2"},"tonapi"),t[2]],"0"),false);
assert.equal(verify([mapTx({...genesisRaw,hash:hash(2),lt:"2"},"tonapi")],"1",hash(1)),false);
assert.throws(()=>mapTx({account:RAW,hash:hash(1),lt:"1",now:101,description:{aborted:true}},"toncenter"));
// Network fixtures: exercise sync without downloading live data.
const apiTx=x=>({account:RAW,hash:x.h,lt:x.lt,prev_trans_lt:x.prev,prev_trans_hash:x.prevHash,now:x.t,description:{aborted:false}});
const tonapiTx=x=>({account:{address:RAW},hash:x.h,lt:x.lt,prev_trans_lt:x.prev,prev_trans_hash:x.prevHash,utime:x.t,aborted:false,success:true});
const originalFetch=globalThis.fetch;
let requests=[];
const install=handler=>{requests=[];globalThis.fetch=async input=>{const u=new URL(input);requests.push(u);return {ok:true,json:async()=>({transactions:handler(u).map(u.hostname==="tonapi.io"?tonapiTx:apiTx)})}}};
try{
 const prev=cacheFrom(t.slice(0,2),"toncenter");
 install(u=>u.searchParams.has("start_lt")?[t[2]]:[...t].reverse());
 const next=await sync(prev);
 assert.ok(compareSnapshots(next,c));
 assert.equal(requests.length,1);
 // If previous hash is unavailable, a fresh-only page cannot establish an anchor.
 const noHash={...t[2],prevHash:undefined};
 install(u=>u.searchParams.has("start_lt")?[noHash]:[...t].reverse());
 assert.ok(compareSnapshots(await sync(prev),c));
 assert.equal(requests.length,2);
 // A legacy cache is rebuilt instead of extended without full identity.
 install(()=>[...t].reverse());
 assert.ok(compareSnapshots(await sync(legacy),c));
 assert.equal(requests.length,1);
 // Compare alternate source at the common tip even if the alternate has newer rows.
 const newer={h:hash(4),lt:"4",prev:"3",prevHash:hash(3),t:104,success:true,m:null};
 globalThis.fetch=async()=>({ok:true,json:async()=>({transactions:[newer,...t.slice().reverse()].map(x=>({account:{address:RAW},hash:x.h,lt:x.lt,prev_trans_lt:x.prev,prev_trans_hash:x.prevHash,utime:x.t,aborted:false,success:true}))})});
 assert.equal((await crossCheck(c)).status,"match");
 // Same-tip disagreement is reported even if the alternate chain is incomplete.
 const bad={...t[1],h:hash(9)};
 install(()=>[t[2],bad,t[0]]);
 assert.equal((await crossCheck(c)).status,"mismatch");
 // A good fallback must not conceal a contradiction from the primary.
 install(u=>u.hostname==="tonapi.io"?[t[2]]:[{...t[2],prevHash:hash(9)}]);
 const fallback=await sync(prev);
 assert.ok(compareSnapshots(fallback,c));
 assert.equal(auditTrust(fallback),"mismatch");
 // When neither source can safely extend history, preserve an actionable audit.
 install(()=>[{...t[2],prevHash:hash(9)}]);
 await assert.rejects(()=>sync(prev),e=>e.audit?.status==="mismatch"&&e.audit.tip===prev.tip);
 // Missing/gapped history and conflicting duplicates are rejected.
 install(()=>[t[2],t[0]]);
 assert.equal((await crossCheck(c)).status,"unavailable");
 install(()=>[t[2],{...t[2],prevHash:hash(9)},t[1],t[0]]);
 await assert.rejects(()=>crossCheck(c),/Conflicting duplicate/);
 // Unavailable primary API falls back to the alternate source without a false mismatch.
 globalThis.fetch=async input=>{
  const u=new URL(input);
  if(u.hostname!=="tonapi.io")return {ok:false,status:403};
  return {ok:true,json:async()=>({transactions:[t[2]].map(tonapiTx)})};
 };
 const recovered=await sync(prev);
 assert.ok(compareSnapshots(recovered,c));
 assert.equal(auditTrust(recovered),"unchecked");

}finally{globalThis.fetch=originalFetch}
// Trust and concurrency: a legacy match is not a full-history match.
const match={...auditResult(c,"match"),asOf:Date.now()-4000};
const mismatch={...auditResult(c,"mismatch"),asOf:Date.now()-3000};
const unavailable={...auditResult(c,"unavailable"),asOf:Date.now()-2000};
assert.equal(auditTrust({...c,audit:{status:"match",tip:c.tip,asOf:match.asOf}}),"unchecked");
assert.equal(auditTrust({...c,audit:match}),"match");
assert.equal(auditTrust({...c,audit:mismatch}),"mismatch");
assert.equal(mergeAudit({...c,audit:mismatch},unavailable).status,"mismatch");
assert.equal(mergeAudit({...c,audit:mismatch},match).status,"mismatch");
assert.equal(mergeAudit({...c,audit:mismatch},{...match,asOf:Date.now()-1000}).status,"match");
const advanced=cacheFrom([{h:hash(4),lt:"4",prev:"3",prevHash:hash(3),t:104,success:true,m:null}],"toncenter",c);
assert.equal(auditTrust({...advanced,audit:match}),"prior");
assert.equal(auditTrust({...advanced,audit:mergeAudit(advanced,mismatch)}),"mismatch");
assert.equal(auditTrust({...c,audit:{...match,tipHash:hash(9)}}),"unchecked");
assert.equal(historyConflict(c,advanced),false);
assert.equal(historyConflict(c,cacheFrom(changed,"tonapi")),true);
// P2-02: cancellation and overall deadline apply to every network phase.
const beforeAudit=JSON.stringify(c);
const pendingFetch=(_,options)=>new Promise((resolve,reject)=>{
 const signal=options.signal;
 if(signal.aborted)reject(signal.reason);
 else signal.addEventListener("abort",()=>reject(signal.reason),{once:true});
});
try{
 let calls=0;
 globalThis.fetch=(...args)=>{calls++;return pendingFetch(...args)};
 const pre=new AbortController();pre.abort();
 await assert.rejects(()=>crossCheck(c,undefined,{signal:pre.signal}),e=>e.name==="AbortError");
 assert.equal(calls,0);
 const active=new AbortController(),inFlight=crossCheck(c,undefined,{signal:active.signal});
 active.abort();
 await assert.rejects(inFlight,e=>e.name==="AbortError");
 assert.equal(calls,1);
 calls=0;
 await assert.rejects(()=>crossCheck(c,undefined,{timeoutMs:15}),e=>e.name==="TimeoutError");
 assert.equal(calls,1);
 // Abort during a rate-limit retry wait, without issuing another request.
 calls=0;
 globalThis.fetch=async()=>{calls++;return {ok:false,status:429,headers:new Headers({"Retry-After":"1"})}};
 const retry=new AbortController();
 await assert.rejects(()=>crossCheck(c,p=>{if(p.retry)setTimeout(()=>retry.abort(),10)},{signal:retry.signal}),e=>e.name==="AbortError");
 assert.equal(calls,1);
 // Abort during the gap between two history pages.
 calls=0;
 const page=Array.from({length:100},(_,i)=>({h:hash(i+1),lt:String(i+1),prev:String(i),prevHash:hash(i),t:101+i,success:true,m:null})).reverse();
 globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({transactions:page.map(tonapiTx)})}};
 const pagination=new AbortController();
 await assert.rejects(()=>crossCheck(c,p=>{if(p.pages===1)setTimeout(()=>pagination.abort(),10)},{signal:pagination.signal}),e=>e.name==="AbortError");
 assert.equal(calls,1);
 // An actual permanent provider failure is not confused with cancellation.
 globalThis.fetch=async()=>({ok:false,status:403});
 await assert.rejects(()=>crossCheck(c),/HTTP 403/);
 assert.equal(JSON.stringify(c),beforeAudit);
}finally{globalThis.fetch=originalFetch}
console.log("P1 integrity and P2 cancellation regression checks passed");
