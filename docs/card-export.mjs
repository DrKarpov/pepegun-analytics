// Isolated per-card PNG export. No analytics or network access.
const labels={
 en:{hint:"Hold a card or right-click to export PNG",title:"Export card",download:"Download PNG",share:"Share",cancel:"Cancel",preparing:"Preparing image…",failed:"Image could not be prepared. Try again.",shareFailed:"Sharing is unavailable. Download the PNG instead.",overview:"Overview",finite:"New and returning wallets",asOf:"Data as of",independent:"Independent on-chain analytics",stale:"Cached data",exportHint:"Export PNG"},
 ru:{hint:"Зажмите карточку или нажмите правой кнопкой для экспорта PNG",title:"Экспорт карточки",download:"Скачать PNG",share:"Поделиться",cancel:"Отмена",preparing:"Подготовка изображения…",failed:"Не удалось подготовить изображение. Попробуйте ещё раз.",shareFailed:"Не удалось поделиться. Скачайте PNG.",overview:"Основные показатели",finite:"Новые и вернувшиеся кошельки",asOf:"Данные на",independent:"Независимая ончейн-аналитика",stale:"Сохранённые данные",exportHint:"Экспорт PNG"}
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
 const clone=svg.cloneNode(true),view=svg.viewBox.baseVal;clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("font-family","system-ui, sans-serif");clone.removeAttribute("tabindex");clone.setAttribute("width",String(view.width));clone.setAttribute("height",String(view.height));
 return {...base,title:text(card,"h2"),subtitle:text(card,".chart-interval"),description:text(card,".sub"),readout:text(card,".chart-readout"),svg:new XMLSerializer().serializeToString(clone),ratio:view.height/view.width,legend:[...card.querySelectorAll(".chart-legend span")].map(s=>({label:s.textContent.trim(),color:s.querySelector("i")?.style.backgroundColor||palette.accent}))};
}
export async function renderCardPng(s){
 const W=720,p=28,cw=W-2*p,L=labels[s.meta.lang],canvas=document.createElement("canvas"),g=canvas.getContext("2d");
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
 const title=lines(s.title,cw-32,23,true),sub=lines(s.subtitle,cw-32,15),desc=lines(s.description,cw-32,15),period=lines(s.meta.period,cw,16,true),stamp=lines(L.asOf+" "+s.meta.asOf+(s.meta.stale?" · "+L.stale:""),cw,13),read=lines(s.readout,cw-36,15);
 const headerH=94+period.length*23+stamp.length*19,top=headerH+12;
 let tiles=[],rows=[],cols=0,tileW=0,cardH=0,plotH=0,legendRows=[];
 const contentTop=22+title.length*33+sub.length*21+desc.length*21;
 if(s.tiles){
  cols=s.id==="active"?3:2;tileW=(cw-24)/cols;
  tiles=s.tiles.map(t=>({...t,labels:lines(t.label,tileW-20,16,true),hints:lines(t.hint,tileW-20,13)}));
  for(let i=0;i<tiles.length;i+=cols){const group=tiles.slice(i,i+cols),labelH=Math.max(...group.map(t=>t.labels.length),1)*23,hintH=Math.max(...group.map(t=>t.hints.length),0)*19;rows.push({group,labelH,hintH,h:26+labelH+8+44+(hintH?8+hintH:0)})}
  cardH=contentTop+rows.reduce((n,r)=>n+r.h,0)+12;
 }else{
  plotH=Math.ceil((cw-36)*s.ratio);
  font(14);let row=[],total=0;for(const item of s.legend){const w=g.measureText(item.label).width+25;if(row.length&&total+w>cw-36){legendRows.push({row,total});row=[];total=0}row.push({...item,w});total+=w}if(row.length)legendRows.push({row,total});
  cardH=contentTop+12+plotH+12+legendRows.length*23+12+read.length*21+18;
 }
 const H=top+cardH+58;canvas.width=W*2;canvas.height=H*2;g.scale(2,2);g.fillStyle=palette.bg;g.fillRect(0,0,W,H);
 const logo=await imageFrom(new URL("./pepegun-logo.svg",import.meta.url).href);
 const logoScale=Math.min(48/logo.naturalWidth,48/logo.naturalHeight);const lw=logo.naturalWidth*logoScale,lh=logo.naturalHeight*logoScale;g.drawImage(logo,p+(48-lw)/2,24+(48-lh)/2,lw,lh);
 drawLines(["Pepegun Analytics"],p+60,22,25,palette.text,true,"left");drawLines([L.independent],p+60,57,13,palette.muted,false,"left");
 let y=94;y=drawLines(period,W/2,y,16,palette.accent,true,"center",23);drawLines(stamp,W/2,y,13,palette.muted,false,"center",19);
 round(p,top,cw,cardH,palette.card);y=top+22;y=drawLines(title,W/2,y,23,palette.text,true,"center",33);y=drawLines(sub,W/2,y,15,palette.muted,false,"center",21);y=drawLines(desc,W/2,y,15,palette.muted,false,"center",21);
 if(s.tiles){
  for(const r of rows){r.group.forEach((t,i)=>{const x=p+12+i*tileW,mid=x+tileW/2;round(x+4,y+2,tileW-8,r.h-4,t.primary?palette.primary:palette.card);drawLines(t.labels,mid,y+12+(r.labelH-t.labels.length*23)/2,16,palette.text,true,"center",23);fit(t.value,mid,y+12+r.labelH+8,34,tileW-20,t.primary?palette.accent:palette.text);drawLines(t.hints,mid,y+12+r.labelH+8+44+8,13,palette.muted,false,"center",19)});y+=r.h}
 }else{
  const url=URL.createObjectURL(new Blob([s.svg],{type:"image/svg+xml;charset=utf-8"}));try{const plot=await imageFrom(url);g.drawImage(plot,p+18,y+12,cw-36,plotH)}finally{URL.revokeObjectURL(url)}y+=12+plotH+12;
  for(const {row,total} of legendRows){let x=(W-total)/2;for(const item of row){g.fillStyle=item.color;g.fillRect(x,y+4,9,9);drawLines([item.label],x+14,y,14,palette.muted,false,"left");x+=item.w}y+=23}
  drawLines(read,W/2,y+12,15,palette.muted,false,"center",21);
 }
 drawLines(["drkarpov.github.io/pepegun-analytics"],W/2,top+cardH+20,13,palette.muted,false);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG unavailable")),"image/png"));
}
export function setupCardExport(getMeta,download){
 const dialog=document.getElementById("card-export-menu"),hint=document.getElementById("card-export-hint"),title=document.getElementById("card-export-title"),save=document.getElementById("card-export-download"),share=document.getElementById("card-export-share"),cancel=document.getElementById("card-export-cancel"),status=document.getElementById("card-export-status");
 const cards=[...document.querySelectorAll("[data-card-export]")];let press=null,timer=0,serial=0,ready=null,origin=null;
 const stop=()=>{clearTimeout(timer);timer=0;press=null};
 const excluded=target=>!!target.closest("button,a,input,select,textarea,.chart-plot");
 function update(){const meta=getMeta(),L=labels[meta.lang];hint.textContent=L.hint;hint.hidden=!meta.valid;for(const card of cards){card.tabIndex=meta.valid&&!card.hidden?0:-1;card.setAttribute("aria-description",L.hint)}}
 function close(){serial++;ready=null;if(dialog.open)dialog.close()}
 async function open(card){
  stop();const meta=getMeta();if(!meta.valid||card.hidden||dialog.open)return;const L=labels[meta.lang];let s;
  try{s=capture(card,meta)}catch{return}
  origin=card;const token=++serial;ready=null;title.textContent=s.title||L.title;save.textContent=L.download;share.textContent=L.share;cancel.textContent=L.cancel;save.disabled=share.disabled=true;share.hidden=typeof navigator.share!=="function";status.textContent=L.preparing;
  dialog.showModal();cancel.focus();
  try{const blob=await renderCardPng(s);if(token!==serial||!dialog.open)return;const name="pepegun-"+s.id+"-"+meta.anchor+".png";let file=null;try{file=new File([blob],name,{type:"image/png"})}catch{}ready={blob,name,file,L};save.disabled=false;share.hidden=!(file&&typeof navigator.canShare==="function"&&navigator.canShare({files:[file]}));share.disabled=share.hidden;status.textContent="";save.focus()}catch{if(token===serial&&dialog.open)status.textContent=L.failed}
 }
 for(const card of cards){
  card.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"||e.isPrimary===false||e.button!==0||excluded(e.target)||!getMeta().valid)return;stop();press={id:e.pointerId,x:e.clientX,y:e.clientY,card};timer=setTimeout(()=>{if(press?.card===card)open(card)},600)});
  card.addEventListener("contextmenu",e=>{if(!getMeta().valid||excluded(e.target))return;e.preventDefault();open(card)});
  card.addEventListener("keydown",e=>{if(e.target!==card)return;if(e.key==="ContextMenu"||(e.shiftKey&&e.key==="F10")||e.key==="Enter"){e.preventDefault();open(card)}});
 }
 window.addEventListener("pointermove",e=>{if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)stop()},{passive:true});
 for(const event of ["pointerup","pointercancel","scroll","blur"])window.addEventListener(event,stop,{passive:true,capture:true});
 window.addEventListener("pointerdown",e=>{if(e.isPrimary===false)stop()},{passive:true});
 save.addEventListener("click",()=>{if(ready){download(ready.blob,ready.name);close()}});
 share.addEventListener("click",async()=>{if(!ready?.file)return;const s=ready;try{await navigator.share({files:[s.file],title:"Pepegun Analytics"});close()}catch(e){if(e.name!=="AbortError")status.textContent=s.L.shareFailed}});
 cancel.addEventListener("click",close);dialog.addEventListener("click",e=>{if(e.target===dialog)close()});dialog.addEventListener("close",()=>{serial++;ready=null;origin?.focus({preventScroll:true});origin=null});
 update();return update;
}
