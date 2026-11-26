import {setupCardExport} from "./card-export.mjs?v=27";
import {ADDRESS,REFRESH,STALE,dayIndex,dayKey,resolveRange,metrics,exact,compactAmount,sync,loadCache,saveCache,crossCheck,validAudit} from "./analytics.mjs?v=10";
import {extraMetrics,previousRange,change,adaptiveSeries,returnRates,rowsInRange,intervalCsv,loadSeed,selectSnapshot} from "./insights.mjs?v=10";
const words={
  "en": {
    "subtitle": "Independent on-chain analytics",
    "all": "All time",
    "allFilter": "All",
    "d30": "30d",
    "d7": "7d",
    "h24": "24h",
    "custom": "Custom",
    "from": "From",
    "to": "To",
    "growth": "Audience growth",
    "growthHint": "Cumulative distinct addresses since inception",
    "daily": "Wallet activity",
    "dailyHint": "Distinct addresses per interval",
    "feesChart": "Fee revenue",
    "feesHint": "Gross incoming fees · GRAM",
    "venues": "Activity by venue label",
    "venueHint": "Labels in on-chain transfer comments, not verified trade execution.",
    "advanced": "Detailed statistics",
    "retention": "Wallet return rates",
    "retentionHint": "New wallets in the selected period active again on a later UTC day within 7, 14 or 30 days. Only fully observed follow-up windows count.",
    "history": "Interval history",
    "historyHint": "Same intervals as charts.",
    "method": "Methodology & source",
    "resync": "Reload full history",
    "disclaimer": "Independent community dashboard, not operated or endorsed by Pepegun. Wallet addresses are not individual users.",
    "source": "View on Tonviewer",
    "loading": "Loading history",
    "refreshing": "Checking for new data",
    "synced": "Synced",
    "stale": "Cached data",
    "unavailable": "Data unavailable",
    "partial": "Partial period",
    "incomplete": "Incomplete",
    "complete": "Complete",
    "refresh": "Refresh data",
    "language": "Language",
    "range": "Time range",
    "overview": "Overview",
    "wallets": "Unique wallets",
    "paying": "Paying wallets",
    "revenue": "Fee revenue",
    "payments": "Fee payments",
    "share": "of unique wallets",
    "avg": "Average fee",
    "active": "Active wallets",
    "today": "1 day",
    "week": "7 days",
    "month": "30 days",
    "new": "New wallets",
    "returning": "Returning wallets",
    "firstSeen": "First seen in selected period",
    "seenBefore": "Seen before selected period",
    "newShort": "New",
    "returningShort": "Returning",
    "payingShort": "Paying",
    "allShort": "All wallets",
    "fee": "Fees",
    "day": "Date (UTC)",
    "activeShort": "Active",
    "count": "Payments",
    "other": "Other transfers",
    "cum": "Cumulative wallets",
    "cumPay": "Cumulative paying",
    "largest": "Largest fee",
    "noData": "No qualifying data in this period",
    "noHistory": "Waiting for verified blockchain history",
    "noCache": "Could not load verified history. Use refresh to retry.",
    "cachedError": "Refresh failed. Showing the last successful snapshot.",
    "oldCache": "This snapshot is older than 20 minutes. Refresh to update.",
    "retry": "API busy — retrying",
    "downloading": "Fetching transactions",
    "transactions": "transactions",
    "badRange": "Choose valid dates within the available history.",
    "persist": "Browser storage is unavailable. Data is still available for this visit.",
    "noExport": "Could not create the file in this browser.",
    "more": "Show more",
    "less": "Show fewer",
    "asOf": "Data as of",
    "rolling": "Rolling 24 hours",
    "calendar7": "7 UTC calendar days",
    "calendar30": "30 UTC calendar days",
    "dateRange": "Selected UTC dates",
    "scanned": "Transactions checked",
    "provider": "Data provider",
    "coverage": "History coverage",
    "verified": "Continuous account history",
    "collector": "Fee collector",
    "copyAddress": "Copy full address",
    "addressCopied": "Address copied",
    "copyAddressFailed": "Copy manually from the field below",
    "exportNote": "Wallets are addresses, not people. Independent on-chain dashboard.",
    "methodItems": [
      "Data comes from the single public fee collector on TON via Toncenter API v3 or TonAPI v2. Every full download must form an unbroken transaction chain back to the account's first transaction.",
      "Counts include successful incoming positive native-currency transfers with a recognized Pepegun comment prefix; bounced transfers and transfers from the collector itself are excluded. Hashes and complete normalized sender addresses are deduplicated. The fee marker identifies a Pepegun commission; it is not a count of executed trades.",
      "Only comments with the recognized Pepegun fee prefix count as fee payments and gross fee revenue. Other Pepegun transfers, including non-micro amounts, count toward wallet activity but not revenue. Fee payments are not a verified trade count, and gross fees are not profit.",
      "New wallets first appear in the selected interval. Returning wallets were first seen before it and are active in it. Cumulative totals count distinct addresses since inception. DAU/WAU/MAU are distinct wallets in the 1, 7 and 30 UTC days ending at the selected range end; these windows may extend before the selected range.",
      "All calendar dates are UTC. The 7- and 30-day presets include the current snapshot day and the preceding 6 or 29 days; 6h and 24h are rolling intervals. Charts use adaptive UTC intervals; incomplete intervals are marked. Cached data is calculated only through its last successful sync.",
      "Refresh runs on page open, manually, every 15 minutes while the page is open, and when returning to an old tab. The browser retains the last verified history; a public daily snapshot accelerates first load; no paid API is used. Availability depends on public blockchain indexers."
    ],
    "median": "Median fee",
    "perPayer": "Fees per payer",
    "top5": "Top 5 share of fees",
    "top10": "Top 10 share of fees",
    "newPayers": "New paying wallets",
    "repeatPayers": "Returning paying wallets",
    "comparison": "Previous comparable period",
    "compareHint": "Equivalent elapsed UTC time in the previous window.",
    "metric": "Metric",
    "current": "Current",
    "previous": "Previous",
    "delta": "Change",
    "noComparison": "Not enough history for an equivalent previous period.",
    "audit": "Source cross-check",
    "auditButton": "Compare both indexers",
    "auditIdle": "Not independently checked for this snapshot",
    "auditBusy": "Checking alternate indexer…",
    "auditPages": "Pages downloaded",
    "auditScanned": "Transactions scanned",
    "auditRetry": "Retrying request…",
    "auditMatch": "Both sources match for the checked snapshot",
    "auditMismatch": "Sources disagree — review required",
    "auditUnavailable": "Alternate indexer could not verify this snapshot",
    "ambiguous": "Unclassified Pepegun comments (all time)",
    "chainTip": "Account transaction time",
    "shortRules": "Only the exact Pepegun or Pepegun fee prefix (optionally 🔫), followed by a middle-dot label or end of text, is accepted. Other mentions are excluded and counted separately. Source agreement checks the indexed account history.",
    "topHint": "Share of labelled fee revenue from the highest-paying addresses in the selected period.",
    "h6": "6h",
    "rolling6": "Rolling 6 hours",
    "transactionsTitle": "Transactions",
    "transactionsHint": "Incoming Pepegun transfers in the selected period, with links to Tonviewer.",
    "filterAll": "All",
    "filterFee": "Fees",
    "filterOther": "Other",
    "viewTx": "View transactions",
    "viewInterval": "Selected interval",
    "resetInterval": "Whole period",
    "txEmpty": "No matching transfers",
    "txTypeFee": "Fee",
    "txTypeOther": "Other transfer",
    "interval": "Interval",
    "interval15": "15 min",
    "interval1": "1 hour",
    "interval3": "3 hours",
    "interval6": "6 hours",
    "intervalDay": "1 day",
    "intervalWeek": "1 week",
    "intervalMonth": "1 month",
    "returnedWithin": "Within",
    "auditPrior": "Earlier snapshot",
    "calendarWindows": "UTC calendar windows",
    "txShown": "Shown",
    "of": "of",
    "newPayShort": "New payers",
    "txLink": "Tonviewer"
  },
  "ru": {
    "subtitle": "Независимая ончейн-аналитика",
    "all": "Всё время",
    "allFilter": "Всё",
    "d30": "30 дн.",
    "d7": "7 дн.",
    "h24": "24 ч.",
    "custom": "Период",
    "from": "От",
    "to": "До",
    "growth": "Рост аудитории",
    "growthHint": "Уникальные адреса с начала наблюдения",
    "daily": "Активность кошельков",
    "dailyHint": "Уникальные адреса за интервал",
    "feesChart": "Комиссии",
    "feesHint": "Входящие комиссии · GRAM",
    "venues": "Активность по площадкам",
    "venueHint": "Метки из комментариев транзакций, а не подтверждённое исполнение сделок.",
    "advanced": "Подробная статистика",
    "retention": "Возвращаемость кошельков",
    "retentionHint": "Новые кошельки за период, активные снова в один из следующих дней UTC в течение 7, 14 или 30 дней. Только полностью наблюдаемые интервалы.",
    "history": "История по интервалам",
    "historyHint": "Интервалы совпадают с графиками.",
    "method": "Методика и источник",
    "resync": "Загрузить всю историю",
    "disclaimer": "Независимый дашборд сообщества, не официальный продукт Pepegun. Адреса кошельков не равны отдельным пользователям.",
    "source": "Открыть в Tonviewer",
    "loading": "Загрузка истории",
    "refreshing": "Проверка новых данных",
    "synced": "Обновлено",
    "stale": "Сохранённые данные",
    "unavailable": "Данные недоступны",
    "partial": "Неполный период",
    "incomplete": "Не завершён",
    "complete": "Полный",
    "refresh": "Обновить данные",
    "language": "Язык",
    "range": "Период",
    "overview": "Основные показатели",
    "wallets": "Уникальные кошельки",
    "paying": "Платящие кошельки",
    "revenue": "Доход с комиссий",
    "payments": "Платежи комиссий",
    "share": "от всех кошельков",
    "avg": "Средняя комиссия",
    "active": "Активные кошельки",
    "today": "1 день",
    "week": "7 дней",
    "month": "30 дней",
    "new": "Новые кошельки",
    "returning": "Вернувшиеся",
    "firstSeen": "Впервые в выбранном периоде",
    "seenBefore": "Активны и замечены ранее",
    "newShort": "Новые",
    "returningShort": "Повторные",
    "payingShort": "Платящие",
    "allShort": "Все кошельки",
    "fee": "Комиссии",
    "day": "Дата (UTC)",
    "activeShort": "Активные",
    "count": "Платежи",
    "other": "Другие переводы",
    "cum": "Всего кошельков",
    "cumPay": "Всего платящих",
    "largest": "Крупнейшая комиссия",
    "noData": "Нет подходящих данных за период",
    "noHistory": "Ожидание проверенной истории блокчейна",
    "noCache": "Не удалось загрузить проверенную историю. Нажмите обновление.",
    "cachedError": "Обновление не удалось. Показан последний успешный снимок.",
    "oldCache": "Данные старше 20 минут. Обновите страницу.",
    "retry": "Лимит API — повтор запроса",
    "downloading": "Загрузка транзакций",
    "transactions": "транзакций",
    "badRange": "Выберите корректные даты в пределах истории.",
    "persist": "Хранилище браузера недоступно. Данные доступны в текущем сеансе.",
    "noExport": "Не удалось создать файл в этом браузере.",
    "more": "Показать ещё",
    "less": "Свернуть",
    "asOf": "Данные на",
    "rolling": "Последние 24 часа",
    "calendar7": "7 календарных дней UTC",
    "calendar30": "30 календарных дней UTC",
    "dateRange": "Выбранные даты UTC",
    "scanned": "Проверено транзакций",
    "provider": "Источник данных",
    "coverage": "Полнота истории",
    "verified": "Непрерывная история адреса",
    "collector": "Комиссионный кошелёк",
    "copyAddress": "Скопировать полный адрес",
    "addressCopied": "Адрес скопирован",
    "copyAddressFailed": "Скопируйте адрес вручную из поля ниже",
    "exportNote": "Кошельки — адреса, а не люди. Независимая ончейн-аналитика.",
    "methodItems": [
      "Данные одного публичного комиссионного кошелька в TON получаются через Toncenter API v3 или TonAPI v2. Полная выгрузка должна образовывать непрерывную цепочку до первой транзакции адреса.",
      "Учитываются успешные входящие положительные переводы нативной валюты с распознанным префиксом комментария Pepegun. Возвращённые переводы и переводы самому себе исключаются. Повторы хешей и полных нормализованных адресов не учитываются. Маркер комиссии обозначает платёж Pepegun, а не количество исполненных сделок.",
      "Только комментарии с префиксом Pepegun fee относятся к платежам комиссий и валовому комиссионному доходу. Другие переводы Pepegun, в том числе крупные, учитываются в активности, но не в доходе. Платежи не равны числу сделок, а валовые комиссии — чистой прибыли.",
      "Новые кошельки впервые появились в выбранном периоде. Вернувшиеся были замечены ранее и активны в нём. Накопительные итоги — уникальные адреса с начала наблюдения. Активность за 1, 7 и 30 дней рассчитана по календарным дням UTC до конца выбранного периода; эти окна могут начинаться раньше периода.",
      "Все календарные даты — UTC. Фильтры 7 и 30 дней включают день последнего снимка и 6 или 29 предыдущих дней; 6 и 24 часа — скользящие интервалы. Графики используют адаптивные интервалы UTC; неполные интервалы отмечены. Сохранённые данные считаются только до последней успешной синхронизации.",
      "Обновление при открытии, вручную, каждые 15 минут на открытой странице и при возврате в давно открытую вкладку. Браузер хранит последнюю проверенную историю; ежедневный публичный снимок ускоряет загрузку; платный API не используется. Доступность зависит от публичных индексаторов блокчейна."
    ],
    "median": "Медианная комиссия",
    "perPayer": "Комиссии на плательщика",
    "top5": "Доля комиссий топ-5",
    "top10": "Доля комиссий топ-10",
    "newPayers": "Новые платящие кошельки",
    "repeatPayers": "Повторные платящие",
    "comparison": "Сравнение с предыдущим периодом",
    "compareHint": "Равный по длительности интервал UTC.",
    "metric": "Показатель",
    "current": "Сейчас",
    "previous": "Ранее",
    "delta": "Изменение",
    "noComparison": "Недостаточно истории для равного предыдущего периода.",
    "audit": "Сверка источников",
    "auditButton": "Сверить оба индексатора",
    "auditIdle": "Этот снимок ещё не сверялся",
    "auditBusy": "Проверка второго индексатора…",
    "auditPages": "Загружено страниц",
    "auditScanned": "Просмотрено транзакций",
    "auditRetry": "Повторный запрос…",
    "auditMatch": "Источники совпадают на проверенном снимке",
    "auditMismatch": "Источники расходятся — нужна проверка",
    "auditUnavailable": "Второй индексатор не подтвердил снимок",
    "ambiguous": "Нетипичные комментарии Pepegun (за всё время)",
    "chainTip": "Время последней транзакции адреса",
    "shortRules": "Принимается точный префикс Pepegun или Pepegun fee (необязательно 🔫), за которым следует метка через · или конец строки. Другие упоминания исключаются и учитываются отдельно. Совпадение источников проверяет индексированную историю адреса.",
    "topHint": "Доля комиссионного дохода от адресов с наибольшей суммой комиссий за выбранный период.",
    "h6": "6 ч.",
    "rolling6": "Последние 6 часов",
    "transactionsTitle": "Транзакции",
    "transactionsHint": "Входящие переводы Pepegun за выбранный период со ссылками на Tonviewer.",
    "filterAll": "Все",
    "filterFee": "Комиссии",
    "filterOther": "Другие",
    "viewTx": "Смотреть транзакции",
    "viewInterval": "Выбранный интервал",
    "resetInterval": "Весь период",
    "txEmpty": "Нет подходящих переводов",
    "txTypeFee": "Комиссия",
    "txTypeOther": "Другой перевод",
    "interval": "Интервал",
    "interval15": "15 мин",
    "interval1": "1 час",
    "interval3": "3 часа",
    "interval6": "6 часов",
    "intervalDay": "1 день",
    "intervalWeek": "1 неделя",
    "intervalMonth": "1 месяц",
    "returnedWithin": "За",
    "auditPrior": "Более ранний снимок",
    "calendarWindows": "Календарные дни UTC",
    "txShown": "Показано",
    "of": "из",
    "newPayShort": "Новые платящие",
    "txLink": "Tonviewer"
  }
};
const $=id=>document.getElementById(id);
let lang="en";try{lang=localStorage.getItem("pepegun-lang")||(/^ru\b/i.test(navigator.language)?"ru":"en")}catch{}if(!words[lang])lang="en";
const tr=k=>words[lang][k]||k,locale=()=>lang==="ru"?"ru-RU":"en-US",num=x=>new Intl.NumberFormat(locale()).format(x),pct=(a,b)=>b?new Intl.NumberFormat(locale(),{style:"percent",maximumFractionDigits:1}).format(a/b):"—";
const money=x=>compactAmount(x,locale(),4);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const time=t=>new Date(t).toISOString().slice(0,16).replace("T"," ")+" UTC";
const txTime=t=>new Date(t).toISOString().slice(0,19).replace("T"," ")+" UTC";
const utcDate=(t,year=false)=>new Intl.DateTimeFormat(locale(),{timeZone:"UTC",day:"numeric",month:"short",...(year?{year:"numeric"}:{})}).format(new Date(t));
const syncTime=t=>utcDate(t)+", "+new Date(t).toISOString().slice(11,16)+" UTC";
const shortDate=s=>{const d=s.slice(0,10).split("-");return lang==="ru"?d[2]+"."+d[1]:d[1]+"/"+d[2]};
const clock=t=>new Date(t).toISOString().slice(11,16);
const intervalName=k=>tr(({"15m":"interval15","1h":"interval1","3h":"interval3","6h":"interval6",day:"intervalDay",week:"intervalWeek",month:"intervalMonth"})[k]);
const hourly=()=>["15m","1h","3h","6h"].includes(series.kind);
function axisLabel(b){return hourly()?(series.kind==="15m"||series.kind==="1h"?(dayIndex(series.bins[0].bucket)===dayIndex(series.bins.at(-1).bucket)?clock(b.bucket):shortDate(b.date)+" "+clock(b.bucket)):shortDate(b.date)+" "+clock(b.bucket)):series.kind==="month"?b.date.slice(0,7):shortDate(b.date)}
function intervalLabel(b){const a=b.start,z=b.end-1;if(hourly())return utcDate(a)+" "+clock(a)+" — "+(dayIndex(a)===dayIndex(b.end)?"":utcDate(b.end)+" ")+clock(b.end);return dayIndex(a)===dayIndex(z)?utcDate(a,true):utcDate(a)+" — "+utcDate(z,true)}
function exportDateLabel(){return range?(selected==="6h"||selected==="24h"?time(range.from)+" — "+time(range.to-1):dateLabel()+" · UTC"):""}
const statusLabel=s=>s==="partial"?tr("partial"):s==="incomplete"?tr("incomplete"):tr("complete");
let cache=null,selected="all",m=null,range=null,busy=true,error=false,storageError=false,exportError=false,progress=null,resizeTimer;
let pointsState={},pointBuckets={},audit=null,auditing=false,auditProgress=null,series={kind:"day",bins:[]},txRange=null,txType="fee",txLimit=20,historyLimit=14;
function stale(){return !!cache&&(error||Date.now()-cache.asOf>STALE)}
function language(){document.documentElement.lang=lang;document.querySelectorAll("[data-i]").forEach(el=>el.textContent=tr(el.dataset.i));const switchLabel=lang==="ru"?"Switch to English":"Переключить на русский";$("language").textContent=lang==="ru"?"EN":"RU";$("language").setAttribute("aria-label",switchLabel);$("language").title=switchLabel;$("refresh").setAttribute("aria-label",tr("refresh"));$("refresh").title=tr("refresh");$("filters").setAttribute("aria-label",tr("range"));$("tx-filters").setAttribute("aria-label",lang==="ru"?"Тип транзакции":"Transaction type");$("overview").setAttribute("aria-label",tr("overview"));$("active").setAttribute("aria-label",tr("active"));}
function updateStatus(){
 const isOld=stale(),s=$("status"),label=busy?(cache?tr("refreshing"):tr("loading")):cache?(isOld?tr("stale"):tr("synced")):tr("unavailable");
 s.className="status "+(busy?"loading":cache?(isOld?"stale":""):"error");$("status-text").textContent=label;$("updated").textContent=cache?syncTime(cache.asOf):"";
 $("refresh").classList.toggle("loading",busy);$("refresh").disabled=busy;$("resync").disabled=busy;
 let note="";
 if(busy&&!cache&&progress)note=progress.retry?tr("retry"):tr("downloading")+" · "+num(progress.scanned||0)+" "+tr("transactions");
 else if(error)note=tr(cache?"cachedError":"noCache");
 else if(isOld)note=tr("oldCache");
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
 if(txRange&&range){txRange={from:Math.max(txRange.from,range.from),to:Math.min(txRange.to,range.to)};if(txRange.to<=txRange.from)txRange=null}
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
}
const colors={all:"#b5ef58",paid:"#71c5b3",new:"#a8d956",returning:"#414f48",fee:"#a8d956",grid:"#292e2b",text:"#919c95"};
const fnum=(x,step=1)=>new Intl.NumberFormat(locale(),{maximumFractionDigits:Math.max(0,Math.min(9,Math.ceil(-Math.log10(step))+1)),notation:x>=100000?"compact":"standard"}).format(x);
function chartSpec(){return [
 ["growth-chart",series.bins,[{key:"cum",label:tr("allShort"),color:colors.all},{key:"cumPay",label:tr("payingShort"),color:colors.paid}],"line",false],
 ["daily-chart",series.bins,[{key:"new",label:tr("newShort"),color:colors.new},{key:"returning",label:tr("returningShort"),color:colors.returning},{key:"paying",label:tr("payingShort"),color:colors.paid,line:true}],"stack",false],
 ["fees-chart",series.bins,[{key:"fee",label:tr("fee"),color:colors.fee}],"bar",true]
];}
function renderCharts(){for(const [id,data,series,kind,decimal] of chartSpec())drawChart(id,data,series,kind,decimal)}
function drawChart(id,data,series,kind,decimal){
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
  data.forEach((r,i)=>{let prev=0;const bw=Math.max(.6,Math.min(cell*.7,24));for(const s of series.filter(z=>!z.line)){const v=val(r,s);if(v>0){const top=y(prev+v),h=y(prev)-top;svg+='<rect x="'+(x(i)-bw/2)+'" y="'+top+'" width="'+bw+'" height="'+h+'" rx="'+Math.min(2,bw/4)+'" fill="'+s.color+'" opacity="'+(isPartial(r)?.48:1)+'"/>'}prev+=v}});
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
 let activePointer=null;
 function pointer(e){const rect=graphic.getBoundingClientRect();if(!rect.width)return;const px=(e.clientX-rect.left)*W/rect.width;const i=Math.max(0,Math.min(data.length-1,Math.floor((px-L)/cell)));if(pointsState[id]!==i)focus(i)}
 graphic.addEventListener("pointerdown",e=>{
  if(e.isPrimary===false||e.button!==0||activePointer!==null)return;
  activePointer=e.pointerId;pointer(e);
  try{graphic.setPointerCapture(e.pointerId)}catch{}
 });
 graphic.addEventListener("pointermove",e=>{
  if(e.isPrimary===false)return;
  if(e.pointerId===activePointer||(activePointer===null&&e.pointerType==="mouse"))pointer(e);
 });
 graphic.addEventListener("pointerup",e=>{
  if(e.pointerId!==activePointer)return;
  pointer(e);activePointer=null;
  try{if(graphic.hasPointerCapture(e.pointerId))graphic.releasePointerCapture(e.pointerId)}catch{}
 });
 function cancelPointer(e){if(e.pointerId===activePointer)activePointer=null}
 graphic.addEventListener("pointercancel",cancelPointer);
 graphic.addEventListener("lostpointercapture",cancelPointer);
 graphic.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();focus((pointsState[id]??0)+(e.key==="ArrowRight"?1:-1))}});
}
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
 const check=(!audit||cache?.audit?.asOf>audit.asOf)?cache?.audit:audit;
 const state=auditing?"auditBusy":check?({match:"auditMatch",mismatch:"auditMismatch",unavailable:"auditUnavailable"}[check.status]||"auditIdle"):"auditIdle";
 $("audit-result").textContent=tr(state)+(check&&!auditing?" · "+time(check.asOf)+(cache&&check.tip!==cache.tip?" · "+tr("auditPrior"):""):"");
 $("audit-result").className="sub "+(state==="auditMismatch"?"audit-warn":"");
 const auditButton=$("audit-check");auditButton.disabled=!cache||auditing;auditButton.classList.toggle("audit-running",auditing);auditButton.setAttribute("aria-busy",String(auditing));auditButton.textContent=tr(auditing?"auditBusy":"auditButton");
 const p=auditProgress;
 $("audit-progress").hidden=!auditing;
 $("audit-progress").textContent=auditing&&p?((p.source==="tonapi"?"TonAPI v2":"Toncenter API v3")+" · "+tr("auditPages")+": "+num(p.pages)+" · "+tr("auditScanned")+": "+num(p.scanned)+(p.retry?" · "+tr("auditRetry"):"")):"";
 $("audit-meta").textContent=cache?tr("ambiguous")+": "+num(cache.ambiguous)+" · "+tr("chainTip")+": "+time(cache.tipTime*1000):"";
}
async function auditSources(){if(!cache||auditing)return;const snapshot=cache;auditing=true;auditProgress={source:snapshot.source==="toncenter"?"tonapi":"toncenter",pages:0,scanned:0,retry:false};renderExtras();try{audit=await crossCheck(snapshot,p=>{auditProgress={...auditProgress,...p,retry:!!p.retry};renderExtras()})}catch{audit={status:"unavailable",asOf:Date.now(),tip:snapshot.tip}}finally{if(cache&&validAudit(audit,cache.tip)&&(!cache.audit||audit.asOf>=cache.audit.asOf)){cache.audit=audit;await saveCache(cache)}auditing=false;auditProgress=null;renderExtras()}}
function renderTransactions(){
 const r=txRange||range,valid=!!m&&!!r;
 $("tx-filters").querySelectorAll("button").forEach(b=>{b.disabled=!valid;b.setAttribute("aria-pressed",String(b.dataset.txType===txType))});
 $("tx-reset").hidden=!txRange;$("tx-context").textContent=valid&&txRange?tr("viewInterval")+": "+time(r.from)+" — "+time(r.to-1):"";
 if(!valid){$("tx-list").innerHTML=placeholder();$("tx-more").hidden=true;$("tx-count").textContent="";return}
 const rows=rowsInRange(cache.rows,r,txType),shown=rows.slice(0,txLimit);
 $("tx-count").textContent=tr("txShown")+" "+num(shown.length)+" "+tr("of")+" "+num(rows.length);
 $("tx-list").innerHTML=shown.length?'<div class="tx-list">'+shown.map(r=>'<article class="tx-row"><div><strong>'+esc(r.k==="fee"?tr("txTypeFee"):tr("txTypeOther"))+'</strong><small>'+esc(venueLabel(r.d))+'</small><small>'+esc(txTime(r.t*1000))+'</small></div><div class="tx-right"><strong title="'+esc(exact(r.v))+' GRAM">'+esc(money(r.v))+' GRAM</strong><a href="https://tonviewer.com/transaction/'+esc(r.h)+'" target="_blank" rel="noopener noreferrer">'+esc(tr("txLink"))+' ↗</a></div></article>').join("")+'</div>':'<p class="empty-note">'+esc(tr("txEmpty"))+'</p>';
 $("tx-more").hidden=shown.length>=rows.length;$("tx-more").textContent=tr("more");
}
function openTransactions(r,type){txRange=r;txType=type;txLimit=20;const d=$("transaction-section");d.open=true;renderTransactions();d.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function exportCsv(){
 if(!m||!cache)return;
 exportError=false;updateStatus();
 try{download(new Blob(["\ufeff"+intervalCsv(series,cache.asOf,stale())],{type:"text/csv;charset=utf-8"}),"pepegun-"+selected+"-"+m.anchor+".csv")}
 catch{exportError=true;updateStatus()}
}
async function exportPng(){
 if(!m||!cache)return;
 const snapshot=m,exportSeries=series,asOf=cache.asOf,old=stale(),label=exportDateLabel(),currentLang=lang,exportPreset=selected,canvas=document.createElement("canvas");canvas.width=2400;canvas.height=1840;const g=canvas.getContext("2d");if(!g)throw Error("Canvas unavailable");g.scale(2,2);const W=1200,H=920;
 const palette={bg:"#101211",card:"#171a18",border:"#292e2b",muted:"#a1aaa3",text:"#edf1ee",green:"#b5ef58",paid:"#71c5b3"};
 const font=(n,b=false)=> (b?"600 ":"400 ")+n+"px system-ui, sans-serif";
 function txt(s,x,y,n=16,c=palette.text,b=false,max=Infinity){g.font=font(n,b);while(g.measureText(s).width>max&&n>9)g.font=font(--n,b);g.fillStyle=c;g.fillText(s,x,y)}
 function rect(x,y,w,h,c){g.fillStyle=c;g.strokeStyle=palette.border;g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,12);else g.rect(x,y,w,h);g.fill();g.stroke()}
 g.fillStyle=palette.bg;g.fillRect(0,0,W,H);
 try{const im=new Image();im.src="./pepegun-logo.svg";await im.decode();g.drawImage(im,38,26,56,56)}catch{}
 txt("Pepegun Analytics",105,52,30,palette.text,true,620);txt(words[currentLang].subtitle,105,75,15,palette.muted,false,620);
 txt(label,725,44,15,palette.green,true,435);txt(words[currentLang].asOf+" "+time(asOf)+(old?" · "+words[currentLang].stale:""),725,68,13,palette.muted,false,435);
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
 if(mode==="bar"||mode==="stack")data.forEach((d,i)=>{let prev=0;for(const [k,c] of series.filter(s=>mode==="bar"||s[0]!=="paying")){const v=val(d,k);g.fillStyle=c;g.globalAlpha=d.status==="complete"?1:.45;g.fillRect(at(i)-bw/2,py(prev+v),bw,py(prev)-py(prev+v));g.globalAlpha=1;prev+=v}});
 for(const [k,c] of series.filter(s=>mode==="line"||(mode==="stack"&&s[0]==="paying"))){g.strokeStyle=c;g.lineWidth=2;g.beginPath();data.forEach((d,i)=>{const px=at(i),yy=py(val(d,k));i?g.lineTo(px,yy):g.moveTo(px,yy)});g.stroke();if(data.length===1){g.fillStyle=c;g.beginPath();g.arc(at(0),py(val(data[0],k)),2.5,0,Math.PI*2);g.fill()}}
 if(data.length){const stamp=b=>["15m","1h","3h","6h"].includes(exportSeries.kind)?b.date.slice(5,10)+" "+b.date.slice(11,16):b.date.slice(0,10);txt(stamp(data[0]),L,B+18,11,palette.muted);const last=stamp(data.at(-1));g.font=font(11);if(data.length>1)txt(last,R-g.measureText(last).width,B+18,11,palette.muted)}
 let xx=x+16;for(const [k,c,label] of series){g.fillStyle=c;g.fillRect(xx,y+h-23,7,7);txt(label,xx+11,y+h-16,11,palette.muted);g.font=font(11);xx+=g.measureText(label).width+27}
 }
 draw(38,223,1124,266,words[currentLang].growth,exportSeries.bins,[["cum",palette.green,words[currentLang].allShort],["cumPay",palette.paid,words[currentLang].payingShort]]);
 draw(38,505,554,315,words[currentLang].daily,exportSeries.bins,[["new",palette.green,words[currentLang].newShort],["returning","#414f48",words[currentLang].returningShort],["paying",palette.paid,words[currentLang].payingShort]],"stack");
 draw(608,505,554,315,words[currentLang].feesChart,exportSeries.bins,[["fee",palette.green,"GRAM"]],"bar");
 txt(words[currentLang].exportNote,38,852,14,palette.muted,false,1124);
 txt(words[currentLang].collector+": "+ADDRESS,38,878,12,palette.muted,false,1124);
 if(exportSeries.bins.some(b=>b.status!=="complete"))txt(words[currentLang].partial+" · UTC",38,900,12,palette.muted,false,1124);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("PNG unavailable")),"image/png"));download(blob,"pepegun-"+exportPreset+"-"+snapshot.anchor+".png");
}
async function refresh(force=false){
 if(busy)return;
 busy=true;error=false;progress=null;exportError=false;updateStatus();
 try{const next=await sync(cache,p=>{progress=p;updateStatus()},force);cache=next;storageError=!(await saveCache(next));}
 catch(e){error=true;console.warn("Pepegun sync:",e)}
 finally{busy=false;render()}
}
$("language").addEventListener("click",()=>{lang=lang==="ru"?"en":"ru";try{localStorage.setItem("pepegun-lang",lang)}catch{}render()});
document.querySelectorAll("[data-range]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.range;historyLimit=14;txRange=null;txLimit=20;pointsState={};pointBuckets={};render()}));
for(const id of ["from","to"])$(id).addEventListener("change",()=>{pointsState={};pointBuckets={};historyLimit=14;txRange=null;txLimit=20;render()});
$("more").addEventListener("click",()=>{historyLimit=historyLimit>=series.bins.length?14:historyLimit+30;renderDetails()});
$("tx-filters").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{txType=b.dataset.txType;txLimit=20;renderTransactions()}));
$("tx-reset").addEventListener("click",()=>{txRange=null;txLimit=20;renderTransactions()});
$("tx-more").addEventListener("click",()=>{txLimit+=30;renderTransactions()});
$("audit-check").addEventListener("click",auditSources);$("refresh").addEventListener("click",()=>refresh());$("resync").addEventListener("click",()=>refresh(true));$("csv").addEventListener("click",exportCsv);$("png").addEventListener("click",()=>{exportError=false;updateStatus();exportPng().catch(()=>{exportError=true;updateStatus()})});
window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderCharts,100)});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!busy&&(!cache||Date.now()-cache.asOf>=REFRESH))refresh()});
setInterval(()=>{if(!busy&&document.visibilityState==="visible")refresh()},REFRESH);setInterval(updateStatus,60000);
const updateCardExport=setupCardExport(()=>({valid:!!m&&!!cache,lang,period:rangeNote(),asOf:cache?time(cache.asOf):"",anchor:m?.anchor||"",stale:stale()}),download);
render();loadCache().then(async c=>{if(c){cache=c;render()}const seed=await loadSeed();cache=selectSnapshot(c,seed);if(cache&&seed&&seed.tip===cache.tip&&seed.tipHash===cache.tipHash&&validAudit(seed.audit,cache.tip)&&(!cache.audit||seed.audit.asOf>cache.audit.asOf))cache.audit=seed.audit;busy=false;render();refresh()}).catch(()=>{busy=false;refresh()});
