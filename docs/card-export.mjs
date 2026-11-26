// Isolated per-card PNG export. No analytics or network access.
const labels={
 en:{hint:"Hold a card or right-click to export PNG",title:"Preview",download:"Download",share:"Share",cancel:"Close",preparing:"Preparing image…",failed:"Image could not be prepared. Try again.",shareFailed:"Sharing is unavailable. Download the PNG instead.",overview:"Overview",finite:"New and returning wallets",asOf:"Data as of",independent:"Independent on-chain analytics",stale:"Cached data",exportHint:"Export PNG"},
 ru:{hint:"Зажмите карточку или нажмите правой кнопкой для экспорта PNG",title:"Предпросмотр",download:"Скачать",share:"Поделиться",cancel:"Закрыть",preparing:"Подготовка изображения…",failed:"Не удалось подготовить изображение. Попробуйте ещё раз.",shareFailed:"Не удалось поделиться. Скачайте PNG.",overview:"Основные показатели",finite:"Новые и вернувшиеся кошельки",asOf:"Данные на",independent:"Независимая ончейн-аналитика",stale:"Сохранённые данные",exportHint:"Экспорт PNG"}
};
const palette={bg:"#101211",card:"#171a18",border:"#292e2b",text:"#edf1ee",muted:"#aab3ac",accent:"#b5ef58",primary:"#1a2018"};
const text=(el,selector)=>el.querySelector(selector)?.textContent.trim()||"";
const imageFrom=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error("Image unavailable"));i.src=src});
function capture(card,meta){
 const id=card.dataset.cardExport,L=labels[meta.lang],base={id,meta:{...meta},title:""};
 if(id==="overview"||id==="finite"){
  return {...base,title:L[id],tiles:[...card.querySelectorAll(".kpi")].map(k=>({label:text(k,".kpi-label"),value:text(k,".kpi-value"),hint:text(k,".kpi-hint"),primary:k.classList.contains("primary")}))};
 }
 if(id==="active")return {...base,title:text(card,".activity-title strong"),subtitle:text(card,".activity-title small"),tiles:[...card.querySelectorAll(".active-stat")].map(k=>({label:text(k,"small"),value:text(k,"strong"),hint:""}))};
 const svg=card.querySelector(".chart-plot");if(!svg)throw Error("Chart unavailable");
 const clone=svg.cloneNode(true),view=svg.viewBox.baseVal;clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("font-family","system-ui, sans-serif");clone.removeAttribute("tabindex");clone.querySelectorAll(".cursor").forEach(el=>el.remove());clone.setAttribute("width",String(view.width));clone.setAttribute("height",String(view.height));
 return {...base,title:text(card,"h2"),subtitle:text(card,".chart-interval"),description:text(card,".sub"),readout:text(card,".chart-readout"),svg:new XMLSerializer().serializeToString(clone),ratio:view.height/view.width,legend:[...card.querySelectorAll(".chart-legend span")].map(s=>({label:s.textContent.trim(),color:s.querySelector("i")?.style.backgroundColor||palette.accent}))};
}
// Export-only timezone label: once, immediately after an actual clock time.
export function cardTimeLabels(period,asOf,subtitle,readout){
 const clean=value=>String(value||"").replace(/\s*·\s*UTC\b|\s*\(UTC\)|\s*\bUTC\b/g,"").replace(/\s{2,}/g," ").trim();
 const timed=/\b\d{1,2}:\d{2}\b/g;
 const add=value=>value.replace(/\b\d{1,2}:\d{2}\b(?![\s\S]*\b\d{1,2}:\d{2}\b)/,v=>v+" UTC");
 const result={period:clean(period),asOf:clean(asOf),subtitle:clean(subtitle),readout:clean(readout)};
 for(const key of ["period","asOf","readout"]){if([...result[key].matchAll(timed)].length){result[key]=add(result[key]);break}}
 return result;
}

