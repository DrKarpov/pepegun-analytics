export const ADDRESS="UQD-J5lB6VMC1Cyyz2bLEEflmiG0JRXv7fccO6olayRRqWrc";
export const RAW="0:fe279941e95302d42cb2cf66cb1047e59a21b42515efedf71c3baa256b2451a9";
export const DAY=86400000, REFRESH=900000, STALE=1200000, VERSION=4;
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
 const lt=unsigned(x.lt),prev=unsigned(x.prev_trans_lt);
 const prevHash=x.prev_trans_hash==null?null:hex(x.prev_trans_hash);
 const m=im?{s:raw(tc?im.source:im.source?.address),v:im.value==null?"0":unsigned(im.value),b:im.bounced===true,c:typeof comment==="string"?comment:null}:null;
 const success=tc?!aborted:!aborted&&x.success;
 return {h:hex(x.hash),lt,prev,prevHash,t,success,m};
}
export function commentKind(comment){
 if(typeof comment!=="string"||!comment.toLowerCase().includes("pepegun"))return null;
 const match=comment.trim().match(/^(?:🔫\uFE0F?\s*)?Pepegun(?:\s+(fee))?(?:\s*·\s*([^·\r\n]+)(?:\s*·[^\r\n]*)?)?$/iu);
 if(!match)return {k:"ambiguous"};
 const label=match[2]?.trim()||"";
 return {k:match[1]?"fee":"other",d:label&&label.length<=64&&/^[\p{L}\p{N} .:_+\-]+$/u.test(label)&&!/(?:https?:|password|seed phrase|private key)/i.test(label)?label:"Unlabelled"};
}
export function classify(tx){
 const m=tx.m,kind=commentKind(m?.c);if(!kind||kind.k==="ambiguous")return null;
 if(!tx.success||m.b||!m.s||m.s===RAW||BigInt(m.v)<=0n)return null;
 return {h:tx.h,lt:tx.lt,t:tx.t,s:m.s,v:m.v,k:kind.k,d:kind.d};
}
export function minimizeTransaction(t){
 const r=classify(t),base={h:t.h,lt:t.lt,prev:t.prev,t:t.t,success:!!t.success,m:null};
 if(r)base.m={s:r.s,v:r.v,b:false,c:"Pepegun"+(r.k==="fee"?" fee":"")+(r.d==="Unlabelled"?"":" · "+r.d)};
 else if(t.a===true||(commentKind(t.m?.c)?.k==="ambiguous"&&t.success&&t.m?.s&&t.m.s!==RAW&&!t.m.b&&BigInt(t.m.v)>0n))base.a=true;
 return base;
}
export function packTransaction(t){const r=minimizeTransaction(t);return [r.h,r.lt,r.prev,r.t,r.success?1:0,r.m?[r.m.s,r.m.v,r.m.c]:null,r.a?1:0]}
export function unpackTransaction(a){if(!Array.isArray(a)||a.length!==7||![0,1].includes(a[4])||![0,1].includes(a[6])||(a[5]!==null&&(!Array.isArray(a[5])||a[5].length!==3)))throw Error("Invalid snapshot row");return {h:a[0],lt:a[1],prev:a[2],t:a[3],success:a[4]===1,m:a[5]?{s:a[5][0],v:a[5][1],c:a[5][2],b:false}:null,a:a[6]===1}}
export function ordered(txs){const m=new Map();for(const t of txs)m.set(t.h,t);return [...m.values()].sort((a,b)=>compareLt(a.lt,b.lt))}
const hashPattern=/^[0-9a-f]{64}$/;
const ltPattern=/^(0|[1-9]\d*)$/;
const ZERO_HASH="0".repeat(64);
export function verify(txs,prev,prevHash=prev==="0"?ZERO_HASH:null){
 if(!txs.length||typeof prev!=="string"||!ltPattern.test(prev))return false;
 const seen=new Set();let p=prev,h=prevHash;
 for(const tx of txs){
  if(!tx||typeof tx.h!=="string"||!hashPattern.test(tx.h)||seen.has(tx.h)||typeof tx.lt!=="string"||!ltPattern.test(tx.lt)||tx.prev!==p||compareLt(tx.lt,p)<=0)return false;
  if(tx.prevHash!=null&&(typeof tx.prevHash!=="string"||!hashPattern.test(tx.prevHash)||(h!==null&&tx.prevHash!==h)))return false;
  seen.add(tx.h);p=tx.lt;h=tx.h;
 }
 return true;
}
function validHistory(c){
 if(!Array.isArray(c.history)||c.history.length!==c.scanned)return false;
 const seen=new Set(),byLt=new Map();let prev="0";
 for(const row of c.history){
  if(!Array.isArray(row)||row.length!==2||typeof row[0]!=="string"||!ltPattern.test(row[0])||compareLt(row[0],prev)<=0||typeof row[1]!=="string"||!hashPattern.test(row[1])||seen.has(row[1]))return false;
  prev=row[0];seen.add(row[1]);byLt.set(row[0],row[1]);
 }
 return prev===c.tip&&c.history.at(-1)?.[1]===c.tipHash&&c.rows.every(row=>byLt.get(row.lt)===row.h);
}
function sameHistory(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every(([lt,h],i)=>lt===b[i][0]&&h===b[i][1])}
export function historyConflict(a,b){
 if(!a||!b)return false;
 if(a.tip===b.tip&&a.tipHash!==b.tipHash)return true;
 if(!Array.isArray(a.history)||!Array.isArray(b.history))return false;
 const n=Math.min(a.history.length,b.history.length);
 for(let i=0;i<n;i++)if(a.history[i][0]!==b.history[i][0]||a.history[i][1]!==b.history[i][1])return true;
 return false;
}
function overlapConflict(previous,txs){
 const known=new Map(previous.history||[[previous.tip,previous.tipHash]]);
 return txs.some(t=>known.has(t.lt)&&known.get(t.lt)!==t.h);
}

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
  for(const t of page){
   const prior=m.get(t.h);
   if(prior){if(JSON.stringify(prior)!==JSON.stringify(t))throw Error("Conflicting duplicate transaction")}
   else {added++;m.set(t.h,t)}
   if(oldest===null||compareLt(t.lt,oldest)<0)oldest=t.lt;
  }
  progress?.({source,pages:++pages,scanned:m.size});
  if(page.length<size)break;
  if(!added||!oldest||(cursor&&compareLt(oldest,cursor)>=0))throw Error("Pagination stopped advancing");
  cursor=oldest;await wait(delay);
 }
 return ordered([...m.values()]);
}
export const AUDIT_SCOPE="full-history-v1";
export function auditResult(snapshot,status,extra={}){
 return {...extra,status,tip:snapshot.tip,tipHash:snapshot.tipHash,scope:AUDIT_SCOPE,asOf:Date.now()};
}
export function auditTrust(c){
 const a=c?.audit;
 if(!c||!validAudit(a,c.tip))return "unchecked";
 if(a.status==="mismatch")return "mismatch";
 if(a.status==="unavailable"||a.scope!==AUDIT_SCOPE||!c.history||!a.tipHash||c.history.find(row=>row[0]===a.tip)?.[1]!==a.tipHash)return "unavailable";
 return a.tip===c.tip?"match":"prior";
}
// A failed/unavailable retry cannot erase an established disagreement.
// A full-history match at the same or a later tip can supersede it.
export function mergeAudit(c,...candidates){
 if(!c)return null;
 const checks=[c.audit,...candidates].filter(a=>validAudit(a,c.tip));
 const usable=a=>a.status!=="match"||(a.scope===AUDIT_SCOPE&&c.history?.find(row=>row[0]===a.tip)?.[1]===a.tipHash&&!!a.tipHash);
 const mismatch=checks.filter(a=>a.status==="mismatch").sort((a,b)=>b.asOf-a.asOf)[0];
 const matches=checks.filter(a=>a.status==="match"&&usable(a)).sort((a,b)=>compareLt(b.tip,a.tip)||b.asOf-a.asOf);
 const latest=checks.sort((a,b)=>b.asOf-a.asOf||compareLt(b.tip,a.tip))[0];
 if(mismatch&&!matches.some(a=>compareLt(a.tip,mismatch.tip)>=0&&a.asOf>mismatch.asOf))return mismatch;
 if(latest?.status==="match"&&!usable(latest))return matches[0]||latest;
 return latest||null;
}
export function validAudit(a,tip){
 return !!a&&["match","mismatch","unavailable"].includes(a.status)&&typeof a.tip==="string"&&/^\d+$/.test(a.tip)&&compareLt(a.tip,tip)<=0&&Number.isFinite(a.asOf)&&a.asOf>0&&a.asOf<=Date.now()+60000&&(a.scope===undefined||a.scope===AUDIT_SCOPE)&&(a.tipHash===undefined||(typeof a.tipHash==="string"&&hashPattern.test(a.tipHash)));
}
export function validCache(c){
 if(!c||c.version!==VERSION||c.address!==RAW||!["toncenter","tonapi"].includes(c.source)||!Array.isArray(c.rows)||typeof c.tip!=="string"||!/^\d+$/.test(c.tip)||!Number.isFinite(c.asOf)||c.asOf<=0||c.asOf>Date.now()+60000||!Number.isInteger(c.scanned)||c.scanned<=0||!Number.isInteger(c.ambiguous)||c.ambiguous<0||c.rows.length+c.ambiguous>c.scanned||typeof c.tipHash!=="string"||!/^[0-9a-f]{64}$/.test(c.tipHash)||!Number.isSafeInteger(c.tipTime)||!Number.isSafeInteger(c.firstTime)||c.firstTime<=0||c.tipTime<c.firstTime||c.tipTime*1000>c.asOf)return false;
 if(c.audit!=null&&!validAudit(c.audit,c.tip))return false;
 const seen=new Set(),lt=new Set();
 const validRows=c.rows.every(r=>{if(!r||typeof r.h!=="string"||!/^[0-9a-f]{64}$/.test(r.h)||seen.has(r.h)||typeof r.lt!=="string"||!/^\d+$/.test(r.lt)||lt.has(r.lt)||compareLt(r.lt,c.tip)>0||!Number.isSafeInteger(r.t)||r.t<c.firstTime||r.t>c.tipTime||!raw(r.s)||r.s!==raw(r.s)||r.s===RAW||typeof r.v!=="string"||!/^\d+$/.test(r.v)||BigInt(r.v)<=0n||!["fee","other"].includes(r.k)||typeof r.d!=="string"||r.d.length>64)return false;seen.add(r.h);lt.add(r.lt);return true});
 return validRows&&(c.history===undefined||validHistory(c));
}
export function cacheFrom(txs,source,previous=null,now=Date.now()){
 const m=new Map((previous?.rows||[]).map(r=>[r.h,r]));
 for(const tx of txs){const r=classify(tx);if(r)m.set(r.h,r)}
 const history=previous&&!previous.history?undefined:[...(previous?.history||[]),...txs.map(t=>[t.lt,t.h])];
 return {version:VERSION,address:RAW,source,...(history?{history}:{}),tip:txs.at(-1)?.lt||previous?.tip,tipHash:txs.at(-1)?.h||previous?.tipHash,tipTime:txs.at(-1)?.t||previous?.tipTime,audit:previous?.audit??null,firstTime:previous?.firstTime??txs[0]?.t,asOf:now,scanned:(previous?.scanned||0)+txs.length,ambiguous:(previous?.ambiguous||0)+txs.filter(t=>t.a===true||(commentKind(t.m?.c)?.k==="ambiguous"&&t.success&&t.m?.s&&t.m.s!==RAW&&!t.m.b&&BigInt(t.m.v)>0n)).length,rows:[...m.values()].sort((a,b)=>a.t-b.t||compareLt(a.lt,b.lt))};
}
export async function sync(previous,progress,force=false){
 let last,disagreement=null;
 const conflict=message=>Object.assign(Error(message),{sourceMismatch:true});
 const retain=next=>({...next,audit:mergeAudit(next,disagreement)});
 for(const source of ["toncenter","tonapi"]){
  try{
   if(!force&&validCache(previous)&&previous.history){
    const all=await download(source,previous.tip,progress),fresh=all.filter(t=>compareLt(t.lt,previous.tip)>0);
    if(overlapConflict(previous,all))throw conflict("Indexer disagrees at cached tip");
    if(fresh.length){
     const anchors=all.filter(t=>t.lt===previous.tip);
     if(anchors.length>1||anchors.some(t=>t.h!==previous.tipHash))throw conflict("Indexer disagrees at cached tip");
     if(fresh[0].prev===previous.tip&&fresh[0].prevHash!=null&&fresh[0].prevHash!==previous.tipHash)throw conflict("Indexer disagrees with cached predecessor");
     if((anchors.length===1||fresh[0].prevHash===previous.tipHash)&&verify(fresh,previous.tip,previous.tipHash)){
      const next=cacheFrom(fresh,source,previous);if(!validCache(next))throw Error("Invalid incremental snapshot");return retain(next);
     }
    }
    if(!fresh.length){
     const head=await getPage(source,null,null,1,progress);
     if(overlapConflict(previous,head))throw conflict("Indexer disagrees at cached head");
     if(head.length===1&&head[0].lt===previous.tip&&head[0].h===previous.tipHash)return retain(cacheFrom([],source,previous));
    }
   }
   const txs=await download(source,null,progress);
   if(!verify(txs,"0"))throw Error("Incomplete or empty full history");
   if(validCache(previous)){
    if(overlapConflict(previous,txs))throw conflict("Indexer disagrees with cached history");
    const anchor=txs.find(t=>t.lt===previous.tip);
    if(!anchor){if(compareLt(txs.at(-1).lt,previous.tip)>=0)throw conflict("Indexer omitted cached tip");throw Error("Indexer behind cached snapshot")}
    if(previous.history&&!sameHistory(previous.history,txs.filter(t=>compareLt(t.lt,previous.tip)<=0).map(t=>[t.lt,t.h])))throw conflict("Indexer disagrees with cached history");
   }
   const next=cacheFrom(txs,source);if(!validCache(next))throw Error("Invalid full snapshot");if(validCache(previous)&&previous.audit&&typeof previous.audit.tip==="string"&&/^\d+$/.test(previous.audit.tip)&&compareLt(previous.audit.tip,next.tip)<=0)next.audit=previous.audit;return retain(next);
  }catch(e){last=e;if(e.sourceMismatch&&validCache(previous))disagreement=auditResult(previous,"mismatch",{source})}
 }
 if(disagreement)throw Object.assign(last||Error("Indexer disagreement"),{audit:disagreement});
 throw last||Error("Both sources unavailable");
}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open("pepegun-analytics-v2",1);r.onupgradeneeded=()=>r.result.createObjectStore("data");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function loadCache(){let d;try{d=await db();const c=await new Promise((resolve,reject)=>{const r=d.transaction("data").objectStore("data").get("current");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return validCache(c)?c:null}catch{return null}finally{d?.close()}}
export async function saveCache(c){let d;try{if(!validCache(c))return false;d=await db();await new Promise((resolve,reject)=>{const t=d.transaction("data","readwrite"),store=t.objectStore("data"),r=store.get("current");r.onsuccess=()=>{const old=r.result;if(!validCache(old)){store.put(c,"current");return}const newer=compareLt(c.tip,old.tip)>0||(c.tip===old.tip&&c.tipHash===old.tipHash&&((!!c.history&&!old.history)||c.asOf>=old.asOf));const chosen=newer?c:old;store.put({...chosen,audit:mergeAudit(chosen,old.audit,c.audit)},"current")};t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)});return true}catch{return false}finally{d?.close()}}
export function resolveRange(preset,now,first,custom){
 const today=dayIndex(now),end=now+1;let from;
 if(preset==="all")from=dayIndex(first??now)*DAY;
 else if(preset==="6h"||preset==="24h")from=end-(preset==="6h"?DAY/4:DAY);
 else if(preset==="7d"||preset==="30d")from=(today-(preset==="7d"?6:29))*DAY;
 else{
  const date=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s||""))return NaN;const t=Date.parse(s+"T00:00:00Z");return Number.isFinite(t)&&dayKey(dayIndex(t))===s?t:NaN};
  from=date(custom?.from);const last=date(custom?.to);
  if(!Number.isFinite(from)||!Number.isFinite(last)||from>last||last>today*DAY||(first!=null&&from<dayIndex(first)*DAY))return null;
  return {from,to:Math.min(end,last+DAY),preset};
 }
 return {from,to:end,preset};
}
const aggregate=()=>({active:new Set(),paying:new Set(),fee:0n,count:0,other:0,largest:0n});
function add(a,r){a.active.add(r.s);if(r.k==="fee"){const v=BigInt(r.v);a.paying.add(r.s);a.fee+=v;a.count++;if(v>a.largest)a.largest=v}else a.other++}
export function metrics(rows,range,now){
 if(!range)return null;
 const from=range.from,to=Math.min(range.to,now+1),first=new Map(),all=aggregate(),venues=new Map(),activity={dau:new Set(),wau:new Set(),mau:new Set()};
 const anchor=dayIndex(to-1);
 for(const r of rows){
  const t=r.t*1000;if(t>=to)continue;
  if(!first.has(r.s)||first.get(r.s)>t)first.set(r.s,t);
  const d=dayIndex(t);
  if(d===anchor)activity.dau.add(r.s);if(d>=anchor-6)activity.wau.add(r.s);if(d>=anchor-29)activity.mau.add(r.s);
  if(t<from)continue;
  add(all,r);if(!venues.has(r.d))venues.set(r.d,aggregate());add(venues.get(r.d),r);
 }
 const newWallets=[...all.active].filter(s=>first.get(s)>=from).length;
 return {wallets:all.active.size,paying:all.paying.size,newWallets,returning:all.active.size-newWallets,fee:all.fee,count:all.count,other:all.other,largest:all.largest,venues:[...venues].map(([label,a])=>({label,fee:a.fee,count:a.count,wallets:a.active.size})).sort((a,b)=>a.fee>b.fee?-1:a.fee<b.fee?1:a.label.localeCompare(b.label)),activity:Object.fromEntries(Object.entries(activity).map(([k,v])=>[k,v.size])),anchor:dayKey(anchor)};
}
export function compareSnapshots(snapshot,other){
 if(!validCache(snapshot)||!validCache(other))return false;
 const byHash=new Map(other.rows.map(r=>[r.h,r]));
 return sameHistory(snapshot.history,other.history)&&snapshot.tip===other.tip&&snapshot.tipHash===other.tipHash&&snapshot.scanned===other.scanned&&snapshot.ambiguous===other.ambiguous&&snapshot.rows.length===other.rows.length&&!snapshot.rows.some(r=>{const a=byHash.get(r.h);return !a||["lt","t","s","v","k","d"].some(k=>r[k]!==a[k])});
}
export async function crossCheck(snapshot,progress){
 if(!validCache(snapshot))throw Error("No verified snapshot");
 const source=snapshot.source==="toncenter"?"tonapi":"toncenter";
 if(!snapshot.history)return auditResult(snapshot,"unavailable",{source});
 const txs=await download(source,null,progress);
 const upto=txs.filter(t=>compareLt(t.lt,snapshot.tip)<=0);
 if(overlapConflict(snapshot,upto))return auditResult(snapshot,"mismatch",{source});
 if(!verify(upto,"0")||upto.at(-1)?.lt!==snapshot.tip)return auditResult(snapshot,"unavailable",{source});
 const other=cacheFrom(upto,source,null,snapshot.asOf);
 return auditResult(snapshot,compareSnapshots(snapshot,other)?"match":"mismatch",{source,scanned:other.scanned,rows:other.rows.length});
}
export function exact(n){const q=BigInt(n),s=q<0n?"-":"",v=q<0n?-q:q;return s+(v/1000000000n)+"."+(v%1000000000n).toString().padStart(9,"0")}
export function amount(n,digits=2,locale="en",trim=false){
 if(!Number.isInteger(digits)||digits<0||digits>9)throw Error("Invalid precision");
 const signed=BigInt(n),v=signed<0n?-signed:signed,f=10n**BigInt(9-digits),q=(v+f/2n)/f,scale=10n**BigInt(digits),whole=q/scale;
 let frac=digits?(q%scale).toString().padStart(digits,"0"):"";
 if(trim)frac=frac.replace(/0+$/,"");
 const sep=new Intl.NumberFormat(locale).formatToParts(1.1).find(p=>p.type==="decimal")?.value||".";
 return (signed<0n&&q>0n?"−":"")+new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(whole)+(frac?sep+frac:"");
}
export function compactAmount(n,locale="en",digits=4){
 const v=BigInt(n),threshold=10n**BigInt(9-digits);
 if(v>0n&&v<threshold)return "<"+amount(threshold,digits,locale,true);
 return amount(v,digits,locale,true);
}
