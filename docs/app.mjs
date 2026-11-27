import {lang,tr,locale,num,pct,money,esc,time,txTime,utcDate,syncTime,shortDate,clock,intervalName,toggleLanguage} from "./i18n.mjs?v=40";
import {createCharts} from "./charts.mjs?v=40";
import {renderDashboardPng} from "./dashboard-export.mjs?v=40";
import {setupCardExport} from "./card-export.mjs?v=38";
import {ADDRESS,REFRESH,STALE,dayIndex,dayKey,resolveRange,metrics,exact,sync,loadCache,saveCache,crossCheck,auditResult,auditTrust,mergeAudit} from "./analytics.mjs?v=35";
import {extraMetrics,previousRange,change,adaptiveSeries,returnRates,rowsInRange,intervalCsv,loadSeed,selectSnapshot} from "./insights.mjs?v=35";
const $=id=>document.getElementById(id);
const hourly=()=>["15m","1h","3h","6h"].includes(series.kind);
function axisLabel(b){return hourly()?(series.kind==="15m"||series.kind==="1h"?(dayIndex(series.bins[0].bucket)===dayIndex(series.bins.at(-1).bucket)?clock(b.bucket):shortDate(b.date)+" "+clock(b.bucket)):shortDate(b.date)+" "+clock(b.bucket)):series.kind==="month"?b.date.slice(0,7):shortDate(b.date)}
function intervalLabel(b){const a=b.start,z=b.end-1;if(hourly())return utcDate(a)+" "+clock(a)+" — "+(dayIndex(a)===dayIndex(b.end)?"":utcDate(b.end)+" ")+clock(b.end);return dayIndex(a)===dayIndex(z)?utcDate(a,true):utcDate(a)+" — "+utcDate(z,true)}
function exportDateLabel(){return range?(selected==="6h"||selected==="24h"?time(range.from)+" — "+time(range.to-1):dateLabel()+" · UTC"):""}
const statusLabel=s=>s==="partial"?tr("partial"):s==="incomplete"?tr("incomplete"):tr("complete");
let cache=null,selected="all",m=null,range=null,busy=true,error=false,storageError=false,exportError=false,progress=null,resizeTimer;
let auditing=false,auditController=null,auditOutcome=null,auditProgress=null,series={kind:"day",bins:[]},txType="fee",txLimit=20,historyLimit=14;
const trustLabel=(trust=auditTrust(cache))=>({mismatch:"trustMismatch",prior:"trustPrior",unavailable:"trustUnavailable",unchecked:"trustUnchecked"}[trust]);
function stale(){return !!cache&&(error||Date.now()-cache.asOf>STALE)}
function language(){document.documentElement.lang=lang;document.querySelectorAll("[data-i]").forEach(el=>el.textContent=tr(el.dataset.i));const switchLabel=lang==="ru"?"Switch to English":"Переключить на русский";$("language").textContent=lang==="ru"?"EN":"RU";$("language").setAttribute("aria-label",switchLabel);$("language").title=switchLabel;$("refresh").setAttribute("aria-label",tr("refresh"));$("refresh").title=tr("refresh");$("filters").setAttribute("aria-label",tr("range"));$("tx-filters").setAttribute("aria-label",lang==="ru"?"Тип транзакции":"Transaction type");$("overview").setAttribute("aria-label",tr("overview"));$("active").setAttribute("aria-label",tr("active"));}
function updateStatus(){
 const isOld=stale(),trust=auditTrust(cache),warning=trustLabel(trust),s=$("status"),label=cache&&trust==="mismatch"?tr(warning):busy?(cache?tr("refreshing"):tr("loading")):cache?(isOld?tr("stale"):warning?tr(warning):tr("synced")):tr("unavailable");
 s.className="status "+(trust==="mismatch"?"error":busy?"loading":cache?(isOld||warning?"stale":""):"error");$("status-text").textContent=label;$("updated").textContent=cache?syncTime(cache.asOf):"";
 $("refresh").classList.toggle("loading",busy);$("refresh").disabled=busy;$("resync").disabled=busy;
 let note="";
 if(busy&&!cache&&progress)note=progress.retry?tr("retry"):tr("downloading")+" · "+num(progress.scanned||0)+" "+tr("transactions");
 else if(error&&!cache)note=tr("noCache");
 // Sync/audit state stays in the compact status row. Never insert a second panel when cached data exists.
 s.title=cache?[warning?tr(warning):"",error?tr("cachedError"):isOld?tr("oldCache"):""].filter(Boolean).join(" · "):"";
 if(storageError)note+=(note?" ":"")+tr("persist");
 if(exportError)note+=(note?" ":"")+tr("noExport");
 $("notice").hidden=!note;$("notice").className="notice "+(error&&!cache?"error":"");$("notice").textContent=note;
}
const kpi=(label,value,hint="",accent=false,unit="")=>'<article class="kpi'+(accent?' primary':'')+'"><div class="kpi-label">'+esc(label)+'</div><div class="kpi-value">'+esc(value)+'</div><div class="kpi-hint">'+(unit?'<small class="kpi-unit">'+esc(unit)+'</small>':'')+(unit&&hint?' · ':'')+esc(hint)+'</div></article>';
const placeholder=(message=tr(cache?"noData":"noHistory"))=>'<div class="placeholder">'+esc(message)+'</div>';
function setDates(){
 if(!cache)return;
 const end=dayKey(dayIndex(cache.asOf)),start=dayKey(dayIndex(cache.rows[0]?.t*1000||cache.asOf));
 for(const id of ["from","to"]){const el=$(id);el.min=start;el.max=end;if(!el.value)el.value=id==="from"?start:end;}
}
function dateLabel(){if(!range||!cache)return "";const a=range.from,b=range.to-1;const label=selected==="all"?tr("all"):selected==="6h"?tr("rolling6"):selected==="24h"?tr("rolling"):selected==="7d"?tr("calendar7"):selected==="30d"?tr("calendar30"):tr("dateRange");return label+" · "+dayKey(dayIndex(a))+" — "+dayKey(dayIndex(b));}
function rangeNote(){if(!cache)return "";if(!range)return tr("badRange");const a=range.from,b=range.to-1;const sameYear=new Date(a).getUTCFullYear()===new Date(b).getUTCFullYear();const dates=(selected==="6h"||selected==="24h")?utcDate(a)+" "+new Date(a).toISOString().slice(11,16)+" — "+utcDate(b,true)+" "+new Date(b).toISOString().slice(11,16):dayKey(dayIndex(a))===dayKey(dayIndex(b))?utcDate(b,true):utcDate(a,!sameYear)+" — "+utcDate(b,true);return dates+" · UTC";}
function render(){
 language();setDates();
 range=cache?resolveRange(selected,cache.asOf,cache.rows[0]?.t*1000||cache.asOf,{from:$("from").value,to:$("to").value}):null;
 m=cache&&range?metrics(cache.rows,range,cache.asOf):null;
 series=m?adaptiveSeries(cache.rows,range,cache.asOf):{kind:"day",bins:[]};
 for(const id of ["growth-interval","activity-interval","fee-interval"])$(id).textContent=m?intervalName(series.kind)+" · UTC":"";
 $("range-note").textContent=rangeNote();
 $("custom").hidden=selected!=="custom";
 document.querySelectorAll("[data-range]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.range===selected));
 $("csv").disabled=$("png").disabled=!m;
 $("overview").innerHTML=[
 kpi(tr("wallets"),m?num(m.wallets):"—","",true),
 kpi(tr("paying"),m?num(m.paying):"—",m?pct(m.paying,m.wallets)+" "+tr("share"):""),
 kpi(tr("revenue"),m?money(m.fee):"—","",false,"GRAM"),
 kpi(tr("payments"),m?num(m.count):"—",m&&m.count?tr("avg")+": "+money(m.fee/BigInt(m.count))+" GRAM":"")
 ].join("");
 $("active").innerHTML='<div class="activity-title"><strong>'+esc(tr("active"))+'</strong><small>'+esc(tr("calendarWindows")+(m?" · "+utcDate(Date.parse(m.anchor+"T00:00:00Z"),true):""))+'</small></div>'+[["today","dau"],["week","wau"],["month","mau"]].map(([k,v])=>'<div class="active-stat"><strong>'+esc(m?num(m.activity[v]):"—")+'</strong><small>'+esc(tr(k))+'</small></div>').join("");
 $("finite").hidden=selected==="all"||!m;$("finite").innerHTML=m?kpi(tr("new"),num(m.newWallets),tr("firstSeen"))+kpi(tr("returning"),num(m.returning),tr("seenBefore")):"";
 renderCharts();renderDetails();renderTransactions();updateStatus();updateCardExport();
 if(m||!busy)document.getElementById("startup-screen")?.dispatchEvent(new Event("pepegun:ready"));
}
const {renderCharts,resetSelection}=createCharts({getSeries:()=>series,placeholder,hourly,axisLabel,intervalLabel,statusLabel,openTransactions});
function table(headers,rows){return '<div class="table-wrap" tabindex="0"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>'}
function venueLabel(s){return s==="Unlabelled"?(lang==="ru"?"Без метки":"Unlabelled"):s}
function renderDetails(){
 $("insights").hidden=!m;
 if(!m){for(const id of ["venues","advanced","retention","history","comparison"])$(id).innerHTML=placeholder();$("more").hidden=true}
 else{
 $("venues").innerHTML=m.venues.length?'<div class="venue-list">'+m.venues.map(v=>'<div class="venue-row"><div class="venue-name">'+esc(venueLabel(v.label))+'</div><div class="venue-value" title="'+esc(exact(v.fee))+' GRAM">'+esc(money(v.fee))+' GRAM</div><div class="venue-bar"><b style="width:'+(m.fee>0n?Number(v.fee*10000n/m.fee)/100:0)+'%"></b></div><div class="venue-meta">'+esc((lang==="ru"?"Кошельки: ":"Wallets: ")+num(v.wallets)+" · "+(lang==="ru"?"Платежи: ":"Payments: ")+num(v.count))+'</div></div>').join("")+'</div>':placeholder();
 const x=extraMetrics(cache.rows,range,cache.asOf);
 const detail=[[tr("median"),x.median2===null?"—":money((x.median2+1n)/2n)+" GRAM"],[tr("perPayer"),x.perPayer===null?"—":money(x.perPayer)+" GRAM"],[tr("top5"),pct(Number(x.top5),Number(x.total))],[tr("top10"),pct(Number(x.top10),Number(x.total))],...(selected==="all"?[]:[[tr("newPayers"),num(x.newPayers)],[tr("repeatPayers"),num(x.repeatPayers)]]),[tr("largest"),m.count?money(m.largest)+" GRAM":"—"],[tr("other"),num(m.other)]];
 $("advanced").innerHTML='<div class="advanced-grid">'+detail.map(([k,v])=>'<div><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join("")+'</div>';
 const prev=previousRange(range,cache.rows[0]?.t*1000||cache.asOf),p=prev?metrics(cache.rows,prev,cache.asOf):null;
 $("comparison-section").hidden=selected==="all";
 const cf=v=>v===null?"—":new Intl.NumberFormat(locale(),{style:"percent",maximumFractionDigits:1,signDisplay:"always"}).format(v);
 const cp=(label,a,b,format)=>[esc(label),esc(format(a)),esc(format(b)),esc(cf(change(a,b)))];
 $("comparison").innerHTML=p?'<p class="sub">'+esc(time(prev.from)+" — "+time(prev.to-1))+'</p>'+table([tr("metric"),tr("current"),tr("previous"),tr("delta")],[cp(tr("wallets"),m.wallets,p.wallets,num),cp(tr("paying"),m.paying,p.paying,num),cp(tr("revenue")+" (GRAM)",m.fee,p.fee,money),cp(tr("payments"),m.count,p.count,num)]):('<p class="empty-note">'+esc(tr("noComparison"))+'</p>');
 const rates=returnRates(cache.rows,range,cache.asOf);$("retention-section").hidden=!rates.some(r=>r.eligible>0);$("retention").innerHTML='<div class="return-grid">'+rates.map(r=>'<div><span>'+esc(tr("returnedWithin")+" "+r.days+(lang==="ru"?" дн.":" days"))+'</span><strong>'+esc(pct(r.returned,r.eligible))+'</strong><small>'+esc(r.eligible?num(r.returned)+" / "+num(r.eligible):"—")+'</small></div>').join("")+'</div>';
 const rows=[...series.bins].reverse();$("history").innerHTML=rows.length?table([tr("interval"),tr("activeShort"),tr("newShort"),tr("returningShort"),tr("payingShort"),tr("newPayShort"),tr("count"),tr("fee")+" (GRAM)"],rows.slice(0,historyLimit).map(d=>[esc(intervalLabel(d))+(d.status==="complete"?"":'<div class="date-status">'+esc(statusLabel(d.status))+'</div>'),...[d.active,d.new,d.returning,d.paying,d.newPay,d.count].map(x=>esc(num(x))),esc(money(d.fee))])):placeholder();
 $("more").hidden=rows.length<=14;$("more").textContent=tr(historyLimit>=rows.length?"less":"more");
 }
 renderExtras();const items=[...tr("methodItems"),tr("shortRules")];$("method").innerHTML='<ul class="method-list">'+items.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><div class="method-facts">'+esc(tr("collector"))+':<div class="collector-row"><span class="collector-address" title="'+esc(ADDRESS)+'">'+esc(ADDRESS.slice(0,12)+"…"+ADDRESS.slice(-12))+'</span><button type="button" id="copy-address" class="collector-copy" aria-label="'+esc(tr("copyAddress"))+'" title="'+esc(tr("copyAddress"))+'"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button></div><span id="copy-status" class="copy-status" role="status" aria-live="polite"></span><input id="copy-fallback" class="copy-fallback" type="text" readonly value="'+esc(ADDRESS)+'" aria-label="'+esc(tr("copyAddress"))+'" hidden>'+(cache?esc(tr("provider")+": "+(cache.source==="toncenter"?"Toncenter API v3":"TonAPI v2"))+'<br>'+esc(tr("scanned")+": "+num(cache.scanned))+'<br>'+esc(tr("coverage")+": "+tr("verified")):'')+'</div>';
}

async function copyCollectorAddress(button){
 const status=$("copy-status"),fallback=$("copy-fallback");if(!status||!fallback)return;
 let copied=false;
 try{await navigator.clipboard.writeText(ADDRESS);copied=true}catch{
  try{fallback.hidden=false;fallback.focus();fallback.select();fallback.setSelectionRange(0,ADDRESS.length);copied=document.execCommand("copy")}catch{}
 }
 if(!button.isConnected)return;
 if(copied){
  fallback.hidden=true;status.classList.remove("copy-error");status.textContent=tr("addressCopied");
  button.classList.add("copied");button.title=tr("addressCopied");button.setAttribute("aria-label",tr("addressCopied"));
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>';
  setTimeout(()=>{if(!button.isConnected)return;button.classList.remove("copied");button.title=tr("copyAddress");button.setAttribute("aria-label",tr("copyAddress"));button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';status.textContent=""},1800);
 }else{fallback.hidden=false;status.classList.add("copy-error");status.textContent=tr("copyAddressFailed");fallback.focus();fallback.select()}
}
$("method").addEventListener("click",event=>{const button=event.target.closest("#copy-address");if(button&&!button.classList.contains("copied"))copyCollectorAddress(button)});

function renderExtras(){
 const check=cache?.audit,trust=auditTrust(cache);
 const state=auditing&&trust!=="mismatch"?"auditBusy":({match:"auditMatch",prior:"auditMatch",mismatch:"auditMismatch",unavailable:"auditUnavailable",unchecked:"auditIdle"}[trust]);
 $("audit-result").textContent=tr(state)+(check&&!auditing?" · "+time(check.asOf)+(cache&&check.tip!==cache.tip?" · "+tr("auditPrior"):""):"")+(!auditing&&auditOutcome&&auditOutcome!==state?" · "+tr(auditOutcome):"");
 $("audit-result").className="sub "+(state==="auditMismatch"?"audit-warn":"");
 const auditButton=$("audit-check");auditButton.disabled=!cache||Boolean(auditing&&auditController?.signal.aborted);auditButton.classList.toggle("audit-running",auditing);auditButton.setAttribute("aria-busy",String(auditing));auditButton.textContent=tr(auditing?"auditCancel":"auditButton");
 const p=auditProgress;
 $("audit-progress").hidden=!auditing;
 $("audit-progress").textContent=auditing&&p?((p.source==="tonapi"?"TonAPI v2":"Toncenter API v3")+" · "+tr("auditPages")+": "+num(p.pages)+" · "+tr("auditScanned")+": "+num(p.scanned)+(p.retry?" · "+tr("auditRetry"):"")):"";
 $("audit-meta").textContent=cache?tr("ambiguous")+": "+num(cache.ambiguous)+" · "+tr("chainTip")+": "+time(cache.tipTime*1000):"";
}
async function auditSources(){
 if(auditing){auditController?.abort();renderExtras();return}
 if(!cache)return;
 const snapshot=cache,controller=new AbortController();auditController=controller;auditing=true;auditOutcome=null;auditProgress={source:snapshot.source==="toncenter"?"tonapi":"toncenter",pages:0,scanned:0,retry:false};renderExtras();
 let result;
 try{result=await crossCheck(snapshot,p=>{auditProgress={...auditProgress,...p,retry:!!p.retry};renderExtras()},{signal:controller.signal});if(result.status==="unavailable")auditOutcome="auditUnavailable"}
 catch(e){
  if(controller.signal.aborted)auditOutcome="auditCancelled";
  else{auditOutcome=e.name==="TimeoutError"?"auditTimeout":"auditUnavailable";result=auditResult(snapshot,"unavailable")}
 }finally{
  if(cache&&result)cache={...cache,audit:mergeAudit(cache,result)};
  auditing=false;auditController=null;auditProgress=null;renderExtras();updateStatus();
  if(cache&&result)await saveCache(cache);
 }
}
function renderTransactions(){
 const r=range,valid=!!m&&!!r;
 $("tx-filters").querySelectorAll("button").forEach(b=>{b.disabled=!valid;b.setAttribute("aria-pressed",String(b.dataset.txType===txType))});
 if(!valid){$("tx-list").innerHTML=placeholder();$("tx-more").hidden=true;$("tx-count").textContent="";return}
 const rows=rowsInRange(cache.rows,r,txType),shown=rows.slice(0,txLimit);
 $("tx-count").textContent=tr("txShown")+" "+num(shown.length)+" "+tr("of")+" "+num(rows.length);
 $("tx-list").innerHTML=shown.length?'<div class="tx-list">'+shown.map(r=>'<article class="tx-row"><div><strong>'+esc(r.k==="fee"?tr("txTypeFee"):tr("txTypeOther"))+'</strong><small>'+esc(venueLabel(r.d))+'</small><small>'+esc(txTime(r.t*1000))+'</small></div><div class="tx-right"><strong title="'+esc(exact(r.v))+' GRAM">'+esc(money(r.v))+' GRAM</strong><a href="https://tonviewer.com/transaction/'+esc(r.h)+'" target="_blank" rel="noopener noreferrer">'+esc(tr("txLink"))+' ↗</a></div></article>').join("")+'</div>':'<p class="empty-note">'+esc(tr("txEmpty"))+'</p>';
 $("tx-more").hidden=shown.length>=rows.length;$("tx-more").textContent=tr("more");
}
function openTransactions(type){txType=type;txLimit=20;const d=$("transaction-section");d.open=true;renderTransactions();d.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function exportCsv(){
 if(!m||!cache)return;
 exportError=false;updateStatus();
 try{download(new Blob(["\ufeff"+intervalCsv(series,cache.asOf,stale(),auditTrust(cache))],{type:"text/csv;charset=utf-8"}),"pepegun-"+selected+"-"+m.anchor+".csv")}
 catch{exportError=true;updateStatus()}
}
async function exportPng(){
 if(!m||!cache)return;
 const snapshot=m,exportSeries=series,asOf=cache.asOf,old=stale(),trust=trustLabel(),label=exportDateLabel(),currentLang=lang,exportPreset=selected;
 const blob=await renderDashboardPng({snapshot,exportSeries,asOf,old,trust,label,currentLang});
 download(blob,"pepegun-"+exportPreset+"-"+snapshot.anchor+".png");
}
async function refresh(force=false){
 if(busy)return;
 busy=true;error=false;progress=null;exportError=false;updateStatus();
 try{
  // Recover server-verified history on every refresh, not only on page load.
  const seed=await loadSeed();
  if(seed){cache=selectSnapshot(cache,seed);render()}
  const next=await sync(cache,p=>{progress=p;updateStatus()},force);
  cache={...next,audit:mergeAudit(next,cache?.audit)};storageError=!(await saveCache(cache));
 }
 catch(e){error=true;if(cache&&e.audit){cache={...cache,audit:mergeAudit(cache,e.audit)};storageError=!(await saveCache(cache))}console.warn("Pepegun sync:",e)}
 finally{busy=false;render()}
}
$("language").addEventListener("click",()=>{toggleLanguage();render()});
document.querySelectorAll("[data-range]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.range;historyLimit=14;txLimit=20;resetSelection();render()}));
for(const id of ["from","to"])$(id).addEventListener("change",()=>{resetSelection();historyLimit=14;txLimit=20;render()});
$("more").addEventListener("click",()=>{historyLimit=historyLimit>=series.bins.length?14:historyLimit+30;renderDetails()});
$("tx-filters").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{txType=b.dataset.txType;txLimit=20;renderTransactions()}));
$("tx-more").addEventListener("click",()=>{txLimit+=30;renderTransactions()});
$("audit-check").addEventListener("click",auditSources);$("refresh").addEventListener("click",()=>refresh());$("resync").addEventListener("click",()=>refresh(true));$("csv").addEventListener("click",exportCsv);$("png").addEventListener("click",()=>{exportError=false;updateStatus();exportPng().catch(()=>{exportError=true;updateStatus()})});
window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderCharts,100)});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!busy&&(!cache||Date.now()-cache.asOf>=REFRESH))refresh()});
setInterval(()=>{if(!busy&&document.visibilityState==="visible")refresh()},REFRESH);setInterval(updateStatus,60000);
const updateCardExport=setupCardExport(()=>{
 const trust=auditTrust(cache),warning=trust==="match"||trust==="prior"?"":trustLabel(trust);
 const anchor=m?.anchor||"";
 return {valid:!!m&&!!cache,lang,period:rangeNote(),anchor,activePeriod:anchor?(lang==="ru"?"На ":"As of ")+utcDate(Date.parse(anchor+"T00:00:00Z"),true):"",calendarCaption:lang==="ru"?"Календарные дни":"Calendar days",stale:stale(),warning:warning?tr(warning):""};
},download);
render();loadCache().then(c=>{if(c){cache=c;render()}busy=false;refresh()}).catch(()=>{busy=false;refresh()});
