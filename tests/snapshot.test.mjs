import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {DAY,resolveRange,metrics,exact,validCache} from "../docs/analytics.mjs";
import {validateSeed,adaptiveSeries,extraMetrics,previousRange,returnRates,intervalCsv} from "../docs/insights.mjs";
const snapshot=JSON.parse(await readFile(new URL("../docs/snapshot.json",import.meta.url),"utf8"));
const c=validateSeed(snapshot);assert.ok(c&&validCache(c));
const first=c.rows[0]?.t*1000||c.asOf,rows=snapshot.transactions.filter(t=>t[5]),isFee=t=>/^Pepegun fee(?: · |$)/.test(t[5][2]),within=(a,b)=>rows.filter(t=>t[3]*1000>=a&&t[3]*1000<b),wallets=r=>new Set(r.map(t=>t[5][0])),sum=r=>r.filter(isFee).reduce((s,t)=>s+BigInt(t[5][1]),0n);
const firsts=new Map(),firstPay=new Map();
for(const t of rows){const a=t[5][0],time=t[3]*1000;if(!firsts.has(a)||firsts.get(a)>time)firsts.set(a,time);if(isFee(t)&&(!firstPay.has(a)||firstPay.get(a)>time))firstPay.set(a,time);assert.match(t[5][2],/^Pepegun(?: fee)?(?: · [\p{L}\p{N} .:_+\-]+)?$/u)}
assert.equal(rows.length,c.rows.length);
for(const preset of ["all","30d","7d","24h","6h","custom"]){
 const range=resolveRange(preset,c.asOf,first,{from:new Date(first).toISOString().slice(0,10),to:new Date(Math.min(c.asOf,first+2*DAY)).toISOString().slice(0,10)}),m=metrics(c.rows,range,c.asOf),x=extraMetrics(c.rows,range,c.asOf),series=adaptiveSeries(c.rows,range,c.asOf),selected=within(range.from,range.to),fees=selected.filter(isFee),users=wallets(selected),payers=wallets(fees);
 assert.equal(m.wallets,users.size);assert.equal(m.paying,payers.size);assert.equal(m.fee,sum(selected));assert.equal(m.count,fees.length);assert.equal(m.other,selected.length-fees.length);assert.equal(m.newWallets,[...users].filter(a=>firsts.get(a)>=range.from).length);assert.equal(x.newPayers,[...payers].filter(a=>firstPay.get(a)>=range.from).length);
 const amounts=fees.map(t=>BigInt(t[5][1])).sort((a,b)=>a<b?-1:a>b?1:0),n=amounts.length;
 assert.equal(x.median2,n?amounts[Math.floor((n-1)/2)]+amounts[Math.floor(n/2)]:null);
 const byWallet=[...payers].map(a=>sum(fees.filter(t=>t[5][0]===a))).sort((a,b)=>a>b?-1:a<b?1:0);
 assert.equal(x.top5,byWallet.slice(0,5).reduce((a,b)=>a+b,0n));assert.equal(x.top10,byWallet.slice(0,10).reduce((a,b)=>a+b,0n));assert.equal(x.perPayer,payers.size?sum(fees)/BigInt(payers.size):null);
 assert.equal(m.venues.reduce((a,b)=>a+b.fee,0n),m.fee);
 for(const b of series.bins){const r=within(b.start,b.end),before=rows.filter(t=>t[3]*1000<b.end);assert.equal(b.active,wallets(r).size);assert.equal(b.paying,wallets(r.filter(isFee)).size);assert.equal(b.fee,sum(r));assert.equal(b.count,r.filter(isFee).length);assert.equal(b.cum,wallets(before).size);assert.equal(b.cumPay,wallets(before.filter(isFee)).size)}
 const prev=previousRange(range,first);if(prev){assert.equal(prev.to-prev.from,range.to-range.from);assert.ok(prev.to<=range.from);assert.equal(metrics(c.rows,prev,c.asOf).fee,sum(within(prev.from,prev.to)))}
 for(const rate of returnRates(c.rows,range,c.asOf)){const eligible=[...firsts].filter(([a,t])=>t>=range.from&&t<range.to&&(Math.floor(t/DAY)+rate.days+1)*DAY<=range.to);const returned=eligible.filter(([a,t])=>rows.some(r=>r[5][0]===a&&r[3]*1000<range.to&&Math.floor(r[3]*1000/DAY)>Math.floor(t/DAY)&&Math.floor(r[3]*1000/DAY)<=Math.floor(t/DAY)+rate.days));assert.equal(rate.eligible,eligible.length);assert.equal(rate.returned,returned.length)}
 const csv=intervalCsv(series,c.asOf,false).trim().split("\r\n").slice(1);assert.equal(csv.length,series.bins.length);assert.equal(csv.reduce((a,b)=>a+BigInt(b.split(",")[11]),0n),m.fee);
}
console.log("Public snapshot verified:",c.scanned,"transactions",c.rows.length,"classified");
