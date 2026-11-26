// SVG charts, point selection and touch/mouse gestures; no app-level mutable globals.
import {tr,locale,num,money,esc} from "./i18n.mjs?v=39";
import {colors,barOpacity} from "./chart-style.mjs?v=39";
const $=id=>document.getElementById(id);
export function createCharts({getSeries,placeholder,hourly,axisLabel,intervalLabel,statusLabel,openTransactions}){
 let pointsState={},pointBuckets={};
 function resetSelection(){pointsState={};pointBuckets={}}
const fnum=(x,step=1)=>new Intl.NumberFormat(locale(),{maximumFractionDigits:Math.max(0,Math.min(9,Math.ceil(-Math.log10(step))+1)),notation:x>=100000?"compact":"standard"}).format(x);
function chartSpec(){const series=getSeries();return [
 ["growth-chart",series.bins,[{key:"cum",label:tr("allShort"),color:colors.all},{key:"cumPay",label:tr("payingShort"),color:colors.paid}],"line",false],
 ["daily-chart",series.bins,[{key:"new",label:tr("newShort"),color:colors.new},{key:"returning",label:tr("returningShort"),color:colors.returning},{key:"paying",label:tr("payingShort"),color:colors.paid,line:true}],"stack",false],
 ["fees-chart",series.bins,[{key:"fee",label:tr("fee"),color:colors.fee}],"bar",true]
];}
function renderCharts(){for(const [id,data,series,kind,decimal] of chartSpec())drawChart(id,data,series,kind,decimal)}
// A re-render replaces SVG nodes; release any in-flight gesture listeners first.
const chartGestureCleanup=new Map();
function drawChart(id,data,series,kind,decimal){
 chartGestureCleanup.get(id)?.();chartGestureCleanup.delete(id);
 const root=$(id);if(!data?.length){root.innerHTML=placeholder();return}
 const W=Math.max(200,Math.round(root.clientWidth||320)),H=W<480?184:218,R=12,T=12,B=27,plotH=H-T-B;
 const val=(r,s)=>s.key==="fee"?Number(r.fee)/1e9:Number(r[s.key]||0);
 let max=0;for(const row of data){const a=kind==="stack"?[series.filter(s=>!s.line).reduce((n,s)=>n+val(row,s),0),...series.filter(s=>s.line).map(s=>val(row,s))]:series.map(s=>val(row,s));max=Math.max(max,...a)}
 const unit=max===0?1:Math.pow(10,Math.floor(Math.log10(max/3||1))),raw=max/3/unit,nice=(raw<=1?1:raw<=2?2:raw<=2.5?2.5:raw<=5?5:10)*unit,step=max===0?1:decimal?Math.max(1e-9,nice):Math.max(1,Math.ceil(nice));
 const ceil=Math.max(step,Math.ceil(max/step)*step),ticks=Math.round(ceil/step);
 const L=Math.max(W<330?40:46,Math.min(78,Math.max(...Array.from({length:ticks+1},(_,i)=>fnum(i*step,step).length))*6+9)),plotW=W-L-R;
 const cell=plotW/data.length,x=i=>L+(i+.5)*cell,y=v=>T+plotH-Math.min(1,v/ceil)*plotH;
 let svg='<svg class="chart-plot" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" tabindex="0" role="img" aria-label="'+esc(tr({"growth-chart":"growth","daily-chart":"daily","fees-chart":"feesChart"}[id]))+'">';
 svg+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="transparent" pointer-events="all"/>';
 for(let i=0;i<=ticks;i++){const v=i*step,py=y(v);svg+='<path d="M'+L+' '+py+'H'+(W-R)+'" stroke="'+colors.grid+'" stroke-width="1"/><text x="'+(L-5)+'" y="'+(py+4)+'" fill="'+colors.text+'" text-anchor="end" font-size="10">'+esc(fnum(v,step))+'</text>'}
 const tickCount=hourly()?(W<480?3:5):W<340?4:W<550?5:7,stepX=Math.max(1,Math.ceil((data.length-1)/(tickCount-1)));
 let idxs=[];for(let i=0;i<data.length;i+=stepX)idxs.push(i);if(idxs.at(-1)!==data.length-1){if(data.length-1-idxs.at(-1)<stepX*.55&&idxs.length>1)idxs.pop();idxs.push(data.length-1)}
 for(const i of idxs){const edge=hourly()?32:15;const px=Math.min(W-R-edge,Math.max(L+edge,x(i)));svg+='<text x="'+px+'" y="'+(H-7)+'" text-anchor="middle" font-size="10" fill="'+colors.text+'">'+esc(axisLabel(data[i]))+'</text>'}
 const isPartial=r=>r.status!=="complete";
 if(kind==="bar"||kind==="stack"){
  data.forEach((r,i)=>{let prev=0;const bw=Math.max(.6,Math.min(cell*.7,24));for(const s of series.filter(z=>!z.line)){const v=val(r,s);if(v>0){const top=y(prev+v),h=y(prev)-top;svg+='<rect x="'+(x(i)-bw/2)+'" y="'+top+'" width="'+bw+'" height="'+h+'" rx="'+Math.min(2,bw/4)+'" fill="'+s.color+'" opacity="'+barOpacity(s.key,isPartial(r),.48)+'"/>'}prev+=v}});
 }
 if(kind==="line"||series.some(s=>s.line)){
  for(const s of series.filter(z=>kind==="line"||z.line)){
   let d=data.map((r,i)=>(i?"L":"M")+x(i)+" "+y(val(r,s))).join(" ");
   if(kind==="line"&&s===series[0]&&data.length>1)svg+='<path d="'+d+' L'+x(data.length-1)+' '+y(0)+' L'+x(0)+' '+y(0)+'Z" fill="'+s.color+'" opacity=".045"/>';
   svg+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
   if(data.length<=10)for(let i=0;i<data.length;i++)svg+='<circle cx="'+x(i)+'" cy="'+y(val(data[i],s))+'" r="2" fill="'+s.color+'" opacity="'+(isPartial(data[i])?.55:1)+'"/>';
  }
 }
 svg+='<line class="cursor" x1="0" x2="0" y1="'+T+'" y2="'+(T+plotH)+'" stroke="#adb9ae" stroke-dasharray="3 3" opacity=".5"/></svg>';
 root.innerHTML=svg+'<div class="chart-legend">'+series.map(s=>'<span><i class="swatch" style="background:'+s.color+'"></i>'+esc(s.label)+'</span>').join("")+'</div><div class="chart-readout" aria-live="polite"></div><button type="button" class="chart-tx">'+esc(tr("viewTx"))+' ↗</button>';
 const graphic=root.querySelector("svg"),cursor=root.querySelector(".cursor"),readout=root.querySelector(".chart-readout");
 function focus(i){i=Math.max(0,Math.min(data.length-1,i));pointsState[id]=i;const r=data[i];pointBuckets[id]=i===data.length-1?null:r.bucket;cursor.setAttribute("x1",x(i));cursor.setAttribute("x2",x(i));readout.innerHTML='<strong>'+esc(intervalLabel(r))+'</strong>'+(isPartial(r)?" · "+esc(statusLabel(r.status)):"")+" · "+series.map(s=>esc(s.label)+": <strong>"+esc(s.key==="fee"?money(r.fee)+" GRAM":num(val(r,s)))+"</strong>").join(" · ")}
 const saved=pointBuckets[id];const index=saved==null?-1:data.findIndex(b=>b.bucket===saved);focus(index<0?data.length-1:index);
 root.querySelector(".chart-tx").addEventListener("click",()=>{const r=data[pointsState[id]??data.length-1];if(r)openTransactions({from:r.start,to:r.end},id==="fees-chart"?"fee":"all")});
 let gesture=null;
 const MOVE_LIMIT=8,HORIZONTAL_RATIO=1.25;
 function pointer(e){const rect=graphic.getBoundingClientRect();if(!rect.width)return;const px=(e.clientX-rect.left)*W/rect.width;const i=Math.max(0,Math.min(data.length-1,Math.floor((px-L)/cell)));if(pointsState[id]!==i)focus(i)}
 function clearGesture(){
  const g=gesture;if(!g)return;
  gesture=null;g.events.abort();
  try{if(graphic.hasPointerCapture(g.id))graphic.releasePointerCapture(g.id)}catch{}
 }
 chartGestureCleanup.set(id,clearGesture);
 // Touch/pen contact starts pending. Only a deliberate horizontal drag or
 // a short stationary tap may select; vertical/diagonal swipes are rejected.
 function classifyGesture(e,g){
  const dx=Math.abs(e.clientX-g.x),dy=Math.abs(e.clientY-g.y);
  if(Math.hypot(dx,dy)<MOVE_LIMIT)return "pending";
  return dx>=MOVE_LIMIT&&dx>dy*HORIZONTAL_RATIO?"horizontal":"rejected";
 }
 function cancelPointer(e){if(e.pointerId===gesture?.id)clearGesture()}
 graphic.addEventListener("pointerdown",e=>{
  if(e.isPrimary===false||e.button!==0||gesture)return;
  const events=new AbortController(),g={id:e.pointerId,x:e.clientX,y:e.clientY,mode:e.pointerType==="mouse"?"mouse":"pending",events};
  gesture=g;
  // A second contact anywhere, native scroll, or losing the page cancels
  // selection. These temporary listeners disappear on release or re-render.
  const opts={signal:events.signal,passive:true,capture:true};
  window.addEventListener("pointerdown",next=>{if(next.pointerId!==g.id)clearGesture()},opts);
  window.addEventListener("scroll",clearGesture,opts);
  window.addEventListener("blur",clearGesture,opts);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)clearGesture()},opts);
  if(g.mode==="mouse")pointer(e);
  try{graphic.setPointerCapture(e.pointerId)}catch{}
 });
 graphic.addEventListener("pointermove",e=>{
  if(e.isPrimary===false)return;
  const g=gesture;
  if(!g){if(e.pointerType==="mouse")pointer(e);return}
  if(e.pointerId!==g.id)return;
  if(g.mode==="pending")g.mode=classifyGesture(e,g);
  if(g.mode==="rejected"){clearGesture();return}
  if(g.mode==="mouse"||g.mode==="horizontal")pointer(e);
 });
 graphic.addEventListener("pointerup",e=>{
  const g=gesture;if(!g||e.pointerId!==g.id)return;
  if(g.mode==="pending")g.mode=classifyGesture(e,g);
  if(g.mode!=="rejected")pointer(e);
  clearGesture();
 });
 graphic.addEventListener("pointercancel",cancelPointer);
 graphic.addEventListener("lostpointercapture",cancelPointer);
 graphic.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();focus((pointsState[id]??0)+(e.key==="ArrowRight"?1:-1))}});
}

 return {renderCharts,resetSelection};
}
