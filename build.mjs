import fs from "fs";
const base="/Users/mac/daily-encyclopedia";
const V="4"; // نسخة الأصول
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const arNum=n=>String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
const pad=n=>String(n).padStart(3,"0");

// حمّل المقالات مرتّبة برقم الملف
const files=fs.readdirSync(`${base}/entries`).filter(f=>f.endsWith(".json")).sort();
const entries=files.map((f,i)=>{
  const j=JSON.parse(fs.readFileSync(`${base}/entries/${f}`,"utf8"));
  const day=i+1;
  return {...j, day, id:"e"+day, file:`days/day-${pad(day)}.html`};
});
const total=entries.length;

const HEAD=(title,pre)=>`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${pre}assets/style.css?v=${V}">
<link rel="manifest" href="${pre}app.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0f6b5f">
<link rel="apple-touch-icon" href="${pre}assets/icon.svg">
<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('${pre}sw.js').catch(function(){});});}</script>
</head>`;

const THEMEJS=`document.getElementById('tt').addEventListener('click',function(){var r=document.documentElement,t=r.getAttribute('data-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.setAttribute('data-theme',d?'light':'dark');localStorage.setItem('risala-theme',d?'light':'dark');});`;

// ---- صفحة مقالة (يوم) ----
function dayPage(e, prev, next){
  const terms=(e.terms||[]).map(t=>`<div class="t"><span class="ar">${esc(t.ar)}</span><span class="en">(${esc(t.en)})</span></div>`).join("");
  const refl=(e.reflection||[]).map(x=>`<li>${esc(x)}</li>`).join("");
  const summ=(e.summary||[]).map(x=>`<li>${esc(x)}</li>`).join("");
  const body=(e.body||[]).map(p=>`<p>${esc(p)}</p>`).join("\n      ");
  const src=(e.sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`).join("");
  const prevA=prev?`<a href="day-${pad(prev)}.html">◀ السابق</a>`:`<a class="disabled">◀ السابق</a>`;
  const nextA=next?`<a href="day-${pad(next)}.html">التالي ▶</a>`:`<a class="disabled">التالي ▶</a>`;
  return `${HEAD("الموسوعة · "+e.title,"../")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  <nav class="nav">
    <a class="home" href="../index.html">📚 الموسوعة</a>
    <span style="display:flex;gap:.5rem">${prevA}${nextA}</span>
    <span style="display:flex;gap:.45rem"><a href="../search.html">🔍</a><a href="../marks.html">🔖</a><a href="../archive.html">☰</a></span>
  </nav>
  <header class="mast">
    <p class="k">الموسوعة اليوميّة</p>
    <h1>${esc(e.title)}</h1>
    <p class="m">اليوم ${arNum(e.day)} من ${arNum(total)}</p>
  </header>
  <article id="${e.id}">
    <span class="badge">${esc(e.category)}</span>
    <p class="by">قراءة ${arNum(e.reading_min||5)} دقائق</p>
    <div class="idea"><span class="lbl">الفكرة الرئيسيّة</span>${esc(e.main_idea)}</div>
    <div class="matn">
      ${body}
      ${summ?`<div class="reflect summary"><span class="lbl">⚡ أهمّ النقاط</span><ul>${summ}</ul></div>`:""}
      <div class="reflect"><span class="lbl">نقاط للتأمّل</span><ul>${refl}</ul></div>
      <div class="termbox"><span class="lbl">مصطلحات</span>${terms}</div>
      <div class="sources"><span class="lbl">المصادر</span>${src}</div>
    </div>
  </article>
  <footer>
    <p class="big">✦ نهاية قراءة اليوم ✦</p>
    <p><a href="../archive.html">كل التصنيفات →</a></p>
  </footer>
</div>
<script src="../assets/footnotes.js?v=${V}"></script>
</body></html>`;
}

entries.forEach((e,i)=>{
  fs.writeFileSync(`${base}/days/day-${pad(e.day)}.html`, dayPage(e, i>0?i:null, i<total-1?i+2:null));
});

// ---- index.json ----
const idx={ note:"فهرس مقالات الموسوعة", categories:[...new Set(entries.map(e=>e.category))],
  articles:entries.map(e=>({id:e.id,title:e.title,category:e.category,reading_min:e.reading_min||5,day:e.day,file:e.file})) };
fs.writeFileSync(`${base}/index.json`, JSON.stringify(idx,null,2));
fs.writeFileSync(`${base}/manifest.json`, JSON.stringify({start:"2026-08-24",total},null,2));

// ---- الرئيسية ----
fs.writeFileSync(`${base}/index.html`, `${HEAD("الموسوعة اليوميّة","")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  <nav class="nav"><a class="home" href="index.html">📚 الموسوعة</a>
    <span style="display:flex;gap:.45rem"><a href="search.html">🔍 بحث</a><a href="marks.html">🔖 علاماتي</a></span></nav>
  <header class="mast"><p class="k">موسوعةٌ متجدّدة</p><h1>الموسوعة اليوميّة</h1>
    <p class="m">مقالةٌ موثوقة كلّ يوم · في شتّى المجالات</p></header>
  <div id="prog"></div>
  <div id="resume"></div>
  <a id="todayCard" class="today-card" href="#" style="display:none">
    <span class="k">📅 مقال اليوم</span>
    <div class="tt2" id="tdTitle"></div>
    <div class="mt" id="tdMeta"></div>
  </a>
  <div class="sect-h">تصفّح التصنيفات</div>
  <select class="catsel" id="catSel"><option value="">اختر تصنيفًا…</option></select>
  <ul class="archive-list" id="catList"></ul>
  <p style="text-align:center;margin:1.4rem 0 0;display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
    <a class="soft-link" href="archive.html">📁 الأرشيف (المقروءة)</a>
    <button id="cloudRestore" class="soft-link" style="cursor:pointer">☁↓ استعادة موضعي</button></p>
</div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
function readMap(){try{return JSON.parse(localStorage.getItem('enc-read')||'{}');}catch(e){return {};}}
var READ=readMap();
(function(){var last=null;try{last=JSON.parse(localStorage.getItem('enc-last')||'null');}catch(e){}
 var b=document.getElementById('resume');
 if(last&&last.file){b.innerHTML='<a class="resume-btn" href="'+last.file+'?pg='+(last.page||1)+'"><span class="rt">▶ متابعة القراءة</span><span class="rs">'+(last.title?String(last.title).replace('الموسوعة · ',''):'آخر موضع')+' · صفحة '+arNum(last.page||1)+'</span></a>';}})();
Promise.all([fetch('index.json',{cache:'no-store'}).then(function(r){return r.json();}),fetch('manifest.json',{cache:'no-store'}).then(function(r){return r.json();})]).then(function(res){
 var j=res[0],m=res[1],arts=j.articles||[],cats=j.categories||[];
 var readCount=arts.filter(function(a){return READ[a.id];}).length;
 var pct=arts.length?Math.round(readCount/arts.length*100):0;
 document.getElementById('prog').innerHTML='<div class="bar"><span style="width:'+pct+'%"></span></div><p class="pl">قرأتَ '+arNum(readCount)+' من '+arNum(arts.length)+'</p>';
 var S=Date.UTC(2026,7,24),now=new Date();var t=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
 var n=Math.floor((t-S)/86400000)+1;if(n<1)n=1;if(n>m.total)n=m.total;
 var td=arts[n-1];
 if(td){var c=document.getElementById('todayCard');c.href=td.file;c.style.display='';
  document.getElementById('tdTitle').innerHTML=td.title+(READ[td.id]?'<span class="readmark">✓</span>':'');
  document.getElementById('tdMeta').textContent=td.category+' · قراءة '+arNum(td.reading_min)+' دقائق';}
 var sel=document.getElementById('catSel'),list=document.getElementById('catList');
 cats.forEach(function(cc){var o=document.createElement('option');o.value=cc;o.textContent=cc;sel.appendChild(o);});
 sel.addEventListener('change',function(){list.innerHTML='';var cv=this.value;if(!cv)return;
  arts.filter(function(a){return a.category===cv;}).forEach(function(a){var li=document.createElement('li');var lnk=document.createElement('a');
   lnk.href=a.file;if(READ[a.id])lnk.className='read';
   lnk.innerHTML='<span class="d">'+a.title+(READ[a.id]?'<span class="readmark">✓</span>':'')+'</span><span class="t">قراءة '+arNum(a.reading_min)+' دقائق</span>';
   li.appendChild(lnk);list.appendChild(li);});});
});
document.getElementById('cloudRestore').addEventListener('click',function(){var b=this;b.textContent='☁ جارٍ…';
 fetch('https://kvdb.io/Hj8v3hbdFx6wBP8hrRyaUk/enc_pos',{cache:'no-store'}).then(function(r){return r.json();}).then(function(p){
  if(p&&p.file){location.href='/daily-encyclopedia/'+p.file+'?pg='+(p.page||1);}else{b.textContent='لا يوجد موضع محفوظ';}}).catch(function(){b.textContent='تعذّر الاتصال';});});
${THEMEJS}
</script></body></html>`);

// ---- الأرشيف (المقروءة) ----
fs.writeFileSync(`${base}/archive.html`, `${HEAD("الموسوعة · الأرشيف","")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  <nav class="nav"><a class="home" href="index.html">📚 الموسوعة</a>
    <span style="display:flex;gap:.45rem"><a href="search.html">🔍 بحث</a><a href="marks.html">🔖 علاماتي</a></span></nav>
  <header class="mast"><p class="k">الموسوعة</p><h1>الأرشيف</h1><p class="m">المقالات التي أنهيتها ✓</p></header>
  <ul class="archive-list" id="list"><li>…</li></ul>
</div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
function readMap(){try{return JSON.parse(localStorage.getItem('enc-read')||'{}');}catch(e){return {};}}
var R=readMap();
function fmt(ts){try{var d=new Date(ts);return arNum(d.getFullYear())+'-'+arNum(('0'+(d.getMonth()+1)).slice(-2))+'-'+arNum(('0'+d.getDate()).slice(-2));}catch(e){return '';}}
fetch('index.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
 var arts=(j.articles||[]).filter(function(a){return R[a.id];}).sort(function(a,b){return R[b.id]-R[a.id];});
 var ul=document.getElementById('list');ul.innerHTML='';
 if(!arts.length){ul.innerHTML='<p style="color:var(--faint);text-align:center;margin:2rem 0">لا مقالات مقروءة بعد — أنهِ مقالةً لتظهر هنا ✓</p>';return;}
 arts.forEach(function(a){var li=document.createElement('li');var lnk=document.createElement('a');lnk.href=a.file;
  lnk.innerHTML='<span class="d">'+a.title+'<span class="readmark">✓</span></span><span class="t">'+a.category+' · '+fmt(R[a.id])+'</span>';
  li.appendChild(lnk);ul.appendChild(li);});});
${THEMEJS}
</script></body></html>`);

// ---- صفحة تصنيف ----
fs.writeFileSync(`${base}/category.html`, `${HEAD("الموسوعة · تصنيف","")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  <nav class="nav"><a class="home" href="index.html">📚 الموسوعة</a>
    <span style="display:flex;gap:.45rem"><a href="archive.html">📁 الأرشيف</a><a href="search.html">🔍 بحث</a></span></nav>
  <header class="mast"><p class="k">تصنيف</p><h1 id="ct">…</h1><p class="m" id="cm"></p></header>
  <ul class="archive-list" id="list"><li>…</li></ul>
</div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
function readMap(){try{return JSON.parse(localStorage.getItem('enc-read')||'{}');}catch(e){return {};}}
var R=readMap();
var c=decodeURIComponent(new URLSearchParams(location.search).get('c')||'');
fetch('index.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
 var arts=(j.articles||[]).filter(function(a){return a.category===c;});
 document.getElementById('ct').textContent=c;document.getElementById('cm').textContent=arNum(arts.length)+' مقالة';
 var ul=document.getElementById('list');ul.innerHTML='';
 arts.forEach(function(a){var li=document.createElement('li');var lnk=document.createElement('a');
  lnk.href=a.file;if(R[a.id])lnk.className='read';
  lnk.innerHTML='<span class="d">'+a.title+(R[a.id]?'<span class="readmark">✓</span>':'')+'</span><span class="t">قراءة '+arNum(a.reading_min)+' دقائق</span>';
  li.appendChild(lnk);ul.appendChild(li);});});
${THEMEJS}
</script></body></html>`);

// ---- البحث ----
fs.writeFileSync(`${base}/search.html`, `${HEAD("الموسوعة · البحث","")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  <nav class="nav"><a class="home" href="index.html">📚 الموسوعة</a>
    <span style="display:flex;gap:.45rem"><a href="archive.html">📁 الأرشيف</a><a href="marks.html">🔖 علاماتي</a></span></nav>
  <header class="mast"><p class="k">الموسوعة</p><h1>البحث</h1><p class="m">ابحث بالعنوان أو التصنيف</p></header>
  <div style="display:flex;flex-direction:column;gap:.3rem;margin:0 0 1rem">
    <input id="q" type="search" placeholder="مثال: العسل، فلسفة، موزارت…" autocomplete="off"
      style="font-family:var(--body);font-size:1.1rem;padding:.6rem .7rem;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)">
  </div>
  <p class="soft" id="count" style="color:var(--faint);font-size:.9rem"></p>
  <ul class="archive-list" id="res"></ul>
</div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
var norm=function(s){return (s||'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ً-ْ]/g,'').toLowerCase().trim();};
function readMap(){try{return JSON.parse(localStorage.getItem('enc-read')||'{}');}catch(e){return {};}}
var R=readMap();
var DATA=[];fetch('index.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){DATA=j.articles||[];run();});
function run(){var q=norm(document.getElementById('q').value);
 var res=DATA.filter(function(x){return !q||norm(x.title).indexOf(q)>=0||norm(x.category).indexOf(q)>=0;});
 var ul=document.getElementById('res');ul.innerHTML='';
 document.getElementById('count').textContent=res.length?('النتائج: '+arNum(res.length)):'لا نتائج';
 res.forEach(function(x){var li=document.createElement('li');var a=document.createElement('a');a.href=x.file;if(R[x.id])a.className='read';
  a.innerHTML='<span class="d">'+x.title+(R[x.id]?'<span class="readmark">✓</span>':'')+'</span><span class="t">'+x.category+' · قراءة '+arNum(x.reading_min)+' دقائق</span>';
  li.appendChild(a);ul.appendChild(li);});}
document.getElementById('q').addEventListener('input',run);
${THEMEJS}
</script></body></html>`);

// ---- علاماتي (نفس منطق الرسالة، مفاتيح enc-) ----
fs.writeFileSync(`${base}/marks.html`, `${HEAD("الموسوعة · علاماتي","")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  <nav class="nav"><a class="home" href="index.html">📚 الموسوعة</a>
    <span style="display:flex;gap:.45rem"><a href="search.html">🔍 بحث</a><a href="archive.html">☰ التصنيفات</a></span></nav>
  <header class="mast"><p class="k">الموسوعة</p><h1>علاماتي</h1><p class="m">علاماتك وتظليلاتك</p></header>
  <div id="bm"></div><div id="hl"></div>
</div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
function load(k){try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return [];}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v));}
function render(){var bm=load('enc-bookmarks'),hl=load('enc-highlights');
 var bs=document.getElementById('bm'),hs=document.getElementById('hl');
 bs.innerHTML='<div class="sect-h">العلامات ('+arNum(bm.length)+')</div>';
 if(!bm.length)bs.innerHTML+='<p style="color:var(--faint);text-align:center">لا علامات — اضغط 🔖 أثناء القراءة.</p>';
 bm.slice().reverse().forEach(function(b){var d=document.createElement('div');d.className='archive-list';
  var u=b.file+(b.page?('?pg='+b.page):'');
  d.innerHTML='<a href="'+u+'"><span class="d">'+(b.title||'موضع').replace('الموسوعة · ','')+'</span><span class="t">صفحة '+arNum(b.page||1)+'</span></a>';bs.appendChild(d);});
 hs.innerHTML='<div class="sect-h">التظليلات ('+arNum(hl.length)+')</div>';
 if(!hl.length)hs.innerHTML+='<p style="color:var(--faint);text-align:center">لا تظليلات — ظلّل نصًّا أثناء القراءة.</p>';
 hl.slice().reverse().forEach(function(h){var box=document.createElement('div');box.style.margin='0 0 1rem';
  box.innerHTML='<p style="font-size:1.05rem;line-height:1.8">«'+h.text+'»</p><div style="font-size:.85rem"><a href="'+h.file+'" style="color:var(--ink)">↩ اذهب للموضع</a></div>';hs.appendChild(box);});}
render();${THEMEJS}
</script></body></html>`);

// ---- Service Worker للقراءة دون إنترنت ----
const fonts=fs.readdirSync(`${base}/assets/fonts`).filter(f=>f.endsWith(".woff2")).map(f=>`assets/fonts/${f}`);
const CORE=["./","index.html","archive.html","category.html","search.html","marks.html",
  "manifest.json","index.json","app.webmanifest",
  `assets/style.css?v=${V}`,`assets/footnotes.js?v=${V}`,"assets/fonts.css","assets/icon.svg",
  ...fonts, ...entries.map(e=>e.file)];
fs.writeFileSync(`${base}/sw.js`, `const CACHE='enc-v${V}';
const CORE=${JSON.stringify(CORE)};
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
 e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>{const net=fetch(req).then(res=>{if(res&&res.status===200)c.put(req,res.clone());return res;}).catch(()=>hit);return hit||net;})));});
`);
console.log("✅ بُنيت", total, "مقالة + كل الصفحات + sw.js");
entries.forEach(e=>console.log("  اليوم",e.day,"|",e.category,"—",e.title));
console.log("التصنيفات:", idx.categories.length);
