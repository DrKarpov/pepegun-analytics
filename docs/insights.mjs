import {DAY,dayIndex,dayKey,cacheFrom,verify,ordered,RAW,VERSION,compareLt,minimizeTransaction,unpackTransaction,validAudit,validCache,exact,weekIndex,weekStart} from "./analytics.mjs?v=10";
export function extraMetrics(rows,range,now){
 const to=Math.min(range.to,now+1),from=range.from,firstPay=new Map(),feeValues=[],byWallet=new Map(),newPayers=new Set();let total=0n;
 for(const r of rows){const t=r.t*1000;if(t>=to||r.k!=="fee")continue;if(!firstPay.has(r.s)||firstPay.get(r.s)>t)firstPay.set(r.s,t);if(t<from)continue;const v=BigInt(r.v);feeValues.push(v);total+=v;byWallet.set(r.s,(byWallet.get(r.s)||0n)+v);}
 for(const [s,t] of firstPay)if(t>=from&&t<to)newPayers.add(s);
 feeValues.sort((a,b)=>a<b?-1:a>b?1:0);
 const n=feeValues.length,median2=n?feeValues[Math.floor((n-1)/2)]+feeValues[Math.floor(n/2)]:null;
 const values=[...byWallet.values()].sort((a,b)=>a>b?-1:a<b?1:0);
 const sumTop=k=>values.slice(0,k).reduce((s,v)=>s+v,0n);
 return {median2,perPayer:values.length?total/BigInt(values.length):null,top5:sumTop(5),top10:sumTop(10),total,newPayers:newPayers.size,repeatPayers:values.length-newPayers.size};
}
export function previousRange(range,first){
 if(!range||range.preset==="all")return null;
 const shift=(range.preset==="24h"||range.preset==="6h")?(range.preset==="6h"?DAY/4:DAY):(dayIndex(range.to-1)-dayIndex(range.from)+1)*DAY;
 const from=range.from-shift,to=range.to-shift;
 if(!Number.isFinite(first)||from<dayIndex(first)*DAY||to<=from||to>range.from)return null;
 return {from,to,preset:"previous"};
}
export function change(a,b){return b===0n||b===0?null:(Number(a)-Number(b))/Number(b)}

