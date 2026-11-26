import {readFile,writeFile,rename} from "node:fs/promises";
import {ADDRESS,RAW,VERSION,download,verify,packTransaction,unpackTransaction,cacheFrom,crossCheck} from "../docs/analytics.mjs";
const file=new URL("../docs/snapshot.json",import.meta.url),tmp=new URL("../docs/snapshot.json.tmp",import.meta.url);
let prior=null,last;
try{prior=JSON.parse(await readFile(file,"utf8"))}catch{}
for(const source of ["toncenter","tonapi"]){
 try{
 const transactions=await download(source,null,p=>{if(p.pages)console.log(source,p.pages,p.scanned)});
 if(!verify(transactions,"0"))throw Error("Incomplete account history");
 const p=prior?.transactions?.at(-1),previous=Array.isArray(p)?unpackTransaction(p):p;
 if(previous){const anchor=transactions.find(t=>t.lt===previous.lt);if(!anchor||anchor.h!==previous.h)throw Error("Indexer behind or inconsistent with previous snapshot");}
 const asOf=Date.now(),cache=cacheFrom(transactions,source,null,asOf);
 let audit;
 try{audit=await crossCheck(cache)}catch{audit={status:"unavailable",tip:cache.tip,asOf:Date.now()}}
 if(audit.status==="mismatch")throw Object.assign(Error("Indexers disagree at the same transaction tip"),{sourceMismatch:true});
 const snapshot={version:VERSION,address:RAW,source,asOf,audit,transactions:transactions.map(packTransaction)};
 await writeFile(tmp,JSON.stringify(snapshot));await rename(tmp,file);
 console.log("Snapshot:",ADDRESS,transactions.length,audit.status);last=null;break;
 }catch(e){if(e.sourceMismatch)throw e;last=e;console.error(source,e.message)}
}
if(last)throw last;
