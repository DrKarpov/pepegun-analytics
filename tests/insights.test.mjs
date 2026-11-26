import assert from "node:assert/strict";
import {commentKind,compareSnapshots,DAY,RAW,VERSION,cacheFrom,minimizeTransaction,packTransaction,validCache,validAudit,amount,compactAmount,resolveRange} from "../docs/analytics.mjs";
import {extraMetrics,previousRange,change,adaptiveSeries,returnRates,rowsInRange,intervalCsv,validateSeed,selectSnapshot} from "../docs/insights.mjs";
const t=Date.UTC(2026,9,15),row=(s,v,d)=>({s,lt:String(v),v:String(v),t:(t+d*DAY)/1000,k:"fee"});
const rows=[row("a",1,0),row("a",3,1),row("b",5,1),row("c",7,1),row("d",9,1),row("e",11,1),row("f",13,1)];
const range={from:t+DAY,to:t+2*DAY,preset:"custom"},x=extraMetrics(rows,range,t+3*DAY);
assert.equal(x.median2,16n);assert.equal(x.total,48n);assert.equal(x.newPayers,5);assert.equal(x.repeatPayers,1);assert.equal(x.top5,45n);assert.equal(x.top10,48n);assert.equal(x.perPayer,8n);assert.equal(adaptiveSeries(rows,range,t+3*DAY).bins.reduce((a,b)=>a+b.newPay,0),5);
assert.equal(commentKind("🔫 Pepegun fee · STON.fi · hash").k,"fee");assert.equal(commentKind("🔫 Pepegun · Stonks").k,"other");assert.equal(commentKind("not Pepegun fee").k,"ambiguous");assert.equal(commentKind("Pepegun fee refund").k,"ambiguous");assert.equal(commentKind("other"),null);
assert.equal(previousRange(range,t).from,t);assert.equal(previousRange(range,t+DAY),null);assert.equal(previousRange({...range,preset:"all"},t),null);assert.equal(change(10,0),null);assert.equal(change(10,5),1);
const tx={h:"a".repeat(64),lt:"1",prev:"0",t:t/1000,success:true,m:{s:"0:"+"b".repeat(64),v:"1",b:false,c:"Pepegun fee"}};
const snap=cacheFrom([tx],"toncenter",null,t+DAY);assert.equal(compareSnapshots(snap,{...snap,source:"tonapi"}),true);assert.equal(compareSnapshots(snap,{...snap,scanned:2}),false);assert.ok(validateSeed({version:VERSION,address:RAW,source:"toncenter",asOf:t+DAY,transactions:[packTransaction(tx)]}));assert.equal(validateSeed({version:VERSION,address:RAW,source:"toncenter",asOf:t+DAY,transactions:[packTransaction({...tx,prev:"5"})]}),null);
console.log("Insight checks passed");
const full={from:t,to:t+2*DAY,preset:"custom"};
const series=adaptiveSeries(rows,full,t+3*DAY);
assert.equal(series.kind,"3h");assert.equal(series.bins.length,16);assert.equal(series.bins.reduce((a,b)=>a+b.fee,0n),49n);assert.equal(series.bins.at(-1).cum,6);
for(const [hours,kind] of [[6,"15m"],[24,"1h"],[72,"3h"],[168,"6h"],[2160,"day"],[2400,"week"],[9600,"month"]])assert.equal(adaptiveSeries(rows,{from:t,to:t+hours*3600000},t+hours*3600000).kind,kind);
assert.equal(rowsInRange(rows,range,"fee").length,6);assert.equal(rowsInRange(rows,range,"other").length,0);
assert.ok(intervalCsv(series,t+3*DAY,false).includes("interval_start_utc"));
const rates=returnRates(rows,{from:t,to:t+32*DAY},t+32*DAY);
assert.equal(rates[0].eligible,6);assert.equal(rates[0].returned,1);assert.equal(rates[2].eligible,6);assert.equal(returnRates(rows,range,t+2*DAY)[0].eligible,0);
assert.equal(minimizeTransaction({...tx,m:{...tx.m,c:"unrelated @someone"}}).m,null);
assert.equal(minimizeTransaction({...tx,m:{...tx.m,c:"🔫 Pepegun fee · STON.fi · extra"}}).m.c,"Pepegun fee · STON.fi");
assert.equal(minimizeTransaction({...tx,m:{...tx.m,c:"not Pepegun fee"}}).a,true);

const edgeNow=t+2*DAY-1;
for(const preset of ["6h","24h"]){const r=resolveRange(preset,edgeNow,t);const p=previousRange(r,t);assert.equal(p.to,r.from);assert.equal(p.to-p.from,r.to-r.from)}
assert.equal(compactAmount(168302141n,"en-US"),"0.1683");assert.equal(compactAmount(168302141n,"ru-RU"),"0,1683");assert.equal(compactAmount(700000000n),"0.7");assert.equal(compactAmount(1n),"<0.0001");assert.equal(compactAmount(0n),"0");assert.equal(amount(9007199254740993123456789n,9,"en-US"),"9,007,199,254,740,993.123456789");
assert.equal(validCache(snap),true);assert.equal(validCache({...snap,rows:[snap.rows[0],snap.rows[0]]}),false);assert.equal(validCache({...snap,rows:[{...snap.rows[0],v:"bad"}]}),false);assert.equal(validCache({...snap,tipHash:"bad"}),false);
assert.equal(adaptiveSeries(rows,{from:t,to:t+DAY},t+DAY-1).bins.at(-1).status,"complete");

const check={status:"match",asOf:t+DAY,tip:snap.tip};
assert.ok(validAudit(check,snap.tip));assert.equal(validAudit({...check,asOf:NaN},snap.tip),false);
assert.equal(validCache({...snap,audit:{...check,tip:"999"}}),false);
assert.equal(selectSnapshot(snap,{...snap,asOf:snap.asOf+1000}).asOf,snap.asOf+1000);
assert.equal(selectSnapshot({...snap,tip:"2"},snap).tip,"2");
assert.equal(selectSnapshot(snap,{...snap,tipHash:"f".repeat(64)}).tipHash,snap.tipHash);
assert.equal(selectSnapshot(snap,{...snap,tipHash:"f".repeat(64),audit:check}).tipHash,"f".repeat(64));

assert.equal(commentKind("Pepegun fee · @someone").d,"Unlabelled");
assert.equal(commentKind("Pepegun fee · https://example.com").k,"fee");
assert.equal(commentKind("Pepegun fee · Autosell:TopBlast V2").d,"Autosell:TopBlast V2");
assert.equal(validateSeed({version:VERSION,address:RAW,source:"toncenter",asOf:t+DAY,transactions:[packTransaction(tx)],audit:{...check,status:"mismatch"}}),null);
assert.equal(selectSnapshot(snap,{...snap,tipHash:"f".repeat(64),audit:{...check,tip:"0"}}).tipHash,snap.tipHash);
