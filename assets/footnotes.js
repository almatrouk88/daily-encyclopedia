// قارئ الرسالة: حواشٍ + تحكّم + وضع الكتاب + حفظ الموضع + تظليل + علامات
(function(){
  var root=document.documentElement, body=document.body;
  var FS_KEY='enc-fs', TH_KEY='enc-theme', PG_KEY='enc-paged';
  var HL_KEY='enc-highlights', BM_KEY='enc-bookmarks';
  var GAP=52;
  var file=location.pathname;
  var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]})};
  function load(k){ try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return [];} }
  function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

  // ---- إعدادات محفوظة ----
  var fs=parseInt(localStorage.getItem(FS_KEY)||'112',10);
  root.style.setProperty('--fs', fs+'%');
  var savedTheme=localStorage.getItem(TH_KEY);
  if(savedTheme) root.setAttribute('data-theme', savedTheme);
  var pagedPref=localStorage.getItem(PG_KEY);
  var paged=(pagedPref===null)?true:(pagedPref==='1');

  // ---- الحواشي ----
  document.querySelectorAll('.matn').forEach(function(matn,ai){
    var terms=matn.querySelectorAll('.g'); if(!terms.length) return;
    var ol=document.createElement('ol'); ol.className='notes';
    ol.innerHTML='<div class="nh">حواشٍ وشروح</div>';
    terms.forEach(function(t,i){
      var n=i+1, rid='r'+ai+'-'+n, fid='f'+ai+'-'+n, an=arNum(n);
      t.setAttribute('title', t.dataset.note);
      var sup=document.createElement('sup'); sup.className='fn';
      sup.innerHTML='<a id="'+rid+'" href="#'+fid+'">'+an+'</a>';
      t.after(sup);
      var li=document.createElement('li'); li.id=fid;
      li.innerHTML='<span class="fnum"><a href="#'+rid+'">'+an+'.</a></span><span><b>'+t.textContent+'</b> — '+t.dataset.note+'</span>';
      ol.appendChild(li);
    });
    var src=matn.querySelector('.src');
    if(src){ src.before(ol); } else { matn.appendChild(ol); }
  });

  // ---- تطبيق التظليلات المحفوظة (قبل تقسيم الصفحات) ----
  function articleOf(node){ var el=node.nodeType===1?node:node.parentNode; var a=el.closest?el.closest('article'):null; return a; }
  function highlightText(artEl, text){
    if(!artEl||!text) return false;
    var matn=artEl.querySelector('.matn')||artEl;
    var walker=document.createTreeWalker(matn, NodeFilter.SHOW_TEXT, null);
    var node;
    while((node=walker.nextNode())){
      var idx=node.nodeValue.indexOf(text);
      if(idx>=0){
        try{
          var r=document.createRange(); r.setStart(node, idx); r.setEnd(node, idx+text.length);
          var m=document.createElement('mark'); m.className='hl'; r.surroundContents(m); return true;
        }catch(e){ return false; }
      }
    }
    return false;
  }
  (function applySaved(){
    load(HL_KEY).filter(function(h){return h.file===file;}).forEach(function(h){
      var art=document.getElementById(h.art); if(art) highlightText(art, h.text);
    });
  })();

  // ---- شريط التحكّم (مخفيّ افتراضيًّا — يظهر بلمس منتصف الشاشة) ----
  body.classList.add('hide-ui');
  var inDays=location.pathname.indexOf('/days/')>=0, pre=inDays?'../':'';
  var old=document.getElementById('tt'); if(old) old.remove();
  var ctl=document.createElement('div'); ctl.className='ctl';
  ctl.innerHTML='<button id="c-top" aria-label="البداية">⤒</button>'
              +'<button id="c-read" aria-label="تعليم مقروءة">○</button>'
              +'<button id="c-pg" aria-label="وضع الكتاب">▤</button>'
              +'<button id="c-bm" aria-label="علامة الصفحة">🔖</button>'
              +'<button id="c-th" aria-label="الوضع الليلي">◐</button>'
              +'<button id="c-dn" aria-label="تصغير الخط">A−</button>'
              +'<button id="c-up" aria-label="تكبير الخط">A+</button>'
              +'<button id="c-cup" aria-label="حفظ الموضع للسحابة">☁↑</button>'
              +'<button id="c-cdn" aria-label="استعادة الموضع من السحابة">☁↓</button>'
              +'<button id="c-sr" aria-label="بحث">🔍</button>'
              +'<button id="c-mk" aria-label="علاماتي">✦</button>'
              +'<button id="c-ar" aria-label="الأرشيف">☰</button>';
  body.appendChild(ctl);

  // ---- نظام «مقروء» ----
  var READ_KEY='enc-read';
  var curArt=(document.querySelector('article')||{}).id||'';
  function readMap(){ try{return JSON.parse(localStorage.getItem(READ_KEY)||'{}');}catch(e){return {};} }
  function isRead(id){ return !!readMap()[id]; }
  function setRead(id,val){ if(!id) return; var m=readMap(); if(val){ if(!m[id]) m[id]=Date.now(); } else delete m[id];
    localStorage.setItem(READ_KEY, JSON.stringify(m)); updateReadBtn(); }
  function updateReadBtn(){ var b=document.getElementById('c-read'); if(b) b.textContent=isRead(curArt)?'✓':'○'; }
  var cread=document.getElementById('c-read');
  if(cread){ cread.addEventListener('click',function(){ var now=!isRead(curArt); setRead(curArt, now);
    showHint(now?'✓ عُلّمت مقروءة':'أُزيلت علامة القراءة'); }); }
  updateReadBtn();

  var SYNC='https://kvdb.io/Hj8v3hbdFx6wBP8hrRyaUk/enc_pos';
  document.getElementById('c-cup').addEventListener('click',function(){
    var last=localStorage.getItem('enc-last')||JSON.stringify({file:file,page:(paged?cur+1:1),title:document.title,ts:Date.now()});
    showHint('☁ جارٍ الحفظ…');
    fetch(SYNC,{method:'PUT',headers:{'Content-Type':'application/json'},body:last})
      .then(function(r){ showHint(r.ok?'☁ حُفظ موضعك للسحابة':'تعذّر الحفظ'); })
      .catch(function(){ showHint('تعذّر الاتصال بالسحابة'); });
  });
  document.getElementById('c-cdn').addEventListener('click',function(){
    showHint('☁ جارٍ الاستعادة…');
    fetch(SYNC,{cache:'no-store'}).then(function(r){return r.json();}).then(function(p){
      if(p&&p.file){ location.href='/daily-encyclopedia/'+p.file+'?pg='+(p.page||1); }
      else showHint('لا يوجد موضع محفوظ');
    }).catch(function(){ showHint('تعذّر الاتصال بالسحابة'); });
  });
  document.getElementById('c-sr').addEventListener('click',function(){ location.href=pre+'search.html'; });
  document.getElementById('c-mk').addEventListener('click',function(){ location.href=pre+'marks.html'; });
  document.getElementById('c-ar').addEventListener('click',function(){ location.href=pre+'archive.html'; });
  document.getElementById('c-top').addEventListener('click',function(){
    if(paged) setPage(0); else window.scrollTo(0,0); showHint('⤒ البداية'); });

  var hint=document.createElement('div'); hint.className='taphint'; body.appendChild(hint);
  var hintT;
  function showHint(msg){ hint.textContent=msg; hint.classList.add('show'); clearTimeout(hintT);
    hintT=setTimeout(function(){ hint.classList.remove('show'); },1100); }
  var ind=document.createElement('div'); ind.className='pageind'; body.appendChild(ind);

  // ---- محرّك وضع الكتاب ----
  var flow=document.querySelector('.wrap'), vp=null, step=0, pages=1, cur=0;
  var PAGEKEY='enc-pg:'+file;
  function layout(){
    // ارتفاع الصفحة = أكبر مضاعف تامّ لسطرٍ كامل ≤ المساحة (فلا يُقصّ أيّ سطر مهما كبّرت الخط)
    var cs=getComputedStyle(vp);
    var avail=vp.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var p=flow.querySelector('.matn p');
    var lh=p?parseFloat(getComputedStyle(p).lineHeight):0;
    if(!lh||isNaN(lh)) lh=parseFloat(getComputedStyle(document.body).lineHeight)||28;
    var h=Math.max(lh, Math.floor(avail/lh)*lh);
    flow.style.height=h+'px';
    flow.style.columnFill='auto';
    var colW=flow.clientWidth; flow.style.columnWidth=colW+'px';
    step=colW+GAP; pages=Math.max(1, Math.round((flow.scrollWidth+GAP)/step));
  }
  function saveLast(page){ try{ localStorage.setItem('enc-last', JSON.stringify(
    {file:file, page:page, title:document.title, ts:Date.now()})); }catch(e){} }
  function render(){ flow.style.setProperty('--px',(cur*step)+'px');
    ind.textContent='صفحة '+arNum(cur+1)+' / '+arNum(pages); localStorage.setItem(PAGEKEY,cur); saveLast(cur+1);
    if(cur>=pages-1) setRead(curArt,true); }
  function setPage(p){ cur=Math.max(0,Math.min(pages-1,p)); render(); }
  function pageOf(el){ for(var p=0;p<pages;p++){ cur=p; flow.style.setProperty('--px',(p*step)+'px');
      var r=el.getBoundingClientRect(); if(r.right>0 && r.left<window.innerWidth) return p; } return 0; }
  function enterPaged(){
    try{ body.classList.add('paged'); vp=document.createElement('div'); vp.id='vp';
      flow.parentNode.insertBefore(vp,flow); vp.appendChild(flow); layout();
      var saved=parseInt(localStorage.getItem(PAGEKEY)||'0',10);
      setPage(isNaN(saved)?0:saved); ind.style.display=''; handleDeepLink();
    }catch(e){ exitPaged(); }
  }
  function exitPaged(){ body.classList.remove('paged');
    if(vp){ vp.parentNode.insertBefore(flow,vp); vp.remove(); vp=null; }
    flow.style.removeProperty('--px'); flow.style.removeProperty('column-width');
    flow.style.removeProperty('height'); flow.style.removeProperty('column-fill'); ind.style.display='none'; }
  function relayout(){ if(!paged) return; var c=cur; layout(); setPage(c); }
  function handleDeepLink(){
    var q=new URLSearchParams(location.search);
    var art=q.get('art'), pg=q.get('pg');
    if(art){ var el=document.getElementById(art); if(el){ setPage(pageOf(el)); return; } }
    if(pg){ var n=parseInt(pg,10); if(!isNaN(n)) setPage(n-1); }
  }

  // ---- الأزرار ----
  function setFs(v){ fs=Math.max(80,Math.min(360,v)); root.style.setProperty('--fs',fs+'%'); localStorage.setItem(FS_KEY,fs); relayout(); }
  document.getElementById('c-up').addEventListener('click',function(){ setFs(fs+12); });
  document.getElementById('c-dn').addEventListener('click',function(){ setFs(fs-12); });
  document.getElementById('c-th').addEventListener('click',function(){
    var t=root.getAttribute('data-theme'); var dark=t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
    var next=dark?'light':'dark'; root.setAttribute('data-theme',next); localStorage.setItem(TH_KEY,next); });
  document.getElementById('c-pg').addEventListener('click',function(){
    paged=!paged; localStorage.setItem(PG_KEY,paged?'1':'0');
    if(paged){ enterPaged(); showHint('وضع الكتاب'); } else { exitPaged(); showHint('وضع التمرير'); } });
  document.getElementById('c-bm').addEventListener('click',function(){
    var arts=document.querySelectorAll('article'); var title=document.title;
    // المقالة الظاهرة حاليًا
    var vis=null; arts.forEach(function(a){ if(vis)return; var r=a.getBoundingClientRect();
      if(paged){ if(r.right>0 && r.left<window.innerWidth) vis=a; } else { if(r.top<window.innerHeight*0.5 && r.bottom>0) vis=a; } });
    var h2=vis?vis.querySelector('h2'):null;
    var bm=load(BM_KEY);
    bm.push({ file:file, art:vis?vis.id:'', page:paged?cur+1:0,
      title:(h2?h2.textContent:document.title), day:(document.title||''), ts:Date.now() });
    save(BM_KEY,bm); showHint('✓ حُفظت علامة');
  });

  // ---- اللمس ----
  function toggleUI(){ body.classList.toggle('hide-ui');
    showHint(body.classList.contains('hide-ui')?'وضع القراءة':'الأدوات ظاهرة'); }
  document.addEventListener('click', function(e){
    if(e.target.closest('.seltool')) return;
    var fn=e.target.closest('sup.fn a, .notes .fnum a'); if(fn){ if(paged) e.preventDefault(); return; }
    if(e.target.closest('a,button')) return;
    if(window.getSelection && String(window.getSelection()).length>0) return; // لا تقلب أثناء التحديد
    var w=window.innerWidth, x=e.clientX;
    if(paged){ if(x<w*0.35) setPage(cur+1); else if(x>w*0.65) setPage(cur-1); else toggleUI(); }
    else { var pg=Math.round(window.innerHeight*0.88);
      if(x<w*0.35) window.scrollBy(0,pg); else if(x>w*0.65) window.scrollBy(0,-pg); else toggleUI(); }
  });

  // ---- أداة التظليل عند تحديد النص ----
  var sel=document.createElement('div'); sel.className='seltool';
  sel.innerHTML='<button data-a="hl">🖊 تظليل</button>'; body.appendChild(sel);
  function hideSel(){ sel.classList.remove('show'); }
  function onSelect(){
    var s=window.getSelection(); var txt=s?String(s).trim():'';
    if(!txt || txt.length<2){ hideSel(); return; }
    var art=articleOf(s.getRangeAt(0).commonAncestorContainer);
    if(!art){ hideSel(); return; }
    var r=s.getRangeAt(0).getBoundingClientRect();
    sel.style.top=Math.max(6, r.top-46)+'px';
    sel.style.left=Math.min(window.innerWidth-140, Math.max(6, r.left+r.width/2-60))+'px';
    sel.dataset.art=art.id; sel.dataset.text=txt; sel.classList.add('show');
  }
  document.addEventListener('mouseup', function(){ setTimeout(onSelect,10); });
  document.addEventListener('touchend', function(){ setTimeout(onSelect,10); });
  sel.querySelector('[data-a=hl]').addEventListener('click', function(e){
    e.stopPropagation();
    var art=document.getElementById(sel.dataset.art), txt=sel.dataset.text;
    var hl=load(HL_KEY); hl.push({file:file, art:sel.dataset.art, text:txt, ts:Date.now()}); save(HL_KEY,hl);
    highlightText(art, txt);
    if(window.getSelection) window.getSelection().removeAllRanges();
    hideSel(); relayout(); showHint('✓ حُفظ التظليل');
  });

  window.addEventListener('resize', relayout);
  ['fullscreenchange','webkitfullscreenchange'].forEach(function(ev){
    document.addEventListener(ev, function(){ var f=document.fullscreenElement||document.webkitFullscreenElement;
      body.classList.toggle('hide-ui', !!f); setTimeout(relayout,60); }); });

  // ---- تشغيل ----
  if(paged){ ind.style.display=''; enterPaged(); } else { ind.style.display='none'; handleDeepLink(); saveLast(1); }
  var slT; window.addEventListener('scroll', function(){ if(paged) return; clearTimeout(slT); slT=setTimeout(function(){ saveLast(1);
    if(window.innerHeight+window.scrollY >= document.body.scrollHeight-90) setRead(curArt,true); }, 500); });
  hint.textContent='المس منتصف الشاشة لإظهار الأدوات'; hint.classList.add('show');
  setTimeout(function(){ hint.classList.remove('show'); }, 2600);
})();