export async function renderCardPng(s){
 const W=720,p=16,cw=W-2*p,L=labels[s.meta.lang],canvas=document.createElement("canvas"),g=canvas.getContext("2d");
 if(!g)throw Error("Canvas unavailable");
 const font=(n,b=false)=>{g.font=(b?"600 ":"400 ")+n+"px system-ui, sans-serif"};
 function lines(value,width,n,b=false){
  font(n,b);const out=[];let line="";
  for(const word of String(value||"").split(/\s+/).filter(Boolean)){
   const joined=line?line+" "+word:word;
   if(g.measureText(joined).width>width&&line){out.push(line);line=word}else line=joined;
   if(g.measureText(line).width>width){let segment="";for(const char of line){if(segment&&g.measureText(segment+char).width>width){out.push(segment);segment=char}else segment+=char}line=segment}
  }if(line)out.push(line);return out;
 }
 function drawLines(a,x,y,n,color,b=false,align="center",step=n*1.4){
  font(n,b);g.fillStyle=color;g.textAlign=align;g.textBaseline="top";a.forEach((v,i)=>g.fillText(v,x,y+i*step));return y+a.length*step;
 }
 function round(x,y,w,h,fill){g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,14);else g.rect(x,y,w,h);g.fillStyle=fill;g.fill();g.strokeStyle=palette.border;g.lineWidth=1;g.stroke()}
 function fit(value,x,y,n,width,color,b=true){font(n,b);while(n>12&&g.measureText(value).width>width)font(--n,b);g.textAlign="center";g.textBaseline="top";g.fillStyle=color;g.fillText(value,x,y)}
 const dates=cardTimeLabels(s.meta.period,s.meta.asOf,s.subtitle,s.readout);
 const title=lines(s.title,cw-24,23,true),sub=lines(dates.subtitle,cw-24,15),desc=lines(s.description,cw-24,15),period=lines(dates.period,cw,15,true),stamp=lines(L.asOf+" "+dates.asOf+(s.meta.stale?" · "+L.stale:""),cw,12),read=lines(dates.readout,cw-28,15);
 const top=p+36+6+period.length*20+stamp.length*17+10;
 let tiles=[],rows=[],cols=0,tileW=0,cardH=0,plotH=0,legendRows=[];
 const contentTop=12+title.length*30+sub.length*20+desc.length*20;
 if(s.tiles){
  cols=s.id==="active"?3:2;tileW=cw/cols;
  tiles=s.tiles.map(t=>({...t,labels:lines(t.label,tileW-20,16,true),hints:lines(t.hint,tileW-20,13)}));
  for(let i=0;i<tiles.length;i+=cols){const group=tiles.slice(i,i+cols),labelH=Math.max(...group.map(t=>t.labels.length),1)*20,hintH=Math.max(...group.map(t=>t.hints.length),0)*18;rows.push({group,labelH,hintH,h:16+labelH+5+40+(hintH?5+hintH:0)})}
  cardH=contentTop+rows.reduce((n,r)=>n+r.h,0)+6;
 }else{
  plotH=Math.ceil((cw-28)*s.ratio);
  font(14);let row=[],total=0;for(const item of s.legend){const w=g.measureText(item.label).width+25;if(row.length&&total+w>cw-36){legendRows.push({row,total});row=[];total=0}row.push({...item,w});total+=w}if(row.length)legendRows.push({row,total});
  cardH=contentTop+6+plotH+6+legendRows.length*21+(read.length?6+read.length*21:0)+12;
 }
 const H=top+cardH+p;canvas.width=W*2;canvas.height=H*2;g.scale(2,2);g.fillStyle=palette.bg;g.fillRect(0,0,W,H);
 const logo=await imageFrom(new URL("./pepegun-logo.svg",import.meta.url).href);
 const logoScale=Math.min(34/logo.naturalWidth,34/logo.naturalHeight);const lw=logo.naturalWidth*logoScale,lh=logo.naturalHeight*logoScale;font(24,true);const brandW=34+9+g.measureText("Pepegun Analytics").width,bx=(W-brandW)/2;g.drawImage(logo,bx+(34-lw)/2,p+(34-lh)/2,lw,lh);
 drawLines(["Pepegun Analytics"],bx+43,p+3,24,palette.text,true,"left");
 let y=p+42;y=drawLines(period,W/2,y,15,palette.accent,true,"center",20);drawLines(stamp,W/2,y,12,palette.muted,false,"center",17);
 round(p,top,cw,cardH,palette.card);y=top+12;y=drawLines(title,W/2,y,23,palette.text,true,"center",30);y=drawLines(sub,W/2,y,15,palette.muted,false,"center",20);y=drawLines(desc,W/2,y,15,palette.muted,false,"center",20);
 if(s.tiles){
  for(const r of rows){r.group.forEach((t,i)=>{const x=p+i*tileW,mid=x+tileW/2;
   if(t.primary){g.fillStyle=palette.primary;g.fillRect(x+1,y,tileW-1,r.h)}
   if(i){g.strokeStyle=palette.border;g.beginPath();g.moveTo(x,y+6);g.lineTo(x,y+r.h-6);g.stroke()}
   if(s.id==="active"){fit(t.value,mid,y+8,34,tileW-20,palette.text);drawLines(t.labels,mid,y+8+40+5,16,palette.muted,false,"center",20)}
   else{drawLines(t.labels,mid,y+8+(r.labelH-t.labels.length*20)/2,16,palette.text,true,"center",20);fit(t.value,mid,y+8+r.labelH+5,34,tileW-20,t.primary?palette.accent:palette.text);drawLines(t.hints,mid,y+8+r.labelH+5+40+5,13,palette.muted,false,"center",18)}
  });y+=r.h;if(r!==rows.at(-1)){g.strokeStyle=palette.border;g.beginPath();g.moveTo(p+1,y);g.lineTo(p+cw-1,y);g.stroke()}}
 }else{
  const url=URL.createObjectURL(new Blob([s.svg],{type:"image/svg+xml;charset=utf-8"}));try{const plot=await imageFrom(url);g.drawImage(plot,p+14,y+6,cw-28,plotH)}finally{URL.revokeObjectURL(url)}y+=6+plotH+6;
  for(const {row,total} of legendRows){let x=(W-total)/2;for(const item of row){g.fillStyle=item.color;g.fillRect(x,y+4,9,9);drawLines([item.label],x+14,y,14,palette.muted,false,"left");x+=item.w}y+=21}
  drawLines(read,W/2,y+6,15,palette.muted,false,"center",21);
 }
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG unavailable")),"image/png"));
}
export function setupCardExport(getMeta,download){
 const dialog=document.getElementById("card-export-menu"),hint=document.getElementById("card-export-hint"),title=document.getElementById("card-export-title"),save=document.getElementById("card-export-download"),share=document.getElementById("card-export-share"),cancel=document.getElementById("card-export-cancel"),status=document.getElementById("card-export-status"),preview=document.getElementById("card-export-preview"),previewFrame=document.getElementById("card-export-preview-frame"),actions=document.getElementById("card-export-actions");
 const cards=[...document.querySelectorAll("[data-card-export]")];let press=null,timer=0,serial=0,ready=null,origin=null,previewUrl=null,closing=false;
 const root=document.documentElement;
 const setInput=mode=>{root.dataset.inputMode=mode};setInput("pointer");
 document.addEventListener("pointerdown",()=>setInput("pointer"),true);
 document.addEventListener("keydown",e=>{if(["Tab","Enter"," ","Escape","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ContextMenu","F10"].includes(e.key))setInput("keyboard")},true);
 const stop=()=>{clearTimeout(timer);timer=0;press?.card.classList.remove("export-holding");press=null};
 const clearHold=()=>{stop();for(const card of cards)card.classList.remove("export-holding")};
 const excluded=target=>!!target.closest("button,a,input,select,textarea,.chart-plot");
 const clearPreview=()=>{previewFrame.hidden=true;preview.width=1;preview.height=1;preview.removeAttribute("aria-label");if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}};
 function update(){const meta=getMeta(),L=labels[meta.lang];hint.textContent=L.hint;hint.hidden=!meta.valid;for(const card of cards){card.tabIndex=meta.valid&&!card.hidden?0:-1;card.setAttribute("aria-description",L.hint)}}
 function close(){
  clearHold();if(!dialog.open||closing)return;closing=true;serial++;ready=null;save.disabled=share.disabled=true;dialog.classList.add("export-closing");
  setTimeout(()=>{if(dialog.open)dialog.close()},window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:160);
 }
 async function open(card,keyboard=false){
  clearHold();if(!keyboard)setInput("pointer");const meta=getMeta();if(!meta.valid||card.hidden||dialog.open||closing)return;const L=labels[meta.lang];let s;
  try{s=capture(card,meta)}catch{return}
  origin=keyboard?card:null;const token=++serial;ready=null;clearPreview();title.textContent=L.title;save.textContent=L.download;share.textContent=L.share;cancel.setAttribute("aria-label",L.cancel);cancel.title=L.cancel;save.disabled=share.disabled=true;share.hidden=typeof navigator.share!=="function"||typeof navigator.canShare!=="function";actions.classList.toggle("single",share.hidden);status.textContent=L.preparing;
  dialog.showModal();if(keyboard)cancel.focus({preventScroll:true});else{title.setAttribute("tabindex","-1");title.focus({preventScroll:true})}
  try{
   const blob=await renderCardPng(s);if(token!==serial||!dialog.open||closing)return;
   const name="pepegun-"+s.id+"-"+meta.anchor+".png";let file=null;try{file=new File([blob],name,{type:"image/png"})}catch{}
   const url=URL.createObjectURL(blob);previewUrl=url;
   const image=await imageFrom(url);
   if(token!==serial||!dialog.open||closing)return;
   preview.width=image.naturalWidth;preview.height=image.naturalHeight;
   const ctx=preview.getContext("2d");if(!ctx)throw Error("Preview unavailable");
   ctx.drawImage(image,0,0);preview.setAttribute("aria-label",s.title);
   URL.revokeObjectURL(url);previewUrl=null;
   ready={blob,name,file,L};previewFrame.hidden=false;save.disabled=false;let canShare=false;try{canShare=!!file&&typeof navigator.canShare==="function"&&navigator.canShare({files:[file]})}catch{}
   share.hidden=!canShare;share.disabled=!canShare;actions.classList.toggle("single",!canShare);status.textContent="";
  }catch{if(token===serial&&dialog.open&&!closing){clearPreview();status.textContent=L.failed}}
 }
 for(const card of cards){
  card.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"||e.isPrimary===false||e.button!==0||excluded(e.target)||!getMeta().valid||dialog.open)return;stop();press={id:e.pointerId,x:e.clientX,y:e.clientY,card};card.classList.add("export-holding");timer=setTimeout(()=>{if(press?.card===card)open(card)},600)});
  card.addEventListener("contextmenu",e=>{if(!getMeta().valid||excluded(e.target))return;e.preventDefault();if(press||e.pointerType==="touch"||e.pointerType==="pen"||e.sourceCapabilities?.firesTouchEvents)return;open(card)});
  card.addEventListener("keydown",e=>{if(e.target!==card)return;if(e.key==="ContextMenu"||(e.shiftKey&&e.key==="F10")||e.key==="Enter"){e.preventDefault();open(card,true)}});
 }
 window.addEventListener("pointermove",e=>{if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)stop()},{passive:true});
 for(const event of ["pointerup","pointercancel","scroll","blur"])window.addEventListener(event,stop,{passive:true,capture:true});
 window.addEventListener("pointerdown",e=>{if(e.isPrimary===false)stop()},{passive:true});
 save.addEventListener("click",()=>{if(ready){download(ready.blob,ready.name);close()}});
 share.addEventListener("click",async()=>{if(!ready?.file)return;const s=ready;try{await navigator.share({files:[s.file]});close()}catch(e){if(e.name!=="AbortError"&&ready===s)status.textContent=s.L.shareFailed}});
 previewFrame.addEventListener("contextmenu",e=>e.preventDefault());previewFrame.addEventListener("dragstart",e=>e.preventDefault());
 cancel.addEventListener("click",close);dialog.addEventListener("cancel",e=>{e.preventDefault();close()});dialog.addEventListener("click",e=>{if(e.target===dialog)close()});dialog.addEventListener("close",()=>{clearHold();serial++;ready=null;clearPreview();dialog.classList.remove("export-closing");closing=false;if(origin&&root.dataset.inputMode==="keyboard")origin.focus({preventScroll:true});else{const focused=document.activeElement;if(focused instanceof HTMLElement||focused instanceof SVGElement){if(focused.closest("[data-card-export],#card-export-menu"))focused.blur?.()}}origin=null});
 update();return update;
}