const H=3600000;
export function chooseInterval(range){const n=range.to-range.from;return n<=6*H?"15m":n<=DAY?"1h":n<=3*DAY?"3h":n<=7*DAY?"6h":n<=90*DAY?"day":n<=366*DAY?"week":"month"}
const fixed={"15m":H/4,"1h":H,"3h":3*H,"6h":6*H,day:DAY};
function floorBucket(t,k){if(fixed[k])return Math.floor(t/fixed[k])*fixed[k];if(k==="week")return weekStart(weekIndex(dayIndex(t)))*DAY;const d=new Date(t);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)}
function nextBucket(t,k){if(fixed[k])return t+fixed[k];if(k==="week")return t+7*DAY;const d=new Date(t);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)}
export function adaptiveSeries(rows,range,now){
 if(!range)return {kind:"day",bins:[]};
 const kind=chooseInterval(range),from=range.from,to=Math.min(range.to,now+1),bins=[],first=new Map(),firstPay=new Map();
 for(const r of rows){const t=r.t*1000;if(t>=to)continue;if(!first.has(r.s)||first.get(r.s)>t)first.set(r.s,t);if(r.k==="fee"&&(!firstPay.has(r.s)||firstPay.get(r.s)>t))firstPay.set(r.s,t)}
 const newTimes=[...first.values()].sort((a,b)=>a-b),payTimes=[...firstPay.values()].sort((a,b)=>a-b),byStart=new Map();let j=0,k=0;
 for(let a=floorBucket(from,kind);a<to;a=nextBucket(a,kind)){
  const next=nextBucket(a,kind),start=Math.max(from,a),end=Math.min(to,next);
  while(j<newTimes.length&&newTimes[j]<end)j++;while(k<payTimes.length&&payTimes[k]<end)k++;
  const bin={start,end,bucket:a,date:new Date(a).toISOString(),status:next>now+1?"incomplete":start>a||end<next?"partial":"complete",activeSet:new Set(),paySet:new Set(),new:0,returning:0,newPay:0,fee:0n,count:0,other:0,cum:j,cumPay:k};
  byStart.set(a,bin);bins.push(bin);
 }
 for(const r of rows){const t=r.t*1000;if(t<from||t>=to)continue;const b=byStart.get(floorBucket(t,kind));if(!b)continue;b.activeSet.add(r.s);if(r.k==="fee"){b.paySet.add(r.s);b.fee+=BigInt(r.v);b.count++}else b.other++}
 return {kind,bins:bins.map(b=>{const {activeSet,paySet,...v}=b;v.active=activeSet.size;v.paying=paySet.size;v.new=[...activeSet].filter(s=>first.get(s)>=b.start&&first.get(s)<b.end).length;v.returning=v.active-v.new;v.newPay=[...paySet].filter(s=>firstPay.get(s)>=b.start&&firstPay.get(s)<b.end).length;return v})};
}
// Wallets first seen in the selected period, with a fully elapsed follow-up window.
export function returnRates(rows,range,now){
 const to=Math.min(range.to,now+1),first=new Map(),later=new Map();
 for(const r of rows){const t=r.t*1000;if(t>=to)continue;if(!first.has(r.s)||first.get(r.s)>t)first.set(r.s,t)}
 for(const r of rows){const t=r.t*1000;if(t>=to)continue;const d=dayIndex(t)-dayIndex(first.get(r.s));if(d>0&&(!later.has(r.s)||later.get(r.s)>d))later.set(r.s,d)}
 return [7,14,30].map(days=>{const eligible=[...first].filter(([s,t])=>t>=range.from&&t<to&&(dayIndex(t)+days+1)*DAY<=to);return {days,eligible:eligible.length,returned:eligible.filter(([s])=>(later.get(s)??Infinity)<=days).length}});
}
export function rowsInRange(rows,range,type="all"){return rows.filter(r=>r.t*1000>=range.from&&r.t*1000<range.to&&(type==="all"||r.k===type)).sort((a,b)=>b.t-a.t||compareLt(b.lt,a.lt))}
export function intervalCsv(series,snapshot,stale){
 const head="interval_start_utc,interval_end_utc,interval,status,active_wallets,new_wallets,returning_wallets,paying_wallets,new_paying_wallets,fee_payments,fee_gram,fee_nano,other_transfers,cumulative_wallets,cumulative_paying,snapshot_utc,stale";
 return [head,...series.bins.map(b=>[new Date(b.start).toISOString(),new Date(b.end).toISOString(),series.kind,b.status,b.active,b.new,b.returning,b.paying,b.newPay,b.count,exact(b.fee),String(b.fee),b.other,b.cum,b.cumPay,new Date(snapshot).toISOString(),String(stale)].join(","))].join("\r\n")+"\r\n";
}
export function validateSeed(s){
 if(!s||s.version!==VERSION||s.address!==RAW||!["toncenter","tonapi"].includes(s.source)||!Array.isArray(s.transactions)||!Number.isFinite(s.asOf)||s.asOf>Date.now()+60000||s.asOf<=0)return null;
 try{
 const unpacked=s.transactions.map(unpackTransaction),txs=ordered(unpacked);
 if(txs.length!==unpacked.length||!verify(txs,"0")||txs.some(t=>!Number.isSafeInteger(t.t)||t.t<=0||t.t*1000>s.asOf||!/^[0-9a-f]{64}$/.test(t.h)||!/^\d+$/.test(t.lt)||!/^\d+$/.test(t.prev)||typeof t.success!=="boolean"||(t.m&&(!/^\d+$/.test(t.m.v)||typeof t.m.c!=="string"||!/^-?\d+:[0-9a-f]{64}$/.test(t.m.s)))))return null;
 const c=cacheFrom(txs.map(minimizeTransaction),s.source,null,s.asOf);
 if(s.audit?.status==="mismatch")return null;
 if(validAudit(s.audit,c.tip))c.audit={status:s.audit.status,tip:s.audit.tip,source:s.audit.source,asOf:s.audit.asOf};
 return validCache(c)?c:null;
 }catch{return null}
}
export function selectSnapshot(local,seed){
 if(!local)return seed;if(!seed)return local;
 const order=compareLt(local.tip,seed.tip);
 if(order!==0)return order>0?local:seed;
 if(local.tipHash!==seed.tipHash)return seed.audit?.status==="match"&&seed.audit.tip===seed.tip?seed:local;
 if(!local.history&&seed.history)return seed;
 if(local.history&&!seed.history)return local;
 return seed.asOf>local.asOf?seed:local;
}
export async function loadSeed(){
 const urls=["https://raw.githubusercontent.com/DrKarpov/pepegun-analytics/main/docs/snapshot.json",new URL("./snapshot.json",import.meta.url)];
 for(const url of urls){const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),5000);try{const r=await fetch(url,{cache:"no-cache",signal:ac.signal});if(r.ok){const seed=validateSeed(await r.json());if(seed)return seed}}catch{}finally{clearTimeout(timer)}}
 return null;
}
