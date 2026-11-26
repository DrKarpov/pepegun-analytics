// Global dashboard PNG renderer, with a frozen input snapshot and no app state mutation.
import {ADDRESS,compactAmount} from "./analytics.mjs?v=35";
import {words,time} from "./i18n.mjs?v=39";
import {colors,barOpacity} from "./chart-style.mjs?v=39";
export async function renderDashboardPng({snapshot,exportSeries,asOf,old,trust,label,currentLang}){
 const canvas=document.createElement("canvas");canvas.width=2400;canvas.height=1840;const g=canvas.getContext("2d");if(!g)throw Error("Canvas unavailable");g.scale(2,2);const W=1200,H=920;
 const palette={bg:"#101211",card:"#171a18",border:"#292e2b",muted:"#a1aaa3",text:"#edf1ee",green:"#b5ef58",paid:"#71c5b3"};
 const font=(n,b=false)=> (b?"600 ":"400 ")+n+"px system-ui, sans-serif";
 function txt(s,x,y,n=16,c=palette.text,b=false,max=Infinity){g.font=font(n,b);while(g.measureText(s).width>max&&n>9)g.font=font(--n,b);g.fillStyle=c;g.fillText(s,x,y)}
 function rect(x,y,w,h,c){g.fillStyle=c;g.strokeStyle=palette.border;g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,12);else g.rect(x,y,w,h);g.fill();g.stroke()}
 g.fillStyle=palette.bg;g.fillRect(0,0,W,H);
 try{const im=new Image();im.src="./pepegun-logo.svg";await im.decode();g.drawImage(im,38,26,56,56)}catch{}
 txt("Pepegun Analytics",105,52,30,palette.text,true,620);txt(words[currentLang].subtitle,105,75,15,palette.muted,false,620);
 txt(label,725,44,15,palette.green,true,435);if(trust)txt(words[currentLang][trust],725,88,12,trust==="trustMismatch"?"#ffb16b":palette.muted,true,435);txt(words[currentLang].asOf+" "+time(asOf)+(old?" · "+words[currentLang].stale:""),725,68,13,palette.muted,false,435);
 const loc=currentLang==="ru"?"ru-RU":"en-US",n=x=>new Intl.NumberFormat(loc).format(x),f=x=>compactAmount(x,loc,4);
 const tiles=[[words[currentLang].wallets,n(snapshot.wallets)],[words[currentLang].paying,n(snapshot.paying)],[words[currentLang].revenue,f(snapshot.fee)+" GRAM"],[words[currentLang].payments,n(snapshot.count)]];
 tiles.forEach(([k,v],i)=>{const x=38+i*284;rect(x,100,272,103,palette.card);g.textAlign="center";txt(k,x+136,130,15,palette.muted,false,242);txt(v,x+136,173,32,i===0?palette.green:palette.text,true,242);g.textAlign="left"});
 function draw(x,y,w,h,title,data,series,mode="line"){
 rect(x,y,w,h,palette.card);txt(title,x+16,y+26,17,palette.text,true,w-32);
 const L=x+54,R=x+w-18,T=y+49,B=y+h-62,pw=R-L,ph=B-T;
 const val=(d,k)=>k==="fee"?Number(d.fee)/1e9:d[k]||0;let max=0;
 for(const d of data){max=Math.max(max,...series.map(([k])=>val(d,k)),mode==="stack"?d.active:0)}const unit=max?10**Math.floor(Math.log10(max/3)):1,raw=max/3/unit,nice=(raw<=1?1:raw<=2?2:raw<=2.5?2.5:raw<=5?5:10)*unit,step=max?(mode==="bar"?Math.max(1e-9,nice):Math.max(1,Math.ceil(nice))):1;max=Math.max(step,Math.ceil(max/step)*step);const ticks=Math.round(max/step);
 const at=i=>L+(i+.5)*pw/Math.max(1,data.length),py=v=>B-v/max*ph,bw=Math.max(.6,Math.min(15,pw/Math.max(1,data.length)*.7));
 for(let i=0;i<=ticks;i++){const v=i*step,yy=py(v);g.strokeStyle=palette.border;g.beginPath();g.moveTo(L,yy);g.lineTo(R,yy);g.stroke();txt(new Intl.NumberFormat(loc,{maximumSignificantDigits:3}).format(v),x+7,yy+4,11,palette.muted,false,45)}
 if(mode==="bar"||mode==="stack")data.forEach((d,i)=>{let prev=0;for(const [k,c] of series.filter(s=>mode==="bar"||s[0]!=="paying")){const v=val(d,k);g.fillStyle=c;g.globalAlpha=barOpacity(k,d.status!=="complete",.45);g.fillRect(at(i)-bw/2,py(prev+v),bw,py(prev)-py(prev+v));g.globalAlpha=1;prev+=v}});
 for(const [k,c] of series.filter(s=>mode==="line"||(mode==="stack"&&s[0]==="paying"))){g.strokeStyle=c;g.lineWidth=2;g.beginPath();data.forEach((d,i)=>{const px=at(i),yy=py(val(d,k));i?g.lineTo(px,yy):g.moveTo(px,yy)});g.stroke();if(data.length===1){g.fillStyle=c;g.beginPath();g.arc(at(0),py(val(data[0],k)),2.5,0,Math.PI*2);g.fill()}}
 if(data.length){const stamp=b=>["15m","1h","3h","6h"].includes(exportSeries.kind)?b.date.slice(5,10)+" "+b.date.slice(11,16):b.date.slice(0,10);txt(stamp(data[0]),L,B+18,11,palette.muted);const last=stamp(data.at(-1));g.font=font(11);if(data.length>1)txt(last,R-g.measureText(last).width,B+18,11,palette.muted)}
 let xx=x+16;for(const [k,c,label] of series){g.fillStyle=c;g.fillRect(xx,y+h-23,7,7);txt(label,xx+11,y+h-16,11,palette.muted);g.font=font(11);xx+=g.measureText(label).width+27}
 }
 draw(38,223,1124,266,words[currentLang].growth,exportSeries.bins,[["cum",palette.green,words[currentLang].allShort],["cumPay",palette.paid,words[currentLang].payingShort]]);
 draw(38,505,554,315,words[currentLang].daily,exportSeries.bins,[["new",palette.green,words[currentLang].newShort],["returning",colors.returning,words[currentLang].returningShort],["paying",palette.paid,words[currentLang].payingShort]],"stack");
 draw(608,505,554,315,words[currentLang].feesChart,exportSeries.bins,[["fee",palette.green,"GRAM"]],"bar");
 txt(words[currentLang].exportNote,38,852,14,palette.muted,false,1124);
 txt(words[currentLang].collector+": "+ADDRESS,38,878,12,palette.muted,false,1124);
 if(exportSeries.bins.some(b=>b.status!=="complete"))txt(words[currentLang].partial+" · UTC",38,900,12,palette.muted,false,1124);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG unavailable")),"image/png"));
}
