// P1 browser regressions against local files and deterministic provider responses.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,webkit} from "playwright";
import {RAW,cacheFrom,packTransaction,AUDIT_SCOPE} from "../docs/analytics.mjs";
const root=resolve("docs"),artifacts=resolve("browser-artifacts");
await mkdir(artifacts,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,"."+new URL(req.url,"http://localhost").pathname.replace(/\/$/,"/index.html"));
  if(!path.startsWith(root+sep))throw Error("Invalid path");
  const type={".html":"text/html",".css":"text/css",".mjs":"text/javascript",".svg":"image/svg+xml",".json":"application/json"}[extname(path)];
  const data=await readFile(path);
  res.writeHead(200,{"Content-Type":type||"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const url="http://127.0.0.1:"+server.address().port;
const hash=i=>i.toString(16).padStart(64,"0"),now=Date.now(),stamp=Math.floor(now/1000)-60;
const txs=[1,2,3].map(i=>({h:hash(i),lt:String(i),prev:String(i-1),prevHash:hash(i-1),t:stamp+i,success:true,m:{s:"0:"+hash(500+i),v:"123456789",b:false,c:"Pepegun fee · STON.fi"}}));
const cache=cacheFrom(txs,"toncenter",null,now);
const snapshot={version:cache.version,address:RAW,source:cache.source,asOf:now,audit:{status:"match",scope:AUDIT_SCOPE,tip:cache.tip,tipHash:cache.tipHash,asOf:now,source:"tonapi"},transactions:txs.map(packTransaction)};
const fresh={...txs[2],h:hash(4),lt:"4",prev:"3",prevHash:hash(3),t:stamp+4};
const tc=t=>({account:RAW,hash:t.h,lt:t.lt,prev_trans_lt:t.prev,prev_trans_hash:t.prevHash,now:t.t,description:{aborted:false},in_msg:{source:t.m.s,value:t.m.v,bounced:false,message_content:{decoded:{type:"text_comment",comment:t.m.c}}}});
const ta=t=>({account:{address:RAW},hash:t.h,lt:t.lt,prev_trans_lt:t.prev,prev_trans_hash:t.prevHash,utime:t.t,aborted:false,success:true,in_msg:{source:{address:t.m.s},value:t.m.v,bounced:false,decoded_op_name:"text_comment",decoded_body:{text:t.m.c}}});
const ok=(route,transactions)=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({transactions})});
const deny=route=>route.fulfill({status:403,body:"offline"});
const waitStatus=async(page,word)=>page.waitForFunction(word=>document.querySelector("#status-text").textContent===word&&!document.querySelector("#refresh").disabled,word,{timeout:15000});
const readDownload=async(page,selector)=>{const [download]=await Promise.all([page.waitForEvent("download"),page.locator(selector).click()]);return readFile(await download.path())};
try{
 for(const [name,engine] of [["chromium",chromium],["webkit",webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:"en-US",acceptDownloads:true});
   let mode="match",seed=snapshot;
   await ctx.addInitScript(()=>{
    localStorage.setItem("pepegun-lang","en");
    window.__canvasText=[];
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(...args){window.__canvasText.push(String(args[0]));return original.apply(this,args)};
   });
   await ctx.route("https://raw.githubusercontent.com/**/snapshot.json",route=>route.fulfill({contentType:"application/json",body:JSON.stringify(seed)}));
   await ctx.route("https://toncenter.com/**",route=>{
    const u=new URL(route.request().url());
    if(mode==="mismatch")return ok(route,[tc({...fresh,prevHash:hash(99)})]);
    if(mode==="offline")return deny(route);
    if(u.searchParams.has("start_lt"))return ok(route,mode==="prior"?[tc(fresh)]:[]);
    if(u.searchParams.get("limit")==="1")return ok(route,[tc(mode==="prior"?fresh:txs.at(-1))]);
    return ok(route,[...(mode==="prior"?[fresh]:[]),...txs.slice().reverse()].map(tc));
   });
   await ctx.route("https://tonapi.io/**",route=>mode==="mismatch"||mode==="offline"?deny(route):ok(route,txs.slice().reverse().map(ta)));
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto(url);
   await page.waitForFunction(()=>!document.querySelector("#refresh").disabled&&document.querySelector("#status").className==="status ");
   mode="prior";await page.locator("#refresh").click();await waitStatus(page,"Earlier history checked");
   mode="mismatch";await page.locator("#refresh").click();await waitStatus(page,"Sources disagree");
   assert.equal(await page.locator("#status").getAttribute("class"),"status error");
   const before=await page.locator("#overview").innerText();
   mode="offline";await page.locator("#refresh").click();await waitStatus(page,"Sources disagree");
   assert.equal(await page.locator("#overview").innerText(),before);
   const csv=(await readDownload(page,"#csv")).toString("utf8");
   assert.match(csv,/audit_status/);assert.match(csv,/,mismatch\r?\n/);
   await page.evaluate(()=>window.__canvasText=[]);
   const png=await readDownload(page,"#png");
   assert.equal(png.subarray(1,4).toString(),"PNG");
   assert.ok((await page.evaluate(()=>window.__canvasText)).includes("Sources disagree"));
   for(const width of [320,375,393,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    for(const lang of ["en","ru"]){
     if(await page.locator("html").getAttribute("lang")!==lang)await page.locator("#language").click();
     await waitStatus(page,lang==="ru"?"Источники расходятся":"Sources disagree");
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name+" "+width+" "+lang+" horizontal overflow");
     await page.screenshot({path:resolve(artifacts,name+"-"+width+"-"+lang+".png"),fullPage:false});
    }
   }
   await page.evaluate(()=>window.__canvasText=[]);
   await page.locator("#overview").focus();await page.keyboard.press("Enter");
   await page.waitForFunction(()=>!document.querySelector("#card-export-download").disabled);
   assert.ok((await page.evaluate(()=>window.__canvasText)).some(t=>t.includes("Источники расходятся")));
   const card=await readDownload(page,"#card-export-download");
   assert.equal(card.subarray(1,4).toString(),"PNG");
   assert.equal(await page.locator("#notice").isVisible(),false);
   // Fresh independent context for the migration/unavailable scenario.
   const migration=await browser.newContext({viewport:{width:393,height:852},locale:"ru-RU"});
   await migration.addInitScript(()=>localStorage.setItem("pepegun-lang","ru"));
   const legacySeed={...snapshot,audit:{status:"match",tip:cache.tip,asOf:now}};
   await migration.route("https://raw.githubusercontent.com/**/snapshot.json",route=>route.fulfill({json:legacySeed}));
   await migration.route("https://toncenter.com/**",route=>{
    const u=new URL(route.request().url());
    return ok(route,u.searchParams.has("start_lt")?[]:u.searchParams.get("limit")==="1"?[tc(txs.at(-1))]:txs.slice().reverse().map(tc));
   });
   await migration.route("https://tonapi.io/**",deny);
   const legacyPage=await migration.newPage();
   await legacyPage.goto(url);await waitStatus(legacyPage,"Ожидается сверка");
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   const top=await legacyPage.locator("#overview").evaluate(e=>e.getBoundingClientRect().top);
   await legacyPage.locator("#refresh").click();
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   await waitStatus(legacyPage,"Ожидается сверка");
   assert.equal(await legacyPage.locator("#overview").evaluate(e=>e.getBoundingClientRect().top),top);
   await legacyPage.locator("#method-section summary").click();
   await legacyPage.locator("#audit-check").click();await waitStatus(legacyPage,"Сверка недоступна");
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   await migration.close();
   assert.deepEqual(errors,[]);
   await ctx.close();
   console.log(name,"P1 trust states, bilingual viewports, CSV and PNG verified");
  }finally{await browser.close()}
 }
}finally{server.close()}
