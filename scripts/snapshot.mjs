import {writeFile,rename} from "node:fs/promises";
import {ADDRESS,RAW,VERSION,download,verify} from "../docs/analytics.mjs";
let last;
for(const source of ["toncenter","tonapi"]){
 try{
 const transactions=await download(source,null,p=>{if(p.pages)console.log(source,p.pages,p.scanned)});
 if(!verify(transactions,"0"))throw Error("Incomplete account history");
 const snapshot={version:VERSION,address:RAW,source,asOf:Date.now(),transactions};
 const file=new URL("../docs/snapshot.json",import.meta.url);
 const tmp=new URL("../docs/snapshot.json.tmp",import.meta.url);
 await writeFile(tmp,JSON.stringify(snapshot));await rename(tmp,file);
 console.log("Snapshot:",ADDRESS,transactions.length);last=null;break;
 }catch(e){last=e;console.error(source,e.message)}
}
if(last)throw last;
