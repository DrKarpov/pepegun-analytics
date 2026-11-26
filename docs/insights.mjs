import {DAY,dayIndex,dayKey,cacheFrom,verify,ordered,RAW,VERSION} from "./analytics.mjs";
export function extraMetrics(rows,range,now){
 const to=Math.min(range.to,now+1),from=range.from,firstPay=new Map(),feeValues=[],byWallet=new Map(),newPayers=new Set(),payByDay=new Map();let total=0n;
 for(const r of rows){const t=r.t*1000;if(t>=to||r.k!=="fee")continue;if(!firstPay.has(r.s)||firstPay.get(r.s)>t)firstPay.set(r.s,t);if(t<from)continue;const v=BigInt(r.v);feeValues.push(v);total+=v;byWallet.set(r.s,(byWallet.get(r.s)||0n)+v);}
 for(const [s,t] of firstPay)if(t>=from&&t<to){newPayers.add(s);const d=dayKey(dayIndex(t));payByDay.set(d,(payByDay.get(d)||0)+1)}
 feeValues.sort((a,b)=>a<b?-1:a>b?1:0);
 const n=feeValues.length,median2=n?feeValues[Math.floor((n-1)/2)]+feeValues[Math.floor(n/2)]:null;
 const values=[...byWallet.values()].sort((a,b)=>a>b?-1:a<b?1:0);
 const sumTop=k=>values.slice(0,k).reduce((s,v)=>s+v,0n);
 return {median2,perPayer:values.length?total/BigInt(values.length):null,top5:sumTop(5),top10:sumTop(10),total,newPayers:newPayers.size,repeatPayers:values.length-newPayers.size,payByDay};
}
export function previousRange(range,first){
 if(!range||range.preset==="all")return null;
 const shift=range.preset==="24h"?DAY:(dayIndex(range.to-1)-dayIndex(range.from)+1)*DAY;
 const from=range.from-shift,to=range.to-shift;
 if(from<dayIndex(first)*DAY||to<=from)return null;
 return {from,to,preset:"previous"};
}
export function change(a,b){return b===0n||b===0?null:(Number(a)-Number(b))/Number(b)}
const coin="coingecko:the-open-network";
export async function loadPrices(from,to){
 const a=dayIndex(from),b=dayIndex(to-1),map=new Map();
 for(let start=a;start<=b;start+=90){
  const count=Math.min(90,b-start+1),u=new URL("https://coins.llama.fi/chart/"+coin);
  u.searchParams.set("start",String(start*86400));u.searchParams.set("span",String(count));u.searchParams.set("period","1d");u.searchParams.set("searchWidth","4h");
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),15000);
  try{
   const r=await fetch(u,{signal:ac.signal});if(!r.ok)throw Error("Price API "+r.status);
   const obj=(await r.json()).coins?.[coin];
   if(!obj||!Array.isArray(obj.prices)||!["TON","GRAM"].includes(String(obj.symbol).toUpperCase()))throw Error("Native TON price unavailable");
   for(const p of obj.prices){if(!Number.isFinite(p.timestamp)||!Number.isFinite(p.price)||p.price<=0)continue;const d=Math.round(p.timestamp/86400);if(d<start||d>=start+count||Math.abs(p.timestamp-d*86400)>14400)continue;const old=map.get(d);if(!old||Math.abs(p.timestamp-d*86400)<Math.abs(old.timestamp-d*86400))map.set(d,p)}
  }finally{clearTimeout(timer)}
 }
 return map;
}
export function historicalUsd(rows,range,prices){
 let total=0,covered=0n,all=0n;const missing=new Set(),daily=new Map();
 for(const r of rows){const t=r.t*1000;if(t<range.from||t>=range.to||r.k!=="fee")continue;const v=BigInt(r.v),d=dayIndex(t);all+=v;const p=prices.get(d);if(!p){missing.add(dayKey(d));continue}covered+=v;const u=Number(v)/1e9*p.price;total+=u;daily.set(dayKey(d),(daily.get(dayKey(d))||0)+u)}
 return {total:missing.size?null:total,covered,all,missing:[...missing],daily};
}
export function validateSeed(s){
 if(!s||s.version!==VERSION||s.address!==RAW||!["toncenter","tonapi"].includes(s.source)||!Array.isArray(s.transactions)||!Number.isFinite(s.asOf)||s.asOf>Date.now()+60000||s.asOf<=0)return null;
 try{
 const txs=ordered(s.transactions);
 if(txs.length!==s.transactions.length||!verify(txs,"0")||txs.some(t=>!Number.isSafeInteger(t.t)||t.t<=0||t.t*1000>s.asOf||!/^[0-9a-f]{64}$/.test(t.h)||typeof t.success!=="boolean"||(t.m&&(!/^\d+$/.test(t.m.v)||typeof t.m.b!=="boolean"||(t.m.s!==null&&!/^-?\d+:[0-9a-f]{64}$/.test(t.m.s))))))return null;
 return cacheFrom(txs,s.source,null,s.asOf);
 }catch{return null}
}
export async function loadSeed(){try{const r=await fetch(new URL("./snapshot.json",import.meta.url),{cache:"no-cache"});if(!r.ok)return null;return validateSeed(await r.json())}catch{return null}}
