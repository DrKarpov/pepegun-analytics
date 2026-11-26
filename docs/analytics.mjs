export const ADDRESS="UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc";
export const RAW="0:fe279941e95302d42cb2cf66cb1047e59a21b42515efedf71c3baa256b2451a9";
export const DAY=86400000, REFRESH=900000, STALE=1200000, VERSION=3;
export const dayIndex=t=>Math.floor(t/DAY);
export const dayKey=d=>new Date(d*DAY).toISOString().slice(0,10);
export const weekIndex=d=>Math.floor((d+3)/7);
export const weekStart=w=>w*7-3;
export const compareLt=(a,b)=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0;
const raw=a=>typeof a==="string"&&/^-?\d+:[0-9a-f]{64}$/i.test(a)?a.toLowerCase():null;
function unsigned(x){if(typeof x==="string"&&/^\d+$/.test(x))return x;if(Number.isSafeInteger(x)&&x>=0)return String(x);throw Error("Invalid integer in API response")}
function hex(x){if(typeof x!=="string")throw Error("Invalid hash");if(/^[a-f0-9]{64}$/i.test(x))return x.toLowerCase();const b=atob(x.replace(/-/g,"+").replace(/_/g,"/"));if(b.length!==32)throw Error("Invalid transaction hash");return Array.from(b,c=>c.charCodeAt(0).toString(16).padStart(2,"0")).join("")}
export function mapTx(x,source){
 if(!x||typeof x!=="object")throw Error("Invalid transaction");
 const tc=source==="toncenter",a=raw(tc?x.account:x.account?.address);
 if(a!==RAW)throw Error("Unexpected account in API response");
 const t=tc?x.now:x.utime,aborted=tc?x.description?.aborted:x.aborted;
 if(!Number.isSafeInteger(t)||t<=0||typeof aborted!=="boolean"||(!tc&&typeof x.success!=="boolean"))throw Error("Unexpected transaction schema");
 const im=x.in_msg,decoded=tc?im?.message_content?.decoded:im?.decoded_body;
 const isText=tc?(decoded?.type==="text_comment"||decoded?.["@type"]==="text_comment"):im?.decoded_op_name==="text_comment";
 const comment=isText?(tc?decoded?.comment:decoded?.text):null;
 const lt=unsigned(x.lt),prev=unsigned(x.prev_trans_lt??(tc?null:"0"));
 const m=im?{s:raw(tc?im.source:im.source?.address),v:im.value==null?"0":unsigned(im.value),b:im.bounced===true,c:typeof comment==="string"?comment:null}:null;
 const success=tc?!aborted:!aborted&&x.success;
 return {h:hex(x.hash),lt,prev,t,success,m};
}
export function commentKind(comment){
 if(typeof comment!=="string"||!comment.toLowerCase().includes("pepegun"))return null;
 const match=comment.trim().match(/^(?:🔫\uFE0F?\s*)?Pepegun(?:\s+(fee))?(?:\s*·\s*([^·\r\n]+)(?:\s*·[^\r\n]*)?)?$/iu);
 return match?{k:match[1]?"fee":"other",d:match[2]?.trim().slice(0,64)||"Unlabelled"}:{k:"ambiguous"};
}
export function classify(tx){
 const m=tx.m,kind=commentKind(m?.c);if(!kind||kind.k==="ambiguous")return null;
 if(!tx.success||m.b||!m.s||m.s===RAW||BigInt(m.v)<=0n)return null;
 return {h:tx.h,lt:tx.lt,t:tx.t,s:m.s,v:m.v,k:kind.k,d:kind.d};
}
export function ordered(txs){const m=new Map();for(const t of txs)m.set(t.h,t);return [...m.values()].sort((a,b)=>compareLt(a.lt,b.lt))}
export function verify(txs,prev){if(!txs.length)return false;let p=prev;for(const tx of txs){if(tx.prev!==p||compareLt(tx.lt,p)<=0)return false;p=tx.lt}return true}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function json(url,progress){
 let last;
 for(let i=0;i<5;i++){
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),20000);
  try{
   const r=await fetch(url,{signal:ac.signal,cache:"no-store"});
   if(r.ok)return await r.json();
   if(r.status!==429&&r.status<500)throw Object.assign(Error("HTTP "+r.status),{permanent:true});
   const ra=Number(r.headers.get("Retry-After"));last=Error("HTTP "+r.status);
   if(i<4){const delay=Math.min(30000,ra>0?ra*1000:1000*2**i);progress?.({retry:true});await wait(delay)}
  }catch(e){last=e;if(e.permanent)throw e;if(i<4){progress?.({retry:true});await wait(1000*2**i)}}
  finally{clearTimeout(timer)}
 }
 throw last||Error("API unavailable");
}
const settings={toncenter:{size:1000,delay:1150},tonapi:{size:100,delay:1500}};
function pageUrl(source,cursor,after,size){
 const tc=source==="toncenter",u=new URL(tc?"https://toncenter.com/api/v3/transactions":"https://tonapi.io/v2/blockchain/accounts/"+ADDRESS+"/transactions");
 if(tc){u.searchParams.set("account",ADDRESS);u.searchParams.set("sort","desc")}else u.searchParams.set("sort_order","desc");
 u.searchParams.set("limit",String(size));
 if(cursor)u.searchParams.set(tc?"end_lt":"before_lt",cursor);
 if(after)u.searchParams.set(tc?"start_lt":"after_lt",after);
 return u.href;
}
async function getPage(source,cursor,after,size,progress){
 const data=await json(pageUrl(source,cursor,after,size),progress);
 if(!Array.isArray(data?.transactions))throw Error("Invalid transactions response");
 return data.transactions.map(t=>mapTx(t,source));
}
export async function download(source,after,progress){
 const {size,delay}=settings[source],m=new Map();let cursor=null,pages=0;
 for(;;){
  const page=await getPage(source,cursor,after,size,progress);let added=0,oldest=null;
  for(const t of page){if(!m.has(t.h))added++;m.set(t.h,t);if(oldest===null||compareLt(t.lt,oldest)<0)oldest=t.lt}
  progress?.({source,pages:++pages,scanned:m.size});
  if(page.length<size||!added||!oldest)break;
  if(cursor&&compareLt(oldest,cursor)>=0)throw Error("Pagination stopped advancing");
  cursor=oldest;await wait(delay);
 }
 return ordered([...m.values()]);
}
function validCache(c){return !!c&&c.version===VERSION&&c.address===RAW&&Array.isArray(c.rows)&&typeof c.tip==="string"&&/^\d+$/.test(c.tip)&&Number.isFinite(c.asOf)&&Number.isInteger(c.scanned)&&c.scanned>0&&typeof c.tipHash==="string"&&/^[0-9a-f]{64}$/.test(c.tipHash)&&Number.isFinite(c.tipTime)&&Number.isFinite(c.firstTime)}
export function cacheFrom(txs,source,previous=null,now=Date.now()){
 const m=new Map((previous?.rows||[]).map(r=>[r.h,r]));
 for(const tx of txs){const r=classify(tx);if(r)m.set(r.h,r)}
 return {version:VERSION,address:RAW,source,tip:txs.at(-1)?.lt||previous?.tip,tipHash:txs.at(-1)?.h||previous?.tipHash,tipTime:txs.at(-1)?.t||previous?.tipTime,firstTime:previous?.firstTime??txs[0]?.t,asOf:now,scanned:(previous?.scanned||0)+txs.length,ambiguous:(previous?.ambiguous||0)+txs.filter(t=>commentKind(t.m?.c)?.k==="ambiguous"&&t.success&&t.m?.s&&t.m.s!==RAW&&!t.m.b&&BigInt(t.m.v)>0n).length,rows:[...m.values()].sort((a,b)=>a.t-b.t||compareLt(a.lt,b.lt))};
}
export async function sync(previous,progress,force=false){
 let last;
 for(const source of ["toncenter","tonapi"]){
  try{
   if(!force&&validCache(previous)){
    const all=await download(source,previous.tip,progress),fresh=all.filter(t=>compareLt(t.lt,previous.tip)>0);
    if(fresh.length&&verify(fresh,previous.tip))return cacheFrom(fresh,source,previous);
    if(!fresh.length){
     const head=await getPage(source,null,null,1,progress);
     if(head.length===1&&head[0].lt===previous.tip&&head[0].h===previous.tipHash)return cacheFrom([],source,previous);
    }
   }
   const txs=await download(source,null,progress);
   if(!verify(txs,"0"))throw Error("Incomplete or empty full history");
   if(validCache(previous)&&compareLt(txs.at(-1).lt,previous.tip)<0)throw Error("Indexer behind last verified snapshot");
   return cacheFrom(txs,source);
  }catch(e){last=e}
 }
 throw last||Error("Both sources unavailable");
}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open("pepegun-analytics-v2",1);r.onupgradeneeded=()=>r.result.createObjectStore("data");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function loadCache(){let d;try{d=await db();const c=await new Promise((resolve,reject)=>{const r=d.transaction("data").objectStore("data").get("current");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return validCache(c)?c:null}catch{return null}finally{d?.close()}}
export async function saveCache(c){let d;try{d=await db();await new Promise((resolve,reject)=>{const t=d.transaction("data","readwrite");t.objectStore("data").put(c,"current");t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)});return true}catch{return false}finally{d?.close()}}
export function resolveRange(preset,now,first,custom){
 const today=dayIndex(now),end=now+1;let from;
 if(preset==="all")from=dayIndex(first??now)*DAY;
 else if(preset==="24h")from=now-DAY;
 else if(preset==="7d"||preset==="30d")from=(today-(preset==="7d"?6:29))*DAY;
 else{
  const date=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s||""))return NaN;const t=Date.parse(s+"T00:00:00Z");return Number.isFinite(t)&&dayKey(dayIndex(t))===s?t:NaN};
  from=date(custom?.from);const last=date(custom?.to);
  if(!Number.isFinite(from)||!Number.isFinite(last)||from>last||last>today*DAY||(first!=null&&from<dayIndex(first)*DAY))return null;
  return {from,to:Math.min(end,last+DAY),preset};
 }
 return {from,to:end,preset};
}
const aggregate=()=>({active:new Set(),paying:new Set(),fee:0n,count:0,other:0,otherValue:0n,largest:0n});
function add(a,r){a.active.add(r.s);const v=BigInt(r.v);if(r.k==="fee"){a.paying.add(r.s);a.fee+=v;a.count++;if(v>a.largest)a.largest=v}else{a.other++;a.otherValue+=v}}
export function metrics(rows,range,now){
 if(!range)return null;
 const from=range.from,to=Math.min(range.to,now+1),first=new Map(),firstPay=new Map(),all=aggregate(),days=new Map(),weeks=new Map(),venues=new Map(),activity={dau:new Set(),prev:new Set(),wau:new Set(),mau:new Set()},walletWeeks=new Map();
 const anchor=dayIndex(to-1);
 for(const r of rows){
  const t=r.t*1000;if(t>=to)continue;
  if(!first.has(r.s)||first.get(r.s)>t)first.set(r.s,t);
  if(r.k==="fee"&&(!firstPay.has(r.s)||firstPay.get(r.s)>t))firstPay.set(r.s,t);
  const d=dayIndex(t),w=weekIndex(d);
  if(d===anchor)activity.dau.add(r.s);if(d===anchor-1)activity.prev.add(r.s);if(d>=anchor-6)activity.wau.add(r.s);if(d>=anchor-29)activity.mau.add(r.s);
  if(!walletWeeks.has(r.s))walletWeeks.set(r.s,new Set());walletWeeks.get(r.s).add(w);
  if(t<from)continue;
  add(all,r);
  for(const [map,key] of [[days,d],[weeks,w],[venues,r.d]]){if(!map.has(key))map.set(key,aggregate());add(map.get(key),r)}
 }
 const started=[...first.values()].sort((a,b)=>a-b),paid=[...firstPay.values()].sort((a,b)=>a-b),daily=[],weekly=[];
 let si=0,pi=0;
 for(let d=dayIndex(from);d<=anchor;d++){
  const start=Math.max(from,d*DAY),end=Math.min(to,(d+1)*DAY),a=days.get(d)||aggregate();
  while(si<started.length&&started[si]<end)si++;while(pi<paid.length&&paid[pi]<end)pi++;
  const n=[...a.active].filter(s=>first.get(s)>=start&&first.get(s)<end).length;
  daily.push({date:dayKey(d),status:(d+1)*DAY>now?"incomplete":start>d*DAY||end<(d+1)*DAY?"partial":"complete",active:a.active.size,new:n,returning:a.active.size-n,paying:a.paying.size,fee:a.fee,count:a.count,other:a.other,cum:si,cumPay:pi});
 }
 for(let w=weekIndex(dayIndex(from));w<=weekIndex(anchor);w++){const a=weeks.get(w)||aggregate(),start=weekStart(w)*DAY;weekly.push({date:dayKey(weekStart(w)),status:start<from||start+7*DAY>to?"partial":"complete",active:a.active.size,paying:a.paying.size,fee:a.fee,count:a.count})}
 const newWallets=[...all.active].filter(s=>first.get(s)>=from).length;
 const cohorts=new Map(),last=weekIndex(anchor);
 for(const [s,ws] of walletWeeks){const w=weekIndex(dayIndex(first.get(s)));if(!cohorts.has(w))cohorts.set(w,[]);cohorts.get(w).push(ws)}
 const retention=[...cohorts.entries()].sort((a,b)=>b[0]-a[0]).slice(0,12).map(([w,members])=>({date:dayKey(weekStart(w)),size:members.length,active:Array.from({length:Math.min(9,last-w+1)},(_,i)=>members.filter(s=>s.has(w+i)).length)}));
 return {wallets:all.active.size,paying:all.paying.size,newWallets,returning:all.active.size-newWallets,fee:all.fee,count:all.count,other:all.other,otherValue:all.otherValue,largest:all.largest,daily,weekly,venues:[...venues].map(([label,a])=>({label,fee:a.fee,count:a.count,other:a.other,wallets:a.active.size,paying:a.paying.size})).sort((a,b)=>a.fee>b.fee?-1:a.fee<b.fee?1:0),activity:Object.fromEntries(Object.entries(activity).map(([k,v])=>[k,v.size])),anchor:dayKey(anchor),anchorIncomplete:(anchor+1)*DAY>now,retention,currentWeekPartial:weekStart(last)*DAY+7*DAY>to};
}
export function compareSnapshots(snapshot,other){
 const byHash=new Map(other.rows.map(r=>[r.h,r]));
 return snapshot.tip===other.tip&&snapshot.tipHash===other.tipHash&&snapshot.scanned===other.scanned&&snapshot.ambiguous===other.ambiguous&&snapshot.rows.length===other.rows.length&&!snapshot.rows.some(r=>{const a=byHash.get(r.h);return !a||["lt","t","s","v","k","d"].some(k=>r[k]!==a[k])});
}
export async function crossCheck(snapshot,progress){
 if(!validCache(snapshot))throw Error("No verified snapshot");
 const source=snapshot.source==="toncenter"?"tonapi":"toncenter";
 const txs=await download(source,null,progress);
 const upto=txs.filter(t=>compareLt(t.lt,snapshot.tip)<=0);
 if(!verify(upto,"0")||upto.at(-1)?.lt!==snapshot.tip)return {status:"unavailable",source,asOf:Date.now(),tip:snapshot.tip};
 const other=cacheFrom(upto,source,null,snapshot.asOf);
 return {status:compareSnapshots(snapshot,other)?"match":"mismatch",source,asOf:Date.now(),tip:snapshot.tip,scanned:other.scanned,rows:other.rows.length};
}
export function exact(n){const q=BigInt(n),s=q<0n?"-":"",v=q<0n?-q:q;return s+(v/1000000000n)+"."+(v%1000000000n).toString().padStart(9,"0")}
export function amount(n,digits=2,locale="en"){const f=10n**BigInt(9-digits),q=(BigInt(n)+f/2n)/f,p=10n**BigInt(digits);return new Intl.NumberFormat(locale,{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(q)/Number(p))}
export function csv(m){return ["date_utc,status,active_wallets,new_wallets,returning_wallets,paying_wallets,fee_payments,fee_gram,fee_nano,other_transfers,cumulative_wallets,cumulative_paying",...m.daily.map(d=>[d.date,d.status,d.active,d.new,d.returning,d.paying,d.count,exact(d.fee),String(d.fee),d.other,d.cum,d.cumPay].join(","))].join("\r\n")+"\r\n"}
