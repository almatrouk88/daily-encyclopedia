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
              +'<button id="c-listen" aria-label="استمع">🔊</button>'
              +'<button id="c-set" aria-label="إعدادات">⚙</button>'
              +'<button id="c-note" aria-label="ملاحظة">📝</button>'
              +'<button id="c-cup" aria-label="حفظ الموضع للسحابة">☁↑</button>'
              +'<button id="c-cdn" aria-label="استعادة الموضع من السحابة">☁↓</button>'
              +'<button id="c-sr" aria-label="بحث">🔍</button>'
              +'<button id="c-mk" aria-label="علاماتي">✦</button>'
              +'<button id="c-ar" aria-label="الأرشيف">☰</button>';
  body.appendChild(ctl);

  // ---- إعدادات القراءة + ملاحظة شخصية + اقتباس ----
  (function(){
    var APP=FS_KEY.replace('fs','');
    var sf=localStorage.getItem(APP+'font'); if(sf==='clear') root.style.setProperty('--body','"Geeza Pro","Segoe UI",Tahoma,sans-serif');
    var sl=localStorage.getItem(APP+'lh'); if(sl) root.style.setProperty('--lh',sl);
    var panel=document.createElement('div'); panel.className='sheet'; panel.style.display='none';
    panel.innerHTML='<div class="sheet-in"><div class="sh-h">إعدادات القراءة</div>'
      +'<div class="sh-row"><span>الخطّ</span><span><button data-f="classic">كلاسيكيّ</button> <button data-f="clear">واضح</button></span></div>'
      +'<div class="sh-row"><span>تباعد الأسطر</span><span><button data-lh="1.55">مضغوط</button> <button data-lh="1.75">عادي</button> <button data-lh="2.05">مريح</button></span></div>'
      +'<button class="sh-close">تمّ</button></div>';
    body.appendChild(panel);
    var cset=document.getElementById('c-set'); if(cset) cset.addEventListener('click',function(){ panel.style.display='flex'; });
    panel.addEventListener('click',function(e){
      if(e.target===panel||(e.target.className||'').indexOf('sh-close')>=0){ panel.style.display='none'; return; }
      var b=e.target.closest('button'); if(!b) return;
      if(b.dataset.f){ if(b.dataset.f==='clear'){ root.style.setProperty('--body','"Geeza Pro","Segoe UI",Tahoma,sans-serif'); localStorage.setItem(APP+'font','clear'); } else { root.style.removeProperty('--body'); localStorage.setItem(APP+'font','classic'); } if(typeof relayout==='function') relayout(); }
      if(b.dataset.lh){ root.style.setProperty('--lh',b.dataset.lh); localStorage.setItem(APP+'lh',b.dataset.lh); if(typeof relayout==='function') relayout(); }
    });
    var NKEY=APP+'notes';
    function notes(){ try{return JSON.parse(localStorage.getItem(NKEY)||'{}');}catch(e){return {};} }
    var cnote=document.getElementById('c-note');
    function upd(){ if(cnote) cnote.textContent=(notes()[file]&&notes()[file].t)?'📝•':'📝'; }
    upd();
    var ns=document.createElement('div'); ns.className='sheet'; ns.style.display='none';
    ns.innerHTML='<div class="sheet-in"><div class="sh-h">ملاحظتي</div><textarea class="note-ta" placeholder="اكتب ملاحظتك على هذا الموضع…"></textarea><button class="sh-save">حفظ</button><button class="sh-close">إغلاق</button></div>';
    body.appendChild(ns); var ta=ns.querySelector('.note-ta');
    if(cnote) cnote.addEventListener('click',function(){ var m=notes(); ta.value=(m[file]&&m[file].t)||''; ns.style.display='flex'; setTimeout(function(){ta.focus();},50); });
    ns.addEventListener('click',function(e){
      if(e.target===ns||(e.target.className||'').indexOf('sh-close')>=0){ ns.style.display='none'; return; }
      if((e.target.className||'').indexOf('sh-save')>=0){ var m=notes(); var v=ta.value.trim();
        if(v){ m[file]={t:v,title:document.title,ts:Date.now()}; } else { delete m[file]; }
        localStorage.setItem(NKEY,JSON.stringify(m)); ns.style.display='none'; upd(); showHint('✓ حُفظت الملاحظة'); }
    });
  })();
  // ---- استمع (قراءة صوتية) ----
  (function(){
    var synth=window.speechSynthesis, speaking=false;
    var btn=document.getElementById('c-listen');
    function gather(){ var art=document.querySelector('article'); if(!art) return '';
      var c=art.cloneNode(true);
      c.querySelectorAll('.sources,.termbox,.gloss,.notes,.badges,.cright,.lbl,.lblx,.num,sup.fn').forEach(function(n){n.remove();});
      return c.textContent.replace(/\s+/g,' ').trim(); }
    if(btn) btn.addEventListener('click',function(){
      if(!synth){ showHint('التلاوة غير مدعومة على هذا الجهاز'); return; }
      if(speaking){ synth.cancel(); speaking=false; btn.textContent='🔊'; return; }
      var t=gather(); if(!t) return;
      var u=new SpeechSynthesisUtterance(t); u.lang='ar-SA'; u.rate=0.95;
      try{ var vs=synth.getVoices()||[]; var ar=vs.filter(function(v){return /^ar/i.test(v.lang);})[0]; if(ar) u.voice=ar; }catch(e){}
      u.onend=function(){ speaking=false; btn.textContent='🔊'; };
      synth.cancel(); synth.speak(u); speaking=true; btn.textContent='⏹'; showHint('▶ جارٍ التلاوة');
    });
    window.addEventListener('beforeunload',function(){ try{synth.cancel();}catch(e){} });
  })();


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

  // ---- محرّك وضع الكتاب (تقليب رأسيّ بتداخل سطرٍ واحد — بلا قصّ ولا فقد) ----
  var flow=document.querySelector('.wrap'), vp=null, pageH=0, eff=1, pages=1, cur=0, lineH=30;
  var PAGEKEY='enc-pg:'+file;
  function measureLine(){ var mx=0; ['.matn p','.bayt','.idea','.card p','.meaning p'].forEach(function(sel){
      var el=flow.querySelector(sel); if(el){ var v=parseFloat(getComputedStyle(el).lineHeight); if(v&&v>mx) mx=v; } });
    if(!mx) mx=parseFloat(getComputedStyle(document.body).lineHeight)||30; return Math.ceil(mx)+2; }
  function layout(){
    var cs=getComputedStyle(vp);
    pageH=vp.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    lineH=measureLine(); eff=Math.max(1, pageH - lineH);
    var contentH=flow.scrollHeight;
    pages=Math.max(1, Math.ceil((contentH - pageH) / eff) + 1);
    if(cur>=pages) cur=pages-1; if(cur<0) cur=0;
  }
  function saveLast(page){ try{ localStorage.setItem('enc-last', JSON.stringify(
    {file:file, page:page, title:document.title, ts:Date.now()})); }catch(e){} }
  function render(){ flow.style.setProperty('--ty',(-(cur*eff))+'px');
    ind.textContent='صفحة '+arNum(cur+1)+' / '+arNum(pages); localStorage.setItem(PAGEKEY,cur); saveLast(cur+1);
    if(cur>=pages-1) setRead(curArt,true); }
  function setPage(p){ cur=Math.max(0,Math.min(pages-1,p)); render(); }
  function pageOf(el){ var top=0,n=el; while(n&&n!==flow&&n!==document.body){ top+=(n.offsetTop||0); n=n.offsetParent; }
    return Math.max(0, Math.min(pages-1, Math.floor(top/eff))); }
  function enterPaged(){
    try{ body.classList.add('paged'); vp=document.createElement('div'); vp.id='vp';
      flow.parentNode.insertBefore(vp,flow); vp.appendChild(flow); layout();
      var saved=parseInt(localStorage.getItem(PAGEKEY)||'0',10);
      setPage(isNaN(saved)?0:saved); ind.style.display=''; handleDeepLink();
    }catch(e){ exitPaged(); }
  }
  function exitPaged(){ body.classList.remove('paged');
    if(vp){ vp.parentNode.insertBefore(flow,vp); vp.remove(); vp=null; }
    flow.style.removeProperty('--ty'); ind.style.display='none'; }
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
  sel.innerHTML='<button data-a="hl">🖊 تظليل</button><button data-a="copy">📋 اقتباس</button>'; body.appendChild(sel);
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
  var _cp=sel.querySelector('[data-a=copy]');
  if(_cp) _cp.addEventListener('click',function(e){ e.stopPropagation();
    var q='«'+sel.dataset.text+'»\n— '+document.title.replace(/^[^·]*·\s*/,'')+'\n'+location.href.split('?')[0];
    if(navigator.clipboard){ navigator.clipboard.writeText(q).then(function(){showHint('✓ نُسخ الاقتباس');},function(){showHint('تعذّر النسخ');}); }
    else showHint('النسخ غير مدعوم');
    if(window.getSelection) window.getSelection().removeAllRanges(); hideSel();
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
