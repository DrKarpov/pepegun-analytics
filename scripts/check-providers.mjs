// Read-only provider contract smoke test; does not generate or publish a snapshot.
import assert from "node:assert/strict";
import {ADDRESS,mapTx,verify,compareLt} from "../docs/analytics.mjs";
const urls={
 toncenter:"https://toncenter.com/api/v3/transactions?account="+ADDRESS+"&limit=3&sort=desc",
 tonapi:"https://tonapi.io/v2/blockchain/accounts/"+ADDRESS+"/transactions?limit=3&sort_order=desc"
};
const histories={};
for(const [source,url] of Object.entries(urls)){
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
 assert.ok(response.ok,source+" HTTP "+response.status);
 const data=await response.json();
 assert.equal(data.transactions.length,3);
 const rows=data.transactions.map(t=>mapTx(t,source)).sort((a,b)=>compareLt(a.lt,b.lt));
 assert.ok(rows.every(t=>t.prevHash!==null),source+" missing previous hash");
 assert.ok(verify(rows,rows[0].prev,rows[0].prevHash),source+" inconsistent history");
 histories[source]=rows;
 console.log(source,"live schema and hash linkage verified",rows.map(t=>t.lt).join(","));
}
const byLt=new Map(histories.toncenter.map(t=>[t.lt,t]));
const common=histories.tonapi.filter(t=>byLt.has(t.lt));
assert.ok(common.length,"No shared LT in sample; retry when heads overlap");
for(const tx of common){const other=byLt.get(tx.lt);assert.equal(tx.h,other.h);assert.equal(tx.prev,other.prev);assert.equal(tx.prevHash,other.prevHash)}
console.log("Live provider common-tip sample verified:",common.length,"rows");
