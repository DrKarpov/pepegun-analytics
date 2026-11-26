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
   let releaseStartup,firstSeed=true;
   const startupGate=new Promise(resolve=>releaseStartup=resolve);
   await ctx.route("https://raw.githubusercontent.com/**/snapshot.json*",async route=>{
    if(firstSeed){firstSeed=false;await startupGate}
    return route.fulfill({contentType:"application/json",body:JSON.stringify(seed)});
   });
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
   await page.goto(url,{waitUntil:"domcontentloaded"});
   const startup=page.locator("#startup-screen");
   await startup.waitFor({state:"visible"});
   assert.equal(await startup.evaluate(e=>getComputedStyle(e).backgroundColor),await page.locator("html").evaluate(e=>{const probe=document.createElement("div");probe.style.background="var(--raised)";e.append(probe);const result=getComputedStyle(probe).backgroundColor;probe.remove();return result}));
   assert.equal(await startup.locator("img").getAttribute("src"),"./pepegun-logo.svg");
   await startup.locator("img").evaluate(img=>img.decode());
   for(const width of [320,375,393,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    const geometry=await startup.evaluate(e=>{
     const rect=e.getBoundingClientRect(),content=e.querySelector(".startup-content").getBoundingClientRect();
     return {full:rect.left===0&&rect.top===0&&Math.abs(rect.width-innerWidth)<1&&Math.abs(rect.height-innerHeight)<1,center:Math.abs(content.left+content.width/2-innerWidth/2)<1&&Math.abs(content.top+content.height/2-innerHeight/2)<1,fits:content.left>=0&&content.right<=innerWidth&&content.top>=0&&content.bottom<=innerHeight};
    });
    assert.deepEqual(geometry,{full:true,center:true,fits:true});
    if(width===393||width===1440)await page.screenshot({path:resolve(artifacts,name+"-startup-"+width+".png")});
   }
   releaseStartup();
   await startup.waitFor({state:"detached"});
   assert.ok(await page.evaluate(()=>performance.now()>=400));
   assert.equal(await page.locator(".page").evaluate(e=>getComputedStyle(e).visibility),"visible");
   await page.waitForFunction(()=>!document.querySelector("#refresh").disabled&&document.querySelector("#status").className==="status ");
   mode="prior";await page.locator("#refresh").click();await waitStatus(page,"Earlier history checked");assert.equal(await startup.count(),0);
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
   const migration=await browser.newContext({viewport:{width:393,height:852},locale:"ru-RU",hasTouch:true});
   await migration.addInitScript(()=>localStorage.setItem("pepegun-lang","ru"));
   let legacySeed={...snapshot,audit:{status:"match",tip:cache.tip,asOf:now}};
   await migration.route("https://raw.githubusercontent.com/**/snapshot.json*",route=>route.fulfill({json:legacySeed}));
   await migration.route("https://toncenter.com/**",route=>{
    const u=new URL(route.request().url());
    return ok(route,u.searchParams.has("start_lt")?[]:u.searchParams.get("limit")==="1"?[tc(txs.at(-1))]:txs.slice().reverse().map(tc));
   });
   let slowAudit=true;
   await migration.route("https://tonapi.io/**",async route=>{
    if(slowAudit)await new Promise(resolve=>setTimeout(resolve,2000));
    try{await deny(route)}catch(error){if(!slowAudit&&!(String(error).includes("closed")||String(error).includes("aborted")||String(error).includes("already handled")))throw error}
   });
   const legacyPage=await migration.newPage();
   await legacyPage.goto(url);await legacyPage.locator("#startup-screen").waitFor({state:"detached"});await waitStatus(legacyPage,"Ожидается сверка");
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   const top=await legacyPage.locator("#overview").evaluate(e=>e.getBoundingClientRect().top);
   await legacyPage.locator("#refresh").click();
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   await waitStatus(legacyPage,"Ожидается сверка");
   assert.equal(await legacyPage.locator("#overview").evaluate(e=>e.getBoundingClientRect().top),top);
   await legacyPage.locator("#method-section summary").click();
   const originalMetrics=await legacyPage.locator("#overview").innerText();
   await legacyPage.locator("#audit-check").click();
   await legacyPage.getByRole("button",{name:"Отменить сверку",exact:true}).click();
   await legacyPage.waitForFunction(()=>document.querySelector("#audit-result").textContent.includes("Сверка отменена")&&!document.querySelector("#audit-check").disabled);
   await waitStatus(legacyPage,"Ожидается сверка");
   assert.equal(await legacyPage.locator("#audit-progress").isVisible(),false);
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   assert.equal(await legacyPage.locator("#overview").innerText(),originalMetrics);
   slowAudit=false;
   await legacyPage.locator("#audit-check").click();await waitStatus(legacyPage,"Сверка недоступна");
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   // The user-reported regression: local unavailable is newer than a verified
   // publication of the same chain tip. An ordinary refresh must recover.
   legacySeed={...snapshot,audit:{...snapshot.audit,asOf:now}};
   await legacyPage.locator("#refresh").click();
   await legacyPage.waitForFunction(()=>!document.querySelector("#refresh").disabled&&document.querySelector("#status").className==="status ");
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   assert.equal(await legacyPage.locator("#overview").innerText(),originalMetrics);
   await legacyPage.reload();
   await legacyPage.locator("#startup-screen").waitFor({state:"detached"});
   await legacyPage.waitForFunction(()=>!document.querySelector("#refresh").disabled&&document.querySelector("#status").className==="status ");
   // A subsequent unsuccessful retry must not erase the confirmed history.
   await legacyPage.locator("#method-section summary").click();
   await legacyPage.locator("#audit-check").click();
   await legacyPage.waitForFunction(()=>!document.querySelector("#audit-check").disabled&&document.querySelector("#status").className==="status "&&document.querySelector("#audit-result").textContent.includes("Второй индексатор"));
   assert.equal(await legacyPage.locator("#notice").isVisible(),false);
   // P2-04: exercise the real chart DOM in both engines with multiple bins.
   // Synthetic PointerEvents cover deterministic direction/cancel cases;
   // Chromium additionally performs a native touch scroll using CDP.
   await legacyPage.locator("#method-section").evaluate(e=>e.open=false);
   await legacyPage.locator('[data-range="24h"]').click();
   for(const id of ["growth-chart","daily-chart","fees-chart"]){
    const plot=legacyPage.locator("#"+id+" .chart-plot");
    await plot.scrollIntoViewIfNeeded();
    const result=await plot.evaluate(svg=>{
     const rect=svg.getBoundingClientRect(),x=rect.left+rect.width*.24,y=rect.top+rect.height*.55;
     const cursor=()=>svg.querySelector(".cursor").getAttribute("x1");
     const readout=()=>svg.parentElement.querySelector(".chart-readout").textContent;
     const send=(type,dx=0,dy=0,pointerId=41,isPrimary=true,pointerType="touch",target=svg)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId,pointerType,isPrimary,clientX:x+dx,clientY:y+dy,button:type==="pointermove"?-1:0,buttons:type==="pointerup"||type==="pointercancel"?0:1}));
     const initial=cursor(),initialReadout=readout();
     send("pointerdown");const deferred=cursor()===initial&&readout()===initialReadout;
     send("pointermove",2,-3);send("pointermove",4,-60);send("pointerup",24,-80);
     const vertical=cursor()===initial&&readout()===initialReadout;
     send("pointerdown");send("pointermove",20,20);send("pointerup",90,20);
     const diagonal=cursor()===initial;
     send("pointerdown");send("pointercancel");send("pointerup");
     const cancelled=cursor()===initial;
     send("pointerdown");send("pointerdown",0,0,42,false,"touch",document.body);send("pointerup");
     const multi=cursor()===initial;
     send("pointerdown");send("pointerup",2,1);
     const tap=cursor()!==initial&&readout()!==initialReadout;
     const selected=cursor();send("pointerdown");send("pointermove",2,1);
     const jitter=cursor()===selected;
     send("pointermove",rect.width*.36,1);
     const horizontal=cursor()!==selected;
     send("pointerup",rect.width*.36,2);const dragged=cursor();
     send("pointerdown",0,0,43,true,"pen");send("pointermove",1,40,43,true,"pen");send("pointerup",2,60,43,true,"pen");
     const penScroll=cursor()===dragged;
     send("pointerdown");send("lostpointercapture");send("pointerup");
     const lost=cursor()===dragged;
     return {deferred,vertical,diagonal,cancelled,multi,tap,jitter,horizontal,penScroll,lost};
    });
    assert.deepEqual(result,{deferred:true,vertical:true,diagonal:true,cancelled:true,multi:true,tap:true,jitter:true,horizontal:true,penScroll:true,lost:true},name+" "+id+" pointer gestures");
    const cursor=plot.locator(".cursor");
    const beforeKey=await cursor.getAttribute("x1");
    await plot.focus();await legacyPage.keyboard.press("ArrowLeft");
    assert.notEqual(await cursor.getAttribute("x1"),beforeKey,name+" "+id+" keyboard selection");
    const box=await plot.boundingBox(),beforeMouse=await cursor.getAttribute("x1");
    await legacyPage.mouse.move(box.x+box.width*.88,box.y+box.height*.5);
    assert.notEqual(await cursor.getAttribute("x1"),beforeMouse,name+" "+id+" mouse hover");
    const beforeMouseDrag=await cursor.getAttribute("x1");
    await legacyPage.mouse.down();await legacyPage.mouse.move(box.x+box.width*.22,box.y+box.height*.5,{steps:3});await legacyPage.mouse.up();
    assert.notEqual(await cursor.getAttribute("x1"),beforeMouseDrag,name+" "+id+" mouse drag");
    assert.equal(await legacyPage.locator("#card-export-menu").evaluate(e=>e.open),false);
   }
   const touchPlot=legacyPage.locator("#growth-chart .chart-plot");
   await touchPlot.scrollIntoViewIfNeeded();
   let touchBox=await touchPlot.boundingBox();
   const tapBefore=await touchPlot.locator(".cursor").getAttribute("x1");
   await legacyPage.touchscreen.tap(touchBox.x+touchBox.width*.8,touchBox.y+touchBox.height*.5);
   assert.notEqual(await touchPlot.locator(".cursor").getAttribute("x1"),tapBefore,name+" native tap");
   if(name==="chromium"){
    await touchPlot.scrollIntoViewIfNeeded();
    touchBox=await touchPlot.boundingBox();
    const session=await migration.newCDPSession(legacyPage);
    const x=Math.round(touchBox.x+touchBox.width*.22),y=Math.round(touchBox.y+touchBox.height*.65);
    const beforeScroll=await legacyPage.evaluate(()=>scrollY),beforeCursor=await touchPlot.locator(".cursor").getAttribute("x1");
    await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y,id:1}]});
    for(const dy of [12,25,45,70,100,130]){
     await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y-dy,id:1}]});
     await legacyPage.waitForTimeout(30);
    }
    await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await legacyPage.waitForFunction(start=>scrollY>start+20,beforeScroll);
    assert.equal(await touchPlot.locator(".cursor").getAttribute("x1"),beforeCursor,"native vertical scroll must not select chart point");
    await session.detach();
   }
   // The plot is excluded from the card export long press, while the card
   // surface itself still opens the existing preview after a stationary hold.
   await touchPlot.scrollIntoViewIfNeeded();
   const press=(target,type)=>target.evaluate((e,type)=>{const r=e.getBoundingClientRect();e.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:73,pointerType:"touch",isPrimary:true,button:0,buttons:type==="pointerup"?0:1,clientX:r.left+10,clientY:r.top+10}))},type);
   await press(touchPlot,"pointerdown");await legacyPage.waitForTimeout(700);
   assert.equal(await legacyPage.locator("#card-export-menu").evaluate(e=>e.open),false);
   await press(touchPlot,"pointerup");
   const exportCard=legacyPage.locator("#overview");
   await exportCard.scrollIntoViewIfNeeded();
   // Flush native scroll events before starting the stationary press.
   await legacyPage.waitForTimeout(150);
   await press(exportCard,"pointerdown");
   await legacyPage.locator("#card-export-menu").waitFor({state:"visible"});
   await press(exportCard,"pointerup");
   await legacyPage.waitForFunction(()=>!document.querySelector("#card-export-download").disabled);
   await legacyPage.keyboard.press("Escape");
   await legacyPage.locator("#card-export-menu").waitFor({state:"hidden"});
   await migration.close();
   // Failure and reduced-motion: normal application error must remain usable.
   const offline=await browser.newContext({viewport:{width:393,height:852},reducedMotion:"reduce"});
   await offline.route("**/snapshot.json*",deny);
   await offline.route("https://toncenter.com/**",deny);
   await offline.route("https://tonapi.io/**",deny);
   const offlinePage=await offline.newPage();
   await offlinePage.goto(url,{waitUntil:"domcontentloaded"});
   await offlinePage.locator("#startup-screen").waitFor({state:"visible"});
   assert.equal(await offlinePage.locator("#startup-screen").evaluate(e=>getComputedStyle(e).transitionDuration),"0s");
   await offlinePage.locator("#startup-screen").waitFor({state:"detached",timeout:10000});
   await offlinePage.waitForFunction(()=>!document.querySelector("#refresh").disabled);
   assert.equal(await offlinePage.locator(".page").evaluate(e=>getComputedStyle(e).visibility),"visible");
   await offline.close();
   // Even if the app module itself fails, the presentation must fail open.
   const broken=await browser.newContext({viewport:{width:393,height:852},reducedMotion:"reduce"});
   await broken.route("**/app.mjs?*",route=>route.abort());
   const brokenPage=await broken.newPage();
   await brokenPage.goto(url,{waitUntil:"domcontentloaded"});
   await brokenPage.locator("#startup-screen").waitFor({state:"visible"});
   await brokenPage.locator("#startup-screen").waitFor({state:"detached",timeout:12000});
   assert.equal(await brokenPage.locator(".page").evaluate(e=>getComputedStyle(e).visibility),"visible");
   await broken.close();
   const nojs=await browser.newContext({javaScriptEnabled:false});
   const nojsPage=await nojs.newPage();await nojsPage.goto(url);
   assert.equal(await nojsPage.locator("#startup-screen").isVisible(),false);
   assert.equal(await nojsPage.locator(".page").isVisible(),true);
   await nojs.close();
   assert.deepEqual(errors,[]);
   await ctx.close();
   console.log(name,"Trust states, bilingual viewports, CSV/PNG, audit cancellation, startup screen and chart gestures verified");
  }finally{await browser.close()}
 }
}finally{server.close()}
