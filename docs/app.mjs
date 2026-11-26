import {ADDRESS,DAY,REFRESH,STALE,dayIndex,dayKey,resolveRange,metrics,amount,exact,csv,sync,loadCache,saveCache} from "./analytics.mjs";

const words={
en:{
subtitle:"Independent on-chain analytics",all:"All time",d30:"30d",d7:"7d",h24:"24h",custom:"Custom",from:"From (UTC)",to:"To (UTC)",
growth:"Audience growth",growthHint:"Cumulative distinct addresses since inception",daily:"Daily active wallets",dailyHint:"Distinct wallets per UTC day",feesChart:"Daily fee revenue",feesHint:"Gross incoming labelled fees · GRAM",weekly:"Weekly active wallets",weeklyHint:"UTC weeks, starting Monday",
venues:"Activity by venue label",venueHint:"Labels in on-chain transfer comments, not verified trade execution.",advanced:"Detailed statistics",retention:"Weekly retention",retentionHint:"Share of each first-seen cohort active again in later weeks. Current week may be incomplete.",history:"Daily history",historyHint:"All-time cumulative totals; other columns use selected dates. Swipe the table on small screens.",method:"Methodology & source",resync:"Reload full history",disclaimer:"Independent community dashboard, not operated or endorsed by Pepegun. Wallet addresses are not individual users.",source:"View on Tonviewer",
loading:"Loading history",refreshing:"Checking for new data",synced:"Synced",stale:"Cached data",unavailable:"Data unavailable",lastSync:"Last sync",partialDay:"Current UTC day is incomplete.",partial:"Partial period",incomplete:"Incomplete",complete:"Complete",refresh:"Refresh data",language:"Language",range:"Time range",overview:"Overview",
wallets:"Unique wallets",paying:"Paying wallets",revenue:"Fee revenue",payments:"Fee payments",addresses:"Distinct sender addresses",share:"of unique wallets",gross:"Gross incoming fees",avg:"Average fee",active:"Active wallets",windowEnd:"UTC windows ending",today:"1 day",week:"7 days",month:"30 days",new:"New wallets",returning:"Returning wallets",firstSeen:"First seen in selected period",seenBefore:"Seen before selected period",newShort:"New",returningShort:"Returning",payingShort:"Paying",allShort:"All wallets",fee:"Fees",day:"Date (UTC)",activeShort:"Active",count:"Payments",other:"Other transfers",cum:"Cumulative wallets",cumPay:"Cumulative paying",exactFee:"Exact fee total",largest:"Largest fee",otherValue:"Value of other transfers",prevDay:"Active previous UTC day",noData:"No qualifying data in this period",noHistory:"Waiting for verified blockchain history",noCache:"Could not load verified history. Use refresh to retry.",cachedError:"Refresh failed. Showing the last successful snapshot.",oldCache:"This snapshot is older than 20 minutes. Refresh to update.",retry:"API busy — retrying",downloading:"Fetching transactions",transactions:"transactions",badRange:"Choose valid dates within the available history.",persist:"Browser storage is unavailable. Data is still available for this visit.",noExport:"Could not create the file in this browser.",more:"Show all days",less:"Show latest 14 days",cohort:"First seen",size:"Wallets",asOf:"Data as of",notLive:"As of last successful sync",rolling:"Rolling 24 hours",calendar7:"7 UTC calendar days",calendar30:"30 UTC calendar days",dateRange:"Selected UTC dates",noFee:"No fee payments",weekOf:"Week of",scanned:"Transactions checked",provider:"Data provider",coverage:"History coverage",verified:"Continuous account history",collector:"Fee collector",exportTitle:"Pepegun Analytics",exportNote:"Wallets are addresses, not people. Independent on-chain dashboard.",
methodItems:[
"Data comes from the single public fee collector on TON via Toncenter API v3 or TonAPI v2. Every full download must form an unbroken transaction chain back to the account's first transaction.",
"Counts include successful incoming positive native-currency transfers whose decoded text contains Pepegun; bounced transfers and transfers from the collector itself are excluded. Hashes and complete normalized sender addresses are deduplicated. The comment alone does not prove a trade occurred.",
"Only comments containing Pepegun fee count as fee payments and gross fee revenue. Other Pepegun transfers, including non-micro amounts, count toward wallet activity but not revenue. Fee payments are not a verified trade count, and gross fees are not profit.",
"New wallets first appear in the selected interval. Returning wallets were first seen before it and are active in it. Cumulative totals count distinct addresses since inception. DAU/WAU/MAU are distinct wallets in the 1, 7 and 30 UTC days ending at the selected range end; these windows may extend before the selected range.",
"All calendar dates are UTC. The 7- and 30-day presets include the current snapshot day and the preceding 6 or 29 days; 24h is a rolling interval. Incomplete days and weeks are marked. Cached data is calculated only through its last successful sync.",
"Refresh runs on page open, manually, every 15 minutes while the page is open, and when returning to an old tab. The browser retains the last verified history; there is no background server or paid API. Availability depends on public blockchain indexers."]}
,ru:{
subtitle:"Независимая ончейн-аналитика",all:"Всё время",d30:"30 дн.",d7:"7 дн.",h24:"24 ч.",custom:"Период",from:"От (UTC)",to:"До (UTC)",
growth:"Рост аудитории",growthHint:"Уникальные адреса с начала наблюдения",daily:"Активность по дням",dailyHint:"Уникальные кошельки за день UTC",feesChart:"Комиссии по дням",feesHint:"Входящие комиссии по комментариям · GRAM",weekly:"Активность по неделям",weeklyHint:"Недели UTC, с понедельника",
venues:"Активность по площадкам",venueHint:"Метки из комментариев транзакций, а не подтверждённое исполнение сделок.",advanced:"Подробная статистика",retention:"Удержание по неделям",retentionHint:"Доля кошельков каждой когорты, активных в последующие недели. Текущая неделя может быть неполной.",history:"История по дням",historyHint:"Накопительные итоги — за всё время, остальные колонки — за выбранный период. На телефоне таблицу можно прокручивать.",method:"Методика и источник",resync:"Загрузить всю историю",disclaimer:"Независимый дашборд сообщества, не официальный продукт Pepegun. Адреса кошельков не равны отдельным пользователям.",source:"Открыть в Tonviewer",
loading:"Загрузка истории",refreshing:"Проверка новых данных",synced:"Обновлено",stale:"Сохранённые данные",unavailable:"Данные недоступны",lastSync:"Синхронизация",partialDay:"Текущий день UTC ещё не завершён.",partial:"Неполный период",incomplete:"Не завершён",complete:"Полный",refresh:"Обновить данные",language:"Язык",range:"Период",overview:"Основные показатели",
wallets:"Уникальные кошельки",paying:"Платящие кошельки",revenue:"Доход с комиссий",payments:"Платежи комиссий",addresses:"Уникальные адреса",share:"от всех кошельков",gross:"Входящие комиссии",avg:"Средняя комиссия",active:"Активные кошельки",windowEnd:"Периоды UTC до",today:"1 день",week:"7 дней",month:"30 дней",new:"Новые кошельки",returning:"Вернувшиеся",firstSeen:"Впервые в выбранном периоде",seenBefore:"Активны и замечены ранее",newShort:"Новые",returningShort:"Повторные",payingShort:"Платящие",allShort:"Все кошельки",fee:"Комиссии",day:"Дата (UTC)",activeShort:"Активные",count:"Платежи",other:"Другие переводы",cum:"Всего кошельков",cumPay:"Всего платящих",exactFee:"Точная сумма комиссий",largest:"Крупнейшая комиссия",otherValue:"Сумма других переводов",prevDay:"Активные за предыдущий день",noData:"Нет подходящих данных за период",noHistory:"Ожидание проверенной истории блокчейна",noCache:"Не удалось загрузить проверенную историю. Нажмите обновление.",cachedError:"Обновление не удалось. Показан последний успешный снимок.",oldCache:"Данные старше 20 минут. Обновите страницу.",retry:"Лимит API — повтор запроса",downloading:"Загрузка транзакций",transactions:"транзакций",badRange:"Выберите корректные даты в пределах истории.",persist:"Хранилище браузера недоступно. Данные доступны в текущем сеансе.",noExport:"Не удалось создать файл в этом браузере.",more:"Показать все дни",less:"Последние 14 дней",cohort:"Первое появление",size:"Кошельки",asOf:"Данные на",notLive:"На момент успешной синхронизации",rolling:"Последние 24 часа",calendar7:"7 календарных дней UTC",calendar30:"30 календарных дней UTC",dateRange:"Выбранные даты UTC",noFee:"Нет платежей комиссий",weekOf:"Неделя с",scanned:"Проверено транзакций",provider:"Источник данных",coverage:"Полнота истории",verified:"Непрерывная история адреса",collector:"Комиссионный кошелёк",exportTitle:"Pepegun Analytics",exportNote:"Кошельки — адреса, а не люди. Независимая ончейн-аналитика.",
methodItems:[
"Данные одного публичного комиссионного кошелька в TON получаются через Toncenter API v3 или TonAPI v2. Полная выгрузка должна образовывать непрерывную цепочку до первой транзакции адреса.",
"Учитываются успешные входящие положительные переводы нативной валюты с текстовым комментарием Pepegun. Возвращённые переводы и переводы самому себе исключаются. Повторы хешей и полных нормализованных адресов не учитываются. Комментарий сам по себе не подтверждает сделку.",
"Только комментарии Pepegun fee относятся к платежам комиссий и валовому комиссионному доходу. Другие переводы Pepegun, в том числе крупные, учитываются в активности, но не в доходе. Платежи не равны числу сделок, а валовые комиссии — чистой прибыли.",
"Новые кошельки впервые появились в выбранном периоде. Вернувшиеся были замечены ранее и активны в нём. Накопительные итоги — уникальные адреса с начала наблюдения. Активность за 1, 7 и 30 дней рассчитана по календарным дням UTC до конца выбранного периода; эти окна могут начинаться раньше периода.",
"Все календарные даты — UTC. Фильтры 7 и 30 дней включают день последнего снимка и 6 или 29 предыдущих дней; 24 часа — скользящий интервал. Незавершённые дни и недели отмечены. Сохранённые данные считаются только до последней успешной синхронизации.",
"Обновление при открытии, вручную, каждые 15 минут на открытой странице и при возврате в давно открытую вкладку. Браузер хранит последнюю проверенную историю; фонового сервера и платного API нет. Доступность зависит от публичных индексаторов блокчейна."]}
};
const $=id=>document.getElementById(id);
let lang="en";try{lang=localStorage.getItem("pepegun-lang")||(/^ru\b/i.test(navigator.language)?"ru":"en")}catch{}if(!words[lang])lang="en";
const tr=k=>words[lang][k]||k,locale=()=>lang==="ru"?"ru-RU":"en-US",num=x=>new Intl.NumberFormat(locale()).format(x),fmt=(x,d=2)=>amount(x,d,locale()),pct=(a,b)=>b?new Intl.NumberFormat(locale(),{style:"percent",maximumFractionDigits:1}).format(a/b):"—";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const time=t=>new Date(t).toISOString().slice(0,16).replace("T"," ")+" UTC";
const shortDate=s=>{const d=s.split("-");return lang==="ru"?d[2]+"."+d[1]:d[1]+"/"+d[2]};
const statusLabel=s=>s==="partial"?tr("partial"):s==="incomplete"?tr("incomplete"):tr("complete");
let cache=null,selected="all",m=null,range=null,busy=true,error=false,storageError=false,exportError=false,progress=null,showAll=false,resizeTimer;
let pointsState={};
function stale(){return !!cache&&(error||Date.now()-cache.asOf>STALE)}
function language(){document.documentElement.lang=lang;document.querySelectorAll("[data-i]").forEach(el=>el.textContent=tr(el.dataset.i));$("en").setAttribute("aria-pressed",lang==="en");$("ru").setAttribute("aria-pressed",lang==="ru");$("refresh").setAttribute("aria-label",tr("refresh"));$("refresh").title=tr("refresh");document.querySelector(".language").setAttribute("aria-label",tr("language"));$("filters").setAttribute("aria-label",tr("range"));$("overview").setAttribute("aria-label",tr("overview"));$("active").setAttribute("aria-label",tr("active"));}
function updateStatus(){
 const isOld=stale(),s=$("status"),label=busy?(cache?tr("refreshing"):tr("loading")):cache?(isOld?tr("stale"):tr("synced")):tr("unavailable");
 s.className="status "+(busy?"loading":cache?(isOld?"stale":""):"error");$("status-text").textContent=label;$("updated").textContent=cache?tr("lastSync")+": "+time(cache.asOf):"";
 $("refresh").classList.toggle("loading",busy);$("refresh").disabled=busy;$("resync").disabled=busy;
 let note="";
 if(busy&&!cache&&progress)note=progress.retry?tr("retry"):tr("downloading")+" · "+num(progress.scanned||0)+" "+tr("transactions");
 else if(error)note=tr(cache?"cachedError":"noCache");
 else if(isOld)note=tr("oldCache");
 if(storageError)note+=(note?" ":"")+tr("persist");
 if(exportError)note+=(note?" ":"")+tr("noExport");
 $("notice").hidden=!note;$("notice").className="notice "+(error&&!cache?"error":"");$("notice").textContent=note;
}
const kpi=(label,value,hint="",accent=false,unit="")=>'<article class="kpi'+(accent?' primary':'')+'"><div class="kpi-label">'+esc(label)+'</div><div class="kpi-value">'+esc(value)+(unit?'<small>'+esc(unit)+'</small>':'')+'</div><div class="kpi-hint">'+esc(hint)+'</div></article>';
const placeholder=(message=tr(cache?"noData":"noHistory"))=>'<div class="placeholder">'+esc(message)+'</div>';
function setDates(){
 if(!cache)return;
 const end=dayKey(dayIndex(cache.asOf)),start=dayKey(dayIndex(cache.rows[0]?.t*1000||cache.asOf));
 for(const id of ["from","to"]){const el=$(id);el.min=start;el.max=end;if(!el.value)el.value=id==="from"?start:end;}
}
function dateLabel(){if(!range||!cache)return "";const a=range.from,b=range.to-1;const label=selected==="all"?tr("all"):selected==="24h"?tr("rolling"):selected==="7d"?tr("calendar7"):selected==="30d"?tr("calendar30"):tr("dateRange");return label+" · "+dayKey(dayIndex(a))+" — "+dayKey(dayIndex(b));}
function rangeNote(){if(!cache)return "";if(!range)return tr("badRange");return dateLabel()+" · "+tr("asOf")+" "+time(cache.asOf)+(m?.anchorIncomplete?" · "+tr("partialDay"):"");}
function render(){
 language();setDates();
 range=cache?resolveRange(selected,cache.asOf,cache.rows[0]?.t*1000||cache.asOf,{from:$("from").value,to:$("to").value}):null;
 m=cache&&range?metrics(cache.rows,range,cache.asOf):null;
 $("range-note").textContent=rangeNote();
 $("custom").hidden=selected!=="custom";
 document.querySelectorAll("[data-range]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.range===selected));
 $("csv").disabled=$("png").disabled=!m;
 $("overview").innerHTML=[
 kpi(tr("wallets"),m?num(m.wallets):"—",tr("addresses"),true),
 kpi(tr("paying"),m?num(m.paying):"—",m?pct(m.paying,m.wallets)+" "+tr("share"):""),
 kpi(tr("revenue"),m?fmt(m.fee):"—",tr("gross"),false,"GRAM"),
 kpi(tr("payments"),m?num(m.count):"—",m&&m.count?tr("avg")+": "+fmt(m.fee/BigInt(m.count),4)+" GRAM":"")
 ].join("");
 $("active").innerHTML='<div class="activity-title"><strong>'+esc(tr("active"))+'</strong><small>'+esc(tr("windowEnd")+(m?" "+m.anchor:""))+'</small></div>'+[["today","dau"],["week","wau"],["month","mau"]].map(([k,v])=>'<div class="active-stat"><strong>'+esc(m?num(m.activity[v]):"—")+'</strong><small>'+esc(tr(k))+'</small></div>').join("");
 $("finite").hidden=selected==="all"||!m;$("finite").innerHTML=m?kpi(tr("new"),num(m.newWallets),tr("firstSeen"))+kpi(tr("returning"),num(m.returning),tr("seenBefore")):"";
 renderCharts();renderDetails();updateStatus();
}
const colors={all:"#b5ef58",paid:"#72cbb5",new:"#b5ef58",returning:"#43584b",fee:"#b5ef58",grid:"#2c362d",text:"#a1ada3"};
const fnum=x=>new Intl.NumberFormat(locale(),{maximumFractionDigits:2,notation:x>=100000?"compact":"standard"}).format(x);
function chartSpec(){
 return [
 ["growth-chart",m?.daily,[{key:"cum",label:tr("allShort"),color:colors.all},{key:"cumPay",label:tr("payingShort"),color:colors.paid}],"line",false],
 ["daily-chart",m?.daily,[{key:"new",label:tr("newShort"),color:colors.new},{key:"returning",label:tr("returningShort"),color:colors.returning},{key:"paying",label:tr("payingShort"),color:colors.paid,line:true}],"stack",false],
 ["fees-chart",m?.daily,[{key:"fee",label:tr("fee"),color:colors.fee}],"bar",true],
 ["weekly-chart",m?.weekly,[{key:"active",label:tr("allShort"),color:colors.all},{key:"paying",label:tr("payingShort"),color:colors.paid}],"line",false]
 ];
}
function renderCharts(){for(const [id,data,series,kind,decimal] of chartSpec())drawChart(id,data,series,kind,decimal)}
function drawChart(id,data,series,kind,decimal){
 const root=$(id);if(!data?.length){root.innerHTML=placeholder();return}
 const W=Math.max(220,Math.round(root.clientWidth||320)),H=W<480?184:218,L=W<330?32:39,R=12,T=12,B=27,plotW=W-L-R,plotH=H-T-B;
 const val=(r,s)=>s.key==="fee"?Number(r.fee)/1e9:Number(r[s.key]||0);
 let max=0;for(const row of data){const a=kind==="stack"?[series.filter(s=>!s.line).reduce((n,s)=>n+val(row,s),0),...series.filter(s=>s.line).map(s=>val(row,s))]:series.map(s=>val(row,s));max=Math.max(max,...a)}
 const unit=max===0?1:Math.pow(10,Math.floor(Math.log10(max/3||1))),raw=max/3/unit,step=max===0?1:Math.max(decimal?0.000001:1,(raw<=1?1:raw<=2?2:raw<=2.5?2.5:raw<=5?5:10)*unit);
 const ceil=Math.max(step,Math.ceil(max/step)*step),ticks=Math.round(ceil/step);
 const cell=plotW/data.length,x=i=>L+(i+.5)*cell,y=v=>T+plotH-Math.min(1,v/ceil)*plotH;
 let svg='<svg class="chart-plot" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" tabindex="0" role="img" aria-label="'+esc(id.replace("-chart",""))+'">';
 for(let i=0;i<=ticks;i++){const v=i*step,py=y(v);svg+='<path d="M'+L+' '+py+'H'+(W-R)+'" stroke="'+colors.grid+'" stroke-width="1"/><text x="'+(L-5)+'" y="'+(py+4)+'" fill="'+colors.text+'" text-anchor="end" font-size="10">'+esc(fnum(v))+'</text>'}
 const tickCount=W<340?4:W<550?5:7,stepX=Math.max(1,Math.ceil((data.length-1)/(tickCount-1)));
 let idxs=[];for(let i=0;i<data.length;i+=stepX)idxs.push(i);if(idxs.at(-1)!==data.length-1){if(data.length-1-idxs.at(-1)<stepX*.55&&idxs.length>1)idxs.pop();idxs.push(data.length-1)}
 for(const i of idxs){const px=Math.min(W-R-10,Math.max(L+4,x(i)));svg+='<text x="'+px+'" y="'+(H-7)+'" text-anchor="middle" font-size="10" fill="'+colors.text+'">'+esc(shortDate(data[i].date))+'</text>'}
 const isPartial=r=>r.status!=="complete";
 if(kind==="bar"||kind==="stack"){
  data.forEach((r,i)=>{let prev=0;const bw=Math.max(.6,Math.min(cell*.7,24));for(const s of series.filter(z=>!z.line)){const v=val(r,s);if(v>0){const top=y(prev+v),h=y(prev)-top;svg+='<rect x="'+(x(i)-bw/2)+'" y="'+top+'" width="'+bw+'" height="'+h+'" rx="'+Math.min(2,bw/4)+'" fill="'+s.color+'" opacity="'+(isPartial(r)?.48:1)+'"/>'}prev+=v}});
 }
 if(kind==="line"||series.some(s=>s.line)){
  for(const s of series.filter(z=>kind==="line"||z.line)){
   let d=data.map((r,i)=>(i?"L":"M")+x(i)+" "+y(val(r,s))).join(" ");
   if(kind==="line"&&s===series[0]&&data.length>1)svg+='<path d="'+d+' L'+x(data.length-1)+' '+y(0)+' L'+x(0)+' '+y(0)+'Z" fill="'+s.color+'" opacity=".08"/>';
   svg+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
   if(data.length<=10)for(let i=0;i<data.length;i++)svg+='<circle cx="'+x(i)+'" cy="'+y(val(data[i],s))+'" r="2.4" fill="'+s.color+'" opacity="'+(isPartial(data[i])?.55:1)+'"/>';
  }
 }
 svg+='<line class="cursor" x1="0" x2="0" y1="'+T+'" y2="'+(T+plotH)+'" stroke="#adb9ae" stroke-dasharray="3 3" opacity=".5"/></svg>';
 root.innerHTML=svg+'<div class="chart-legend">'+series.map(s=>'<span><i class="swatch" style="background:'+s.color+'"></i>'+esc(s.label)+'</span>').join("")+'</div><div class="chart-readout" aria-live="polite"></div>';
 const graphic=root.querySelector("svg"),cursor=root.querySelector(".cursor"),readout=root.querySelector(".chart-readout");
 function focus(i){i=Math.max(0,Math.min(data.length-1,i));pointsState[id]=i;const r=data[i];cursor.setAttribute("x1",x(i));cursor.setAttribute("x2",x(i));readout.innerHTML='<strong>'+esc((id==="weekly-chart"?tr("weekOf")+" ":"")+r.date)+'</strong>'+(isPartial(r)?" · "+esc(statusLabel(r.status)):"")+" · "+series.map(s=>esc(s.label)+": <strong>"+esc(s.key==="fee"?fmt(r.fee,3)+" GRAM":num(val(r,s)))+"</strong>").join(" · ")}
 focus(Math.min(pointsState[id]??data.length-1,data.length-1));
 function pointer(e){const rect=graphic.getBoundingClientRect();const px=(e.clientX-rect.left)*W/rect.width;focus(Math.floor((px-L)/cell))}
 graphic.addEventListener("pointerdown",pointer);graphic.addEventListener("pointermove",e=>{if(e.pointerType==="mouse")pointer(e)});graphic.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();focus((pointsState[id]??0)+(e.key==="ArrowRight"?1:-1))}});
}
function table(headers,rows){return '<div class="table-wrap" tabindex="0"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>'}
function venueLabel(s){return s==="Unlabelled"?(lang==="ru"?"Без метки":"Unlabelled"):s}
function renderDetails(){
 if(!m){for(const id of ["venues","advanced","retention","history"])$(id).innerHTML=placeholder();$("more").hidden=true}
 else{
 $("venues").innerHTML=m.venues.length?'<div class="venue-list">'+m.venues.map(v=>'<div class="venue-row"><div class="venue-name">'+esc(venueLabel(v.label))+'</div><div class="venue-value">'+esc(fmt(v.fee,3))+' GRAM</div><div class="venue-bar"><b style="width:'+(m.fee>0n?Number(v.fee*10000n/m.fee)/100:0)+'%"></b></div><div class="venue-meta">'+esc(num(v.wallets)+" "+tr("wallets").toLowerCase()+" · "+num(v.count)+" "+tr("payments").toLowerCase())+'</div></div>').join("")+'</div>':placeholder();
 const detail=[[tr("exactFee"),exact(m.fee)+" GRAM"],[tr("largest"),fmt(m.largest,4)+" GRAM"],[tr("other"),num(m.other)],[tr("otherValue"),fmt(m.otherValue,4)+" GRAM"],[tr("prevDay"),num(m.activity.prev)]];
 $("advanced").innerHTML='<div class="advanced-grid">'+detail.map(([k,v])=>'<div><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join("")+'</div>';
 const len=Math.max(0,...m.retention.map(x=>x.active.length));
 $("retention").innerHTML=len?table([tr("cohort"),tr("size"),...Array.from({length:len},(_,i)=>"W"+i)],m.retention.map(c=>[esc(c.date),esc(num(c.size)),...Array.from({length:len},(_,i)=>c.active[i]===undefined?"—":'<span title="'+esc(num(c.active[i])+" / "+num(c.size))+'" style="color:'+(c.active[i]?"#b5ef58":"#a1ada3")+'">'+esc(pct(c.active[i],c.size))+(m.currentWeekPartial&&i===c.active.length-1?"*":"")+"</span>")])):placeholder();
 const rows=[...m.daily].reverse();$("history").innerHTML=rows.length?table([tr("day"),tr("activeShort"),tr("newShort"),tr("returningShort"),tr("payingShort"),tr("count"),tr("fee")+" (GRAM)",tr("other"),tr("cum"),tr("cumPay")],(showAll?rows:rows.slice(0,14)).map(d=>[esc(d.date)+(d.status==="complete"?"":'<div class="date-status">'+esc(statusLabel(d.status))+'</div>'),...([d.active,d.new,d.returning,d.paying,d.count].map(x=>esc(num(x)))),esc(fmt(d.fee,3)),esc(num(d.other)),esc(num(d.cum)),esc(num(d.cumPay))])):placeholder();
 $("more").hidden=rows.length<=14;$("more").textContent=tr(showAll?"less":"more");
 }
 const items=tr("methodItems");$("method").innerHTML='<ul class="method-list">'+items.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><div class="method-facts">'+esc(tr("collector"))+': <a href="https://tonviewer.com/'+ADDRESS+'" target="_blank" rel="noopener noreferrer">'+ADDRESS+'</a>'+(cache?'<br>'+esc(tr("provider")+": "+(cache.source==="toncenter"?"Toncenter API v3":"TonAPI v2"))+'<br>'+esc(tr("scanned")+": "+num(cache.scanned))+'<br>'+esc(tr("coverage")+": "+tr("verified")):'')+'</div>';
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function exportCsv(){
 if(!m||!cache)return;
 try{const raw=csv(m).trimEnd().split("\r\n");raw[0]+=",snapshot_utc,stale";for(let i=1;i<raw.length;i++)raw[i]+=","+new Date(cache.asOf).toISOString()+","+String(stale());download(new Blob(["\ufeff"+raw.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"}),"pepegun-"+selected+"-"+m.anchor+".csv")}
 catch{exportError=true;updateStatus()}
}
async function exportPng(){
 if(!m||!cache)return;
 const snapshot=m,asOf=cache.asOf,old=stale(),label=dateLabel(),currentLang=lang,canvas=document.createElement("canvas");canvas.width=2400;canvas.height=1350;const g=canvas.getContext("2d");if(!g)throw Error("Canvas unavailable");g.scale(2,2);const W=1200,H=675;
 const palette={bg:"#0d100e",card:"#151a16",border:"#2c362d",muted:"#a1ada3",text:"#edf3ed",green:"#b5ef58",paid:"#72cbb5"};
 const font=(n,b=false)=> (b?"700 ":"500 ")+n+"px system-ui, sans-serif";
 function txt(s,x,y,n=16,c=palette.text,b=false,max=Infinity){g.font=font(n,b);while(g.measureText(s).width>max&&n>9)g.font=font(--n,b);g.fillStyle=c;g.fillText(s,x,y)}
 function rect(x,y,w,h,c){g.fillStyle=c;g.strokeStyle=palette.border;g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,12);else g.rect(x,y,w,h);g.fill();g.stroke()}
 g.fillStyle=palette.bg;g.fillRect(0,0,W,H);
 try{const im=new Image();im.src="./pepegun-logo.svg";await im.decode();g.drawImage(im,38,26,56,56)}catch{}
 txt("Pepegun Analytics",105,52,30,palette.text,true,620);txt(words[currentLang].subtitle,105,75,15,palette.muted,false,620);
 txt(label,725,44,15,palette.green,true,435);txt(words[currentLang].asOf+" "+time(asOf)+(old?" · "+words[currentLang].stale:""),725,68,13,palette.muted,false,435);
 const loc=currentLang==="ru"?"ru-RU":"en-US",n=x=>new Intl.NumberFormat(loc).format(x),f=x=>amount(x,2,loc);
 const tiles=[[words[currentLang].wallets,n(snapshot.wallets)],[words[currentLang].paying,n(snapshot.paying)],[words[currentLang].revenue,f(snapshot.fee)+" GRAM"],[words[currentLang].payments,n(snapshot.count)]];
 tiles.forEach(([k,v],i)=>{const x=38+i*284;rect(x,100,272,103,palette.card);txt(k,x+15,130,15,palette.muted,false,242);txt(v,x+15,173,32,i===0?palette.green:palette.text,true,242)});
 function draw(x,y,w,h,title,data,series,bar=false){rect(x,y,w,h,palette.card);txt(title,x+16,y+26,17,palette.text,true,w-32);const L=x+45,R=x+w-18,T=y+55,B=y+h-33,pw=R-L,ph=B-T;let max=0;for(const d of data)for(const [k] of series)max=Math.max(max,k==="fee"?Number(d.fee)/1e9:d[k]||0);max=max||1;const at=(i)=>L+(i+.5)*pw/Math.max(1,data.length),py=v=>B-v/max*ph;
 for(let i=0;i<=3;i++){const v=max*i/3,yy=py(v);g.strokeStyle=palette.border;g.beginPath();g.moveTo(L,yy);g.lineTo(R,yy);g.stroke();txt(String(Math.round(v*10)/10),x+7,yy+4,11,palette.muted,false,35)}
 for(const [k,c] of series){if(bar){data.forEach((d,i)=>{const v=Number(d.fee)/1e9,bw=Math.max(.7,Math.min(15,pw/data.length*.7));g.fillStyle=c;g.globalAlpha=d.status==="complete"?1:.45;g.fillRect(at(i)-bw/2,py(v),bw,B-py(v));g.globalAlpha=1})}else{g.strokeStyle=c;g.lineWidth=2.6;g.beginPath();data.forEach((d,i)=>{const px=at(i),yy=py(d[k]||0);i?g.lineTo(px,yy):g.moveTo(px,yy)});g.stroke()}}
 if(data.length){txt(data[0].date,L,B+19,11,palette.muted);const last=data.at(-1).date;g.font=font(11);txt(last,R-g.measureText(last).width,B+19,11,palette.muted)}
 }
 draw(38,223,554,340,words[currentLang].growth,snapshot.daily,[["cum",palette.green],["cumPay",palette.paid]]);
 draw(608,223,554,340,words[currentLang].feesChart,snapshot.daily,[["fee",palette.green]],true);
 txt(words[currentLang].allShort+"  /  "+words[currentLang].payingShort,54,552,11,palette.muted,false,500);
 txt(words[currentLang].exportNote,38,610,14,palette.muted,false,1124);
 txt(words[currentLang].collector+": "+ADDRESS,38,635,12,palette.muted,false,1124);
 if(snapshot.anchorIncomplete)txt(words[currentLang].partialDay,38,656,12,palette.muted,false,1124);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG unavailable")),"image/png"));download(blob,"pepegun-"+selected+"-"+snapshot.anchor+".png");
}
async function refresh(force=false){
 if(busy&&cache!==null)return;
 busy=true;error=false;progress=null;exportError=false;updateStatus();
 try{const next=await sync(cache,p=>{progress=p;updateStatus()},force);cache=next;storageError=!(await saveCache(next));}
 catch(e){error=true;console.warn("Pepegun sync:",e)}
 finally{busy=false;render()}
}
for(const l of ["en","ru"])$(l).addEventListener("click",()=>{lang=l;try{localStorage.setItem("pepegun-lang",l)}catch{}render()});
document.querySelectorAll("[data-range]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.range;showAll=false;pointsState={};render()}));
for(const id of ["from","to"])$(id).addEventListener("change",()=>{pointsState={};showAll=false;render()});
$("more").addEventListener("click",()=>{showAll=!showAll;renderDetails()});
$("refresh").addEventListener("click",()=>refresh());$("resync").addEventListener("click",()=>refresh(true));$("csv").addEventListener("click",exportCsv);$("png").addEventListener("click",()=>{exportError=false;updateStatus();exportPng().catch(()=>{exportError=true;updateStatus()})});
window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderCharts,100)});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!busy&&(!cache||Date.now()-cache.asOf>=REFRESH))refresh()});
setInterval(()=>{if(!busy&&document.visibilityState==="visible")refresh()},REFRESH);setInterval(updateStatus,60000);
render();loadCache().then(c=>{cache=c;busy=false;render();refresh()}).catch(()=>{busy=false;refresh()});
