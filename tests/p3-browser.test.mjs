// Compare the actual candidate UI with the last verified P2-07 release.
// No browser CSP bypass. Both sides use identical synthetic on-chain history.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {execFileSync} from "node:child_process";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium,webkit} from "playwright";
import {RAW,cacheFrom,packTransaction,AUDIT_SCOPE} from "../docs/analytics.mjs";
const BASE="68c8a0da7a5b4293395bdf1018f117f03e6a6a9f";
const docs=resolve("docs"),artifacts=resolve("browser-artifacts");
await mkdir(artifacts,{recursive:true});
const baseline=new Map();
for(const path of ["index.html","styles.css","app.mjs","analytics.mjs","insights.mjs","card-export.mjs","startup-screen.mjs","pepegun-logo.svg"]){
 baseline.set(path,execFileSync("git",["show",BASE+":docs/"+path],{maxBuffer:4*1024*1024}));
}
const mime={".html":"text/html",".css":"text/css",".mjs":"text/javascript",".svg":"image/svg+xml",".json":"application/json"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,"http://localhost").pathname;
  const match=/^\/(baseline|candidate)\/(.*)$/.exec(pathname);
  if(!match)throw Error("invalid test path");
  const [,side,file]=match,path=file||"index.html",absolute=resolve(docs,path);
  if(!absolute.startsWith(docs+sep))throw Error("invalid path");
  const data=side==="baseline"?baseline.get(path):await readFile(absolute);
  if(!data)throw Error("unknown file");
  res.writeHead(200,{"Content-Type":mime[extname(path)]||"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const url="http://127.0.0.1:"+server.address().port;
const now=Date.UTC(2026,10,26,13),day=Math.floor(now/86400000)*86400;
const hash=i=>i.toString(16).padStart(64,"0");
const txs=[[-85,1,"Pepegun fee · STON.fi"],[-45,2,"Pepegun fee · DeDust"],[-40,1,"Pepegun fee · STON.fi"],[-12,3,"Pepegun · DeDust"],[-6,2,"Pepegun fee · DeDust"],[-4,3,"Pepegun fee · STON.fi"],[-1,1,"Pepegun fee · STON.fi"],[0,4,"Pepegun fee · DeDust"],[0,1,"Pepegun fee · STON.fi"]].map(([offset,wallet,comment],i)=>({h:hash(i+1),lt:String(i+1),prev:String(i),prevHash:hash(i),t:day+offset*86400+12*3600+i*60,success:true,m:{s:"0:"+hash(100+wallet),v:String((i+1)*123456789),b:false,c:comment}}));
const cache=cacheFrom(txs,"toncenter",null,now);
const snapshot={version:cache.version,address:RAW,source:"toncenter",asOf:now,audit:{status:"match",scope:AUDIT_SCOPE,tip:cache.tip,tipHash:cache.tipHash,asOf:now,source:"tonapi"},transactions:txs.map(packTransaction)};
const tc=t=>({account:RAW,hash:t.h,lt:t.lt,prev_trans_lt:t.prev,prev_trans_hash:t.prevHash,now:t.t,description:{aborted:false},in_msg:{source:t.m.s,value:t.m.v,bounced:false,message_content:{decoded:{type:"text_comment",comment:t.m.c}}}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(page,fn){const end=Date.now()+15000;while(!await page.evaluate(fn)){if(Date.now()>end)throw Error("Timed out: "+fn);await wait(50)}}
async function open(browser,side){
 const context=await browser.newContext({viewport:{width:393,height:900},locale:"en-US",reducedMotion:"reduce",acceptDownloads:true});
 await context.addInitScript(()=>localStorage.setItem("pepegun-lang","en"));
 await context.route("https://raw.githubusercontent.com/**/snapshot.json*",r=>r.fulfill({json:snapshot}));
 await context.route("https://toncenter.com/**",r=>{const q=new URL(r.request().url()).searchParams;return r.fulfill({json:{transactions:q.has("start_lt")?[]:q.get("limit")==="1"?[tc(txs.at(-1))]:txs.slice().reverse().map(tc)}})});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date(now));
 await page.goto(url+"/"+side+"/");await page.locator("#startup-screen").waitFor({state:"detached"});
 await until(page,()=>!document.querySelector("#refresh").disabled&&document.querySelector("#status").className==="status ");
 return {page,context,errors};
}
const properties=["display","position","grid-template-columns","grid-template-rows","gap","align-items","align-content","justify-content","justify-items","padding-top","padding-right","padding-bottom","padding-left","margin-top","margin-right","margin-bottom","margin-left","border-top-width","border-right-width","border-bottom-width","border-left-width","border-top-color","border-radius","background-color","color","font-family","font-size","font-weight","line-height","letter-spacing","text-align","overflow-x","overflow-y","opacity","visibility","transform","box-shadow","outline-width","outline-style","outline-color","touch-action"];
async function view(page){
 return page.evaluate(props=>{
  const list=[...document.querySelectorAll(".page, .page *")].filter(el=>el instanceof HTMLElement&&!el.closest("svg")&&el.getClientRects().length);
  return {text:document.querySelector(".page").innerText,charts:[...document.querySelectorAll(".chart-plot")].map(el=>el.outerHTML),elements:list.map(el=>{
   const r=el.getBoundingClientRect(),c=getComputedStyle(el);
   return {tag:el.tagName,id:el.id,cls:el.className,rect:[r.x+scrollX,r.y+scrollY,r.width,r.height].map(n=>Math.round(n*100)/100),style:props.map(p=>c.getPropertyValue(p))};
  })};
 },properties);
}
async function pngPixels(page,a,b,tolerance=0){
 return page.evaluate(async({a,b,tolerance})=>{
  const decode=async base64=>{const src=URL.createObjectURL(new Blob([Uint8Array.from(atob(base64),x=>x.charCodeAt(0))],{type:"image/png"}));try{const im=new Image();im.src=src;await im.decode();const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext("2d");g.drawImage(im,0,0);return {width:c.width,height:c.height,data:g.getImageData(0,0,c.width,c.height).data}}finally{URL.revokeObjectURL(src)}};
  const x=await decode(a),y=await decode(b);if(x.width!==y.width||x.height!==y.height)return {sameSize:false,ratio:1};
  let different=0;for(let i=0;i<x.data.length;i+=4){if([0,1,2,3].some(k=>Math.abs(x.data[i+k]-y.data[i+k])>tolerance))different++}
  return {sameSize:true,ratio:different/(x.width*x.height)};
 },{a:a.toString("base64"),b:b.toString("base64"),tolerance});
}
async function download(page,selector){
 const [d]=await Promise.all([page.waitForEvent("download"),page.locator(selector).click()]);
 return readFile(await d.path());
}
async function card(page,id){
 await until(page,()=>{const d=document.querySelector("#card-export-menu");return !d.open&&!d.classList.contains("export-closing")&&document.querySelector("#card-export-preview").width===1});
 await page.locator('[data-card-export="'+id+'"]').press("Enter");
 await until(page,()=>!document.querySelector("#card-export-download").disabled);
 const info=await page.evaluate(()=>{const el=document.querySelector("#card-export-menu"),c=getComputedStyle(el),r=el.getBoundingClientRect();return {rect:[r.x,r.y,r.width,r.height],bg:c.backgroundColor,border:c.borderColor,backdrop:getComputedStyle(el,"::backdrop").backgroundColor,padding:getComputedStyle(el.querySelector(".card-export-sheet")).padding}});
 const png=await download(page,"#card-export-download");
 await until(page,()=>{const d=document.querySelector("#card-export-menu");return !d.open&&!d.classList.contains("export-closing")&&document.querySelector("#card-export-preview").width===1});
 return {info,png};
}
try{
 for(const [name,engine] of [["chromium",chromium],["webkit",webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const a=await open(browser,"baseline"),b=await open(browser,"candidate");
   for(const width of [320,375,393,768,1024,1440]){
    for(const lang of ["en","ru"]){
     for(const {page} of [a,b]){
      await page.setViewportSize({width,height:900});
      if(await page.locator("html").getAttribute("lang")!==lang)await page.locator("#language").click();
      await page.locator('[data-range="7d"]').click();
      // Expose details and dates; keep the same fixed range on both sides.
      await page.locator('[data-range="custom"]').click();
      await page.locator("#from").fill("2026-09-02");
      await page.locator("#to").fill("2026-11-26");
      await page.locator("#to").dispatchEvent("change");
      await page.evaluate(()=>{document.querySelectorAll("details").forEach(d=>d.open=true);document.activeElement?.blur();scrollTo(0,0)});
     }
     await wait(180);
     const x=await view(a.page),y=await view(b.page),label=name+" "+width+" "+lang;
     assert.equal(y.text,x.text,label+" visible text");assert.deepEqual(y.charts,x.charts,label+" chart SVG");
     assert.equal(y.elements.length,x.elements.length,label+" visible element count");
     for(let i=0;i<x.elements.length;i++)assert.deepEqual(y.elements[i],x.elements[i],label+" element "+i+" "+x.elements[i].tag+" "+x.elements[i].id+" "+x.elements[i].cls);
     if(width===393||width===1440){
      const before=await a.page.screenshot({path:resolve(artifacts,"p3-"+name+"-"+width+"-"+lang+"-baseline.png")});
      const after=await b.page.screenshot({path:resolve(artifacts,"p3-"+name+"-"+width+"-"+lang+"-candidate.png")});
      const pixels=await pngPixels(b.page,before,after,5);
      assert.ok(pixels.sameSize&&pixels.ratio<=.005,label+" screenshot pixel difference "+JSON.stringify(pixels));
     }
     console.log(label,"baseline text, SVG, geometry and computed styles match");
    }
   }
   // Compare exact exported bytes for CSV, decoded pixels for all seven PNGs,
   // plus modal geometry, after the identical fixed custom period.
   for(const lang of ["en","ru"]){
    for(const {page} of [a,b]){
     await page.setViewportSize({width:393,height:900});
     if(await page.locator("html").getAttribute("lang")!==lang)await page.locator("#language").click();
    }
    await wait(180);
    assert.deepEqual(await download(b.page,"#csv"),await download(a.page,"#csv"),name+" "+lang+" CSV bytes");
    const globalA=await download(a.page,"#png"),globalB=await download(b.page,"#png");
    assert.deepEqual(await pngPixels(b.page,globalA,globalB),{sameSize:true,ratio:0},name+" "+lang+" global PNG pixels");
    for(const id of ["overview","active","finite","growth","activity","fees"]){
     const before=await card(a.page,id),after=await card(b.page,id);
     assert.deepEqual(after.info,before.info,name+" "+lang+" "+id+" preview geometry");
     assert.deepEqual(await pngPixels(b.page,before.png,after.png),{sameSize:true,ratio:0},name+" "+lang+" "+id+" PNG pixels");
    }
   }
   assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
   await a.context.close();await b.context.close();
   console.log(name,"P3 baseline comparisons and all PNG/CSV exports verified");
  }finally{await browser.close()}
 }
}finally{server.close()}
