(function(){
"use strict";
var D = window.PRACTICE_DATA, app = document.getElementById("app");
var KEY_H = "p5zr_history", KEY_W = "p5zr_wrongbook", KEY_SEEN = "p5zr_seen", SEEN_ROUNDS = 3, ROUND = 8;
var GEN = window.PRACTICE_GEN || null;
function load(k, d){ try{ var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }catch(e){ return d; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function shuffle(a){ a = a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function el(html){ SP.close(); app.innerHTML = html; app.focus(); window.scrollTo(0,0); }
function subj(id){ return D.subjects.filter(function(s){return s.id===id;})[0]; }
function unit(s,id){ return s.units.filter(function(u){return u.id===id;})[0]; }
function today(){ var d=new Date(); return d.getFullYear()+"/"+(d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }
function toast(m){ var t=document.getElementById("toast"); t.textContent=m; t.classList.add("show"); setTimeout(function(){t.classList.remove("show");},1800); }
function celebrate(){ var c=document.createElement("div"); c.className="celebrate"; c.setAttribute("aria-hidden","true");
  for(var i=0;i<12;i++){ var s=document.createElement("span"); s.textContent=["⭐","🌟","✨","🎉"][i%4]; s.style.left=(Math.random()*95)+"%"; s.style.animationDelay=(Math.random()*.4)+"s"; c.appendChild(s); }
  document.body.appendChild(c); setTimeout(function(){c.remove();},2000); }
var CHEER=["太棒了！","答對了，好厲害！","你真會想！","完全正確！⭐","好聰明喔！"];
var ENC=["沒關係，再想一想！","差一點點，加油！","慢慢來，你可以的！"];
function canSpeak(){ return "speechSynthesis" in window && typeof SpeechSynthesisUtterance!=="undefined"; }
function speak(t){ try{ var ss=window.speechSynthesis; ss.cancel(); var u=new SpeechSynthesisUtterance(t); u.lang="en-US"; u.rate=0.8;
  var v=(ss.getVoices()||[]).filter(function(x){return /^en/i.test(x.lang);})[0]; if(v) u.voice=v; ss.speak(u); }catch(e){ toast("這台裝置不能唸喔"); } }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function tap(el, fn){
  var stamp=0;
  function go(){ var n=Date.now(); if(n-stamp<450) return; stamp=n; fn(); }
  el.addEventListener("pointerup", function(e){ if(e.pointerType==="mouse"||e.button>0) return; go(); });
  el.addEventListener("click", go);
}

// ---------- 首頁 ----------
function home(){
  var wb = load(KEY_W, []);
  var h = '<p class="greet">嗨，芷媃！五年級的你越來越厲害了，今天想挑戰什麼呢？💪😊</p><div class="grid">';
  D.subjects.forEach(function(s){ h += '<button class="big subject'+(s.featured?' exam':'')+'" style="--uc:'+s.color+'" data-s="'+s.id+'"><span aria-hidden="true">'+s.icon+'</span> '+esc(s.name)+'</button>'; });
  h += '</div><div class="row"><button class="big secondary" id="wbBtn">📒 我的錯題本（'+wb.length+'）</button><button class="big secondary" id="parentBtn">👪 家長區</button></div>';
  el(h);
  app.querySelectorAll("[data-s]").forEach(function(b){ b.onclick=function(){ units(b.dataset.s); }; });
  document.getElementById("wbBtn").onclick=wrongbook;
  document.getElementById("parentBtn").onclick=parent;
}
function units(sid){
  var s=subj(sid), h='<h2>'+s.icon+' '+esc(s.name)+'</h2><p class="muted">選一個單元開始，每回合最多 '+ROUND+' 題（打字題組約 16 題）。</p><div class="grid">';
  s.units.forEach(function(u){ h+='<button class="big'+(u.color?' unitc':'')+'"'+(u.color?' style="--uc:'+u.color+'"':'')+' data-u="'+u.id+'">'+esc(u.name)+' <span class="muted">（'+(u.gen?'🎲 隨機出題':u.questions.length+'題')+'）</span></button>'; });
  el(h+'</div><div class="row"><button class="big secondary" id="back">⬅ 回首頁</button></div>');
  app.querySelectorAll("[data-u]").forEach(function(b){ b.onclick=function(){
    var u=unit(s,b.dataset.u);
    var items=drawItems(s,u);
    start(s.name, u.name, items, false);
  }; });
  document.getElementById("back").onclick=home;
}
// 抽題：u.round 指定題數（預設 ROUND）；q.weight 越大越容易被抽到（不重複抽）
// 隨機出題單元（u.gen）：每題現場產生，題目整份存進 item.q
// 固定題庫：避開最近 SEEN_ROUNDS 回合出現過的題目；不夠時用「最久沒出現」的補
function seenAll(){ var v=load(KEY_SEEN,{}); return v&&typeof v==="object"&&!Array.isArray(v)?v:{}; }
function markSeen(items){ var all=seenAll(), by={};
  items.forEach(function(it){ if(it.q||it.idx==null) return; (by[it.uid]=by[it.uid]||[]).push(it.idx); });
  Object.keys(by).forEach(function(uid){ var r=Array.isArray(all[uid])?all[uid]:[]; r.push(by[uid]); all[uid]=r.slice(-SEEN_ROUNDS); });
  save(KEY_SEEN, all); }
function drawGen(s,u,k){ var outG=[], texts={}, guard=0;
  if(!GEN||!u.gen||!k) return outG;
  while(outG.length<k && guard++<k*20){ var gid=u.gen[Math.floor(Math.random()*u.gen.length)], q;
    try{ q=GEN.make(gid); }catch(e){ continue; }
    if(texts[q.q]) continue; texts[q.q]=1; outG.push({sid:s.id,uid:u.id,uname:u.name,sname:s.name,q:q}); }
  return outG; }
function drawBank(s,u,k){
  var qs=u.questions||[]; if(!qs.length||k<=0) return [];
  var rounds=(seenAll()[u.id]||[]), age={};
  rounds.forEach(function(r,ri){ (r||[]).forEach(function(i){ age[i]=ri+1; }); }); // 越新的回合數字越大
  var all=qs.map(function(q,i){ return {sid:s.id,uid:u.id,idx:i,w:q.weight||1,age:age[i]||0}; }), need=Math.min(k,all.length);
  var fresh=all.filter(function(p){return !p.age;});
  if(fresh.length<need){ var old=shuffle(all.filter(function(p){return p.age;})).sort(function(a,b){return a.age-b.age;});
    var outF=fresh.length?wDraw(fresh,fresh.length):[];
    return shuffle(outF.concat(old.slice(0,need-outF.length).map(function(it){return {sid:it.sid,uid:it.uid,idx:it.idx};}))); }
  return wDraw(fresh,need);
}
function drawItems(s,u){
  var k=u.round||ROUND, hasG=u.gen&&GEN, hasB=u.questions&&u.questions.length;
  if(hasG&&hasB){ var nG=Math.min(Math.ceil(k/2),k); var g=drawGen(s,u,nG); return shuffle(g.concat(drawBank(s,u,k-g.length))); }
  if(hasG) return drawGen(s,u,k);
  return drawBank(s,u,k);
}
function wDraw(pool,k){
  pool=pool.slice(); var out=[];
  while(out.length<k){ var t=0; pool.forEach(function(p){t+=p.w;}); var r=Math.random()*t, j=0;
    for(;j<pool.length-1;j++){ r-=pool[j].w; if(r<0) break; }
    var it=pool.splice(j,1)[0]; out.push({sid:it.sid,uid:it.uid,idx:it.idx}); }
  return out;
}
// 打字題：比對（不分大小寫、去頭尾空白、多個空白算一個）
function normT(a){ return String(a).toLowerCase().trim().replace(/\s+/g," "); }

function toHalfWidth(s){
  return String(s==null?"":s).replace(/[０-９]/g,function(c){ return String.fromCharCode(c.charCodeAt(0)-65280+32); })
    .replace(/[／⁄∕]/g,"/").replace(/[：﹕]/g,":").replace(/[－—–−]/g,"-")
    .replace(/[，]/g,",").replace(/[（]/g,"(").replace(/[）]/g,")").replace(/[＝=]/g,"=").replace(/[×ｘxX]/g,"x");
}
function fillCompact(s){
  return toHalfWidth(s).replace(/\s+/g,"").replace(/度/g,"").replace(/°/g,"")
    .replace(/個$/g,"").replace(/人$/g,"").replace(/元$/g,"").replace(/題$/g,"");
}
function fillFrac(s){
  s=fillCompact(s);
  var m=/^(\-?\d+)又(\d+)\/(\d+)$/.exec(s); if(m) return [+m[1]*+m[3]+ +m[2], +m[3]];
  m=/^(\-?\d+)\/(\d+)$/.exec(s); if(m) return [+m[1], +m[2]];
  return null;
}
function fillSame(a,b){
  a=fillCompact(a); b=fillCompact(b);
  if(!a||!b) return false;
  if(a===b) return true;
  if(a.toLowerCase()===b.toLowerCase()) return true;
  var fa=fillFrac(a), fb=fillFrac(b);
  if(fa&&fb&&fa[1]&&fb[1]&&fa[0]*fb[1]===fb[0]*fa[1]) return true;
  // 11月9日20:30 ↔ 11/9 20:30
  var da=a.replace(/月/g,"/").replace(/日/g,""), db=b.replace(/月/g,"/").replace(/日/g,"");
  if(da===db) return true;
  // 比大小 d<c<b<a 允許去掉空格已處理
  return false;
}
function judgeFill(q,a){
  var cands=[String(q.answer)].concat(q.accept||[]), all=[];
  cands.forEach(function(s){ String(s).split(/\s*或\s*/).forEach(function(p){ if(p.trim()) all.push(p.trim()); }); });
  for(var i=0;i<all.length;i++) if(fillSame(a, all[i])) return {ok:true};
  return {ok:false};
}
function judgeText(q,a){
  var x=normT(a), acc=[q.answer].concat(q.accept||[]).map(normT);
  if(acc.indexOf(x)>=0) return {ok:true};
  if(acc.some(function(c){ return c.indexOf("-")>=0 && c.replace(/-/g," ")===x; })) return {ok:true, note:"答對了！不過標準寫法要用連字號「-」："+q.answer};
  return {ok:false};
}
function diffHTML(a,ans){ var x=normT(a), y=normT(ans), h="";
  for(var i=0;i<x.length;i++){ var c=esc(x[i]===" "?"␣":x[i]); h+= x[i]===y[i] ? c : '<b class="bad">'+c+'</b>'; }
  return '<span class="diff">'+h+'</span>'+(x.length<y.length?' <span class="muted">（還少了 '+(y.length-x.length)+' 個字母）</span>':x.length>y.length?' <span class="muted">（多了 '+(x.length-y.length)+' 個字母）</span>':''); }
function findArchived(uid,sid){ var A=window.PRACTICE_ARCHIVE||[], hit=null;
  for(var i=0;i<A.length;i++){ if(A[i].id!==uid) continue; if(sid&&A[i].sids&&A[i].sids.indexOf(sid)>=0) return A[i]; if(!hit) hit=A[i]; }
  return hit; }
function getQ(it){ if(!it) return null; var s=subj(it.sid), u=s&&unit(s,it.uid);
  if(!u){ var a=findArchived(it.uid,it.sid); if(a){ u=a; s=s||{id:it.sid,name:(a.snames&&a.snames[it.sid])||it.sname||a.name||""}; } }
  if(it.q) return {q:it.q, u:u||{name:it.uname||"隨機題"}, s:s||{name:it.sname||""}};
  return u&&u.questions&&u.questions[it.idx] ? {q:u.questions[it.idx], u:u, s:s} : null; }
function itKey(it){ return it.q ? it.sid+"|"+it.uid+"|g|"+it.q.q : it.sid+"|"+it.uid+"|"+it.idx; }
function itCopy(w){ var o={sid:w.sid,uid:w.uid}; if(w.q){ o.q=w.q; o.uname=w.uname; o.sname=w.sname; } else o.idx=w.idx; return o; }

// ---------- 作答 ----------
var R;
function start(sname, uname, items, isWB){
  items=items.filter(getQ);
  if(!items.length){ toast("沒有題目喔"); return home(); }
  R={sname:sname,uname:uname,items:items,i:0,results:[],isWB:isWB}; showQ();
}
function showQ(){
  var it=R.items[R.i], g=getQ(it), q=g.q, n=R.items.length;
  R.cur={tries:[],done:false};
  var curPct=Math.max(0,Math.min(100,R.i/n*100)), prevPct=R.i>0?Math.max(0,Math.min(100,(R.i-1)/n*100)):0;
  var h='<div class="muted'+(g.u.color?' tag" style="--uc:'+g.u.color:'')+'">'+esc(g.s.name)+'・'+esc(g.u.name)+'　第 '+(R.i+1)+' / '+n+' 題</div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+n+'" aria-valuenow="'+R.i+'" style="--p:'+prevPct+'%"><div></div><span class="pchick" aria-hidden="true"><span class="pchick-i">🐥</span></span></div><div class="quiz"'+(g.u.color?' style="--uc:'+g.u.color+'"':'')+'><div>';
  var pg=q.passage||g.u.passage; if(pg) h+='<div class="passage" tabindex="0" aria-label="短文">'+esc(pg)+'</div>';
  h+='<div class="card"><div class="qtext" id="qt">'+esc(q.q)+'</div>'+(q.fig?'<div class="qfig">'+q.fig+'</div>':'')+(q.say&&canSpeak()?'<button class="big secondary say" id="sayBtn" aria-label="唸給我聽"'+(q.sayAfter?' hidden':'')+'>🔊 唸給我聽</button>':'')+'</div></div><div>';
  if(q.type==="mc"){
    h+='<div class="options" role="group" aria-labelledby="qt">';
    shuffle(q.options).forEach(function(o){ h+='<button class="big opt" data-o="'+esc(o)+'">'+esc(o)+'</button>'; });
    h+='</div>';
  } else if(q.type==="text"){
    h+='<form id="tform" class="tform" autocomplete="off"><input id="tin" class="tin" type="text" aria-label="輸入英文" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="在這裡輸入英文"><button type="submit" class="big primary" id="tok">✔ 送出</button></form>';
  } else if(q.type==="fill"){
    h+='<form id="tform" class="tform fillform" autocomplete="off"><input id="tin" class="tin filltin" type="text" inputmode="text" aria-label="輸入答案" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="請輸入答案"><button type="submit" class="big primary" id="tok">✔ 送出</button></form>';
    h+='<div class="keypad fillpad" aria-label="答案快捷鍵">';
    ["1","2","3","4","5","6","7","8","9","0",".","/","：","-","、","(",")","空白","⌫"].forEach(function(k){
      var lab=k==="⌫"?"刪除":k==="空白"?"空格":k==="："?"冒號":k;
      h+='<button type="button" data-fk="'+k+'" aria-label="'+lab+'">'+k+'</button>';
    });
    h+='</div>';
  } else {
    h+='<div class="display" id="disp" aria-live="polite" aria-label="你的答案"></div><div class="keypad">';
    ["1","2","3","4","5","6","7","8","9","⌫","0","✔"].forEach(function(k){
      var lab = k==="⌫"?"刪除":k==="✔"?"送出":k;
      h+='<button data-k="'+k+'" aria-label="'+lab+'"'+(k==="✔"?' class="ok"':'')+'>'+k+'</button>'; });
    h+='</div>';
  }
  h+='<div id="fb"></div><div class="row" id="nextRow"></div></div></div>';
  el(h);
  var pg=app.querySelector(".progress"); if(pg){ if(prevPct===curPct) pg.style.setProperty("--p",curPct+"%"); else requestAnimationFrame(function(){ requestAnimationFrame(function(){ pg.style.setProperty("--p",curPct+"%"); pg.classList.add("walking"); setTimeout(function(){ pg.classList.remove("walking"); },600); }); }); }
  var sb=document.getElementById("sayBtn"); if(sb) sb.onclick=function(){ speak(q.say); };
  SP.reset(); if(g.u.scratch){ var spb=document.createElement("button"); spb.className="big secondary spbtn"; spb.id="spBtn"; spb.innerHTML="📝 計算紙"; tap(spb, SP.toggle); document.querySelector(".quiz .card").appendChild(spb); }
  if(q.type==="mc"){
    app.querySelectorAll(".opt").forEach(function(b){ b.onclick=function(){ if(R.cur.done||b.disabled) return; answer(b.dataset.o, b); }; });
  } else if(q.type==="text"||q.type==="fill"){
    var tin=document.getElementById("tin");
    document.getElementById("tform").onsubmit=function(e){ e.preventDefault(); if(R.cur.done) return; if(!tin.value.trim()){ toast(q.type==="fill"?"先輸入答案喔":"先輸入英文喔"); return; } answer(tin.value, null); };
    app.querySelectorAll("[data-fk]").forEach(function(b){ b.onclick=function(){
      if(R.cur.done) return; var k=b.dataset.fk;
      if(k==="⌫") tin.value=tin.value.slice(0,-1);
      else if(k==="空白") tin.value+=" ";
      else if(tin.value.length<32) tin.value+=k;
      tin.focus();
    }; });
    tin.focus();
  } else {
    var disp=document.getElementById("disp"), val="";
    app.querySelectorAll("[data-k]").forEach(function(b){ b.onclick=function(){
      if(R.cur.done) return; var k=b.dataset.k;
      if(k==="⌫") val=val.slice(0,-1);
      else if(k==="✔"){ if(!val){ toast("先按數字喔"); return; } answer(String(parseInt(val,10)), null); val=""; }
      else if(val.length<6) val=(val==="0"?"":val)+k;
      if(!R.cur.done) disp.textContent=val;
    }; });
  }
}
function answer(a, btn){
  var g=getQ(R.items[R.i]), q=g.q, fb=document.getElementById("fb"), jt=q.type==="text"?judgeText(q,a):q.type==="fill"?judgeFill(q,a):{ok:a===String(q.answer)}, ok=jt.ok;
  R.cur.tries.push(a);
  if(ok){
    R.cur.done=true; if(btn) btn.classList.add("right");
    if(q.type==="num") document.getElementById("disp").textContent=a;
    celebrate();
    fb.innerHTML='<div class="feedback good pop"><b>🎉 '+pick(CHEER)+'</b>'+(jt.note?'<br>📌 '+esc(jt.note):'')+explainHTML(q)+'</div>';
    finishQ(true);
  } else if(R.cur.tries.length===1){
    if(btn){ btn.classList.add("wrong"); btn.disabled=true; }
    fb.innerHTML='<div class="feedback hint">💪 '+pick(ENC)+(q.type==="text"?'<br>你寫的：'+diffHTML(a,q.answer)+'<br><span class="muted">紅色是寫錯的字母</span>':'')+'<br>💡 提示：'+esc(q.hint)+'<br><span class="muted">（再試一次）</span></div>';
    if(q.type==="num") document.getElementById("disp").textContent="";
    if(q.type==="text"||q.type==="fill"){ var ti=document.getElementById("tin"); ti.value=""; ti.focus(); }
  } else {
    R.cur.done=true; if(btn) btn.classList.add("wrong");
    app.querySelectorAll(".opt").forEach(function(b){ if(b.dataset.o===String(q.answer)) b.classList.add("right"); });
    if(q.type==="num") document.getElementById("disp").textContent=a+" → "+q.answer;
    fb.innerHTML='<div class="feedback explain">🌈 沒關係，我們一起看看怎麼想：<br>'+(q.type==="text"?'你寫的：'+diffHTML(a,q.answer)+'<br>':q.type==="fill"?'你寫的：<b>'+esc(a)+'</b><br>':'')+'正確答案是 <b>'+esc(q.answer)+'</b>'+explainHTML(q)+'</div>';
    finishQ(false);
  }
}
function explainHTML(q){ return '<ol>'+q.explain.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'; }
function finishQ(correct){ var tf=document.getElementById("tin"); if(tf){ tf.disabled=true; var tk=document.getElementById("tok"); if(tk) tk.disabled=true; } var sbt=document.getElementById("sayBtn"); if(sbt) sbt.hidden=false;
  var it=R.items[R.i], g=getQ(it), firstTry=correct&&R.cur.tries.length===1;
  R.results.push({it:it, q:g.q.q, unit:g.u.name, tries:R.cur.tries.slice(), answer:String(g.q.answer), correct:correct, firstTry:firstTry});
  // 錯題本
  var wb=load(KEY_W,[]), key=itKey(it), pos=-1;
  wb.forEach(function(w,i){ if(w.key===key) pos=i; });
  if(!firstTry && pos<0){ var ent=itCopy(it); ent.key=key; ent.date=today(); wb.push(ent); }
  if(firstTry && R.isWB && pos>=0) wb.splice(pos,1);
  save(KEY_W,wb);
  var last=R.i===R.items.length-1;
  var nr=document.getElementById("nextRow");
  nr.innerHTML='<button class="big primary" id="next">'+(last?"看成績 🏁":"下一題 ➡")+'</button>';
  var nb=document.getElementById("next"); nb.focus();
  nb.onclick=function(){ if(last) end(); else { R.i++; showQ(); } };
}

// ---------- 送給媽媽（Google 表單；離線先排進 p5zr_outbox） ----------
var KEY_OUT = "p5zr_outbox", OUTBOX_MAX = 50;
var FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdBJyTLSLXI6ZvVMOne2_1jqBL266GRXtXdRUGxiDfruydVKA/formResponse";
var outbox = null, flushChain = Promise.resolve();
function sentAt(d){ d=d||new Date(); function p(n){ return String(n).padStart(2,"0"); }
  return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); }
function queue(){ if(!outbox){ var q=load(KEY_OUT,[]); outbox=Array.isArray(q)?q:[]; } return outbox; }
function persistOut(){ save(KEY_OUT, queue()); }
function trimQ(s){ s=String(s).replace(/\s+/g," ").trim(); return s.length>60?s.slice(0,60):s; }
function herAnswer(r){ var tries=r.tries||[]; if(!tries.length) return ""; return String(r.correct?tries[0]:tries[tries.length-1]); }
function mistakeLines(results){
  var lines=[];
  results.forEach(function(r){ if(r.firstTry) return;
    lines.push(r.it.uid+"#"+(r.it.q?"隨機":(r.it.idx+1))+"｜"+trimQ(r.q)+"｜她答："+herAnswer(r)+"｜正解："+r.answer); });
  return lines.length?lines.join("\n"):"全對";
}
function subjectLabel(){
  if(!R.isWB) return R.sname;
  var names=[], seen={};
  R.results.forEach(function(r){ var g=getQ(r.it), n=g&&g.s?g.s.name:""; if(n&&!seen[n]){ seen[n]=1; names.push(n); } });
  return names.join("、")||R.sname;
}
function roundFields(right, n){
  return {
    "entry.648531033":"芷媃",
    "entry.1291387086":sentAt(new Date()),
    "entry.130022767":subjectLabel(),
    "entry.822327708":R.uname,
    "entry.1811768317":right+"/"+n,
    "entry.1816962498":mistakeLines(R.results)
  };
}
function postForm(fields){
  if(typeof fetch!=="function"||typeof URLSearchParams!=="function") return Promise.reject(new Error("no fetch"));
  return fetch(FORM_URL,{method:"POST",mode:"no-cors",body:new URLSearchParams(fields)});
}
function drain(){
  var q=queue(); if(!q.length) return Promise.resolve(true);
  var item=q[0];
  return postForm(item.fields).then(function(){
    var i=-1; queue().forEach(function(x,idx){ if(x.id===item.id) i=idx; });
    if(i>=0) queue().splice(i,1);
    persistOut();
    return drain();
  }, function(){ return false; });
}
function flushOutbox(){
  var run=flushChain.then(drain, drain);
  flushChain=run.then(function(){}, function(){});
  return run;
}
function enqueueAndSend(fields){
  var item={id:String(Date.now())+"-"+Math.random().toString(36).slice(2), fields:fields};
  var q=queue(); q.push(item); if(q.length>OUTBOX_MAX) outbox=q.slice(q.length-OUTBOX_MAX);
  persistOut();
  var id=item.id;
  return flushOutbox().then(function(){ return queue().every(function(x){ return x.id!==id; }); });
}
function showSendStatus(ok){
  var el=document.getElementById("sendStat"); if(!el) return;
  el.textContent=ok?"📨 已送給媽媽":"📨 稍後自動補送";
}

// ---------- 結算 ----------
function end(){
  var n=R.results.length, right=R.results.filter(function(r){return r.correct;}).length, first=R.results.filter(function(r){return r.firstTry;}).length;
  var stars = first===n?3 : first/n>=0.7?2 : right/n>=0.5?1 : 0;
  var wrong=R.results.filter(function(r){return !r.firstTry;});
  if(!R.isWB) markSeen(R.items);
  var rec={date:today(), subject:R.sname, unit:R.uname, total:n, right:right, first:first, stars:stars,
    wrong:wrong.map(function(r){return {q:r.q,tries:r.tries,answer:r.answer,unit:r.unit};})};
  var hist=load(KEY_H,[]); hist.unshift(rec); save(KEY_H,hist.slice(0,50));
  var h='<div class="card" style="text-align:center"><h2>'+(stars>=2?"🎊 做得好！":"👍 繼續加油！")+'</h2><div class="stars pop" aria-label="'+stars+'顆星">'+"⭐".repeat(stars)+"☆".repeat(3-stars)+'</div>'+
    '<div class="score">'+right+' / '+n+'</div><p class="muted">第一次就答對 '+first+' 題</p><p class="muted" id="sendStat"></p></div>';
  if(wrong.length){
    h+='<div class="card"><h3>要再練習的題目</h3><ol>';
    wrong.forEach(function(r){ h+='<li>'+esc(r.q)+'<br><span class="muted">你的答案：'+esc(r.tries.join("、"))+'　正確答案：'+esc(r.answer)+'</span></li>'; });
    h+='</ol></div>';
  }
  h+='<div class="row"><button class="big primary" id="copy">📋 複製結果給教練</button><button class="big secondary" id="again">🔁 再玩一次</button><button class="big secondary" id="hm">🏠 回首頁</button></div><div id="fallback"></div>';
  el(h); if(stars>=2) celebrate();
  enqueueAndSend(roundFields(right, n)).then(showSendStatus, function(){ showSendStatus(false); });
  document.getElementById("copy").onclick=function(){ copyText(summary(rec)); };
  document.getElementById("hm").onclick=home;
  document.getElementById("again").onclick=function(){
    if(R.isWB) return wrongbook();
    var it=R.items[0], s=subj(it.sid), u=unit(s,it.uid);
    start(s.name,u.name,drawItems(s,u),false);
  };
}
function summary(r){
  var t="【芷媃的五年級加油站 練習結果】\n日期："+r.date+"\n科目："+r.subject+"\n單元："+r.unit+"\n成績："+r.right+" / "+r.total+"（第一次就答對 "+r.first+" 題，"+r.stars+" 顆星）\n";
  if(r.wrong.length){ t+="\n需要加強的題目：\n"; r.wrong.forEach(function(w,i){ t+=(i+1)+". "+w.q+"\n   孩子的答案："+w.tries.join("、")+"\n   正確答案："+w.answer+"\n"; }); }
  else t+="\n全部第一次就答對！\n";
  return t;
}
function copyText(t){
  function fallback(){
    var f=document.getElementById("fallback");
    f.innerHTML='<div class="card"><p>沒辦法自動複製，請長按下面的文字全選後複製：</p><textarea id="ta" readonly aria-label="結果文字"></textarea></div>';
    var ta=document.getElementById("ta"); ta.value=t; ta.focus(); ta.select();
    try{ if(document.execCommand("copy")) toast("已複製！"); }catch(e){}
  }
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(t).then(function(){ toast("已複製！可以貼給教練了 📋"); }, fallback);
  } else fallback();
}

// ---------- 錯題本 ----------
function wrongbook(){
  var wb=load(KEY_W,[]).filter(function(w){return getQ(w);});
  var h='<h2>📒 我的錯題本</h2>';
  if(!wb.length){ el(h+'<div class="card">目前沒有錯題，太厲害了！🌟</div><div class="row"><button class="big secondary" id="hm">🏠 回首頁</button></div>'); document.getElementById("hm").onclick=home; return; }
  h+='<p class="muted">共 '+wb.length+' 題。重做時第一次就答對，題目就會從錯題本畢業喔！</p><div class="row"><button class="big primary" id="redo">✏️ 重做錯題（最多10題）</button></div><div class="card"><ol>';
  wb.forEach(function(w){ var g=getQ(w); h+='<li>'+esc(g.q.q)+' <span class="muted">（'+esc(g.s.name)+'・'+esc(g.u.name)+'）</span></li>'; });
  el(h+'</ol></div><div class="row"><button class="big secondary" id="hm">🏠 回首頁</button></div>');
  document.getElementById("hm").onclick=home;
  document.getElementById("redo").onclick=function(){ start("錯題本","錯題本重做",shuffle(wb).slice(0,10).map(itCopy),true); };
}

// ---------- 家長區 ----------
function parent(){
  var hist=load(KEY_H,[]);
  var h='<h2>👪 家長區</h2><div class="card"><h3>最近練習紀錄</h3>';
  if(!hist.length) h+='<p>還沒有紀錄。</p>';
  else { h+='<table><thead><tr><th>日期</th><th>科目・單元</th><th>成績</th></tr></thead><tbody>';
    hist.slice(0,20).forEach(function(r,i){ h+='<tr><td>'+esc(r.date)+'</td><td>'+esc(r.subject)+'・'+esc(r.unit)+'</td><td>'+r.right+'/'+r.total+' '+"⭐".repeat(r.stars)+' <button class="iconbtn" data-c="'+i+'" aria-label="複製這次結果">📋</button></td></tr>'; });
    h+='</tbody></table>'; }
  h+='<p class="muted">紀錄存在這台裝置的瀏覽器裡。每一回合的成績和錯題會送給媽媽；沒網路時先暫存，下次開啟再送。</p><div id="fallback"></div></div><div class="row"><button class="big secondary" id="clr">🗑 清除所有紀錄與錯題本</button><button class="big secondary" id="hm">🏠 回首頁</button></div>';
  el(h);
  app.querySelectorAll("[data-c]").forEach(function(b){ b.onclick=function(){ copyText(summary(hist[+b.dataset.c])); }; });
  document.getElementById("hm").onclick=home;
  document.getElementById("clr").onclick=function(){ if(confirm("確定要清除所有紀錄和錯題本嗎？")){ save(KEY_H,[]); save(KEY_W,[]); parent(); } };
}

// ---------- 計算紙（數學題用；只存在記憶體，換題就清空，不寫入 localStorage） ----------
var SP=(function(){
  var panel=null, cv, ctx, strokes=[], cur=null, color="#222", mode="pen", openState=false, ro;
  var COLORS=[["#222","黑"],["#2a6fdb","藍"],["#e03131","紅"]];
  function build(){
    if(panel) return;
    panel=document.createElement("div"); panel.id="spPanel"; panel.className="sp-panel"; panel.hidden=true;
    var h='<div class="sp-tools" role="toolbar" aria-label="計算紙工具">';
    COLORS.forEach(function(c){ h+='<button class="sp-t sp-color" data-c="'+c[0]+'" aria-label="'+c[1]+'色筆"><span style="background:'+c[0]+'"></span>'+c[1]+'</button>'; });
    h+='<button class="sp-t" id="spEraser" aria-label="橡皮擦">🧽 橡皮擦</button><button class="sp-t" id="spUndo" aria-label="復原">↶ 復原</button><button class="sp-t" id="spClear" aria-label="全部清除">🗑 清除</button><button class="sp-t sp-close" id="spClose" aria-label="關閉計算紙">✖ 關閉</button></div><canvas id="spCanvas" aria-label="計算紙，可以用手指或筆書寫"></canvas>';
    panel.innerHTML=h; document.body.appendChild(panel);
    cv=panel.querySelector("canvas"); ctx=cv.getContext("2d");
    panel.querySelectorAll(".sp-color").forEach(function(b){ tap(b, function(){ mode="pen"; color=b.dataset.c; mark(); }); });
    tap(panel.querySelector("#spEraser"), function(){ mode="eraser"; mark(); });
    tap(panel.querySelector("#spUndo"), function(){ strokes.pop(); redraw(); });
    tap(panel.querySelector("#spClear"), function(){ strokes=[]; redraw(); });
    tap(panel.querySelector("#spClose"), close);
    cv.addEventListener("pointerdown",down); cv.addEventListener("pointermove",move);
    ["pointerup","pointercancel","pointerleave"].forEach(function(e){ cv.addEventListener(e,up); });
    window.addEventListener("resize",resize); window.addEventListener("orientationchange",resize);
    mark();
  }
  function mark(){ panel.querySelectorAll(".sp-color").forEach(function(b){ b.classList.toggle("on",mode==="pen"&&b.dataset.c===color); });
    panel.querySelector("#spEraser").classList.toggle("on",mode==="eraser"); }
  function pt(e){ var r=cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
  function blockSel(e){ e.preventDefault(); }
  function armSelGuard(){ document.addEventListener("selectstart",blockSel,true); document.addEventListener("contextmenu",blockSel,true); }
  function disarmSelGuard(){ document.body.classList.remove("sp-drawing"); document.removeEventListener("selectstart",blockSel,true); document.removeEventListener("contextmenu",blockSel,true); }
  function down(e){ e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    document.body.classList.add("sp-drawing"); armSelGuard();
    try{ var sel=window.getSelection(); if(sel&&sel.removeAllRanges) sel.removeAllRanges(); }catch(_){}
    cur={mode:mode,color:color,w:mode==="eraser"?28:(e.pointerType==="pen"?3:4),pts:[pt(e)]}; strokes.push(cur); redraw(); }
  function move(e){ if(!cur) return; e.preventDefault(); cur.pts.push(pt(e)); drawStroke(cur,true); }
  function up(e){ cur=null; disarmSelGuard(); if(e&&e.pointerId!=null){ try{ cv.releasePointerCapture(e.pointerId); }catch(_){} } }
  function drawStroke(s,lastOnly){ var p=s.pts; ctx.save(); ctx.lineCap="round"; ctx.lineJoin="round"; ctx.lineWidth=s.w;
    ctx.globalCompositeOperation=s.mode==="eraser"?"destination-out":"source-over"; ctx.strokeStyle=s.color; ctx.fillStyle=s.color;
    if(p.length===1){ ctx.beginPath(); ctx.arc(p[0][0],p[0][1],s.w/2,0,Math.PI*2); ctx.fill(); }
    else { var st=lastOnly?p.length-2:0; ctx.beginPath(); ctx.moveTo(p[st][0],p[st][1]); for(var i=st+1;i<p.length;i++) ctx.lineTo(p[i][0],p[i][1]); ctx.stroke(); }
    ctx.restore(); }
  function redraw(){ if(!cv) return; var d=window.devicePixelRatio||1; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height); ctx.setTransform(d,0,0,d,0,0);
    strokes.forEach(function(s){ drawStroke(s,false); }); }
  function resize(){ if(!openState) return; var r=cv.getBoundingClientRect(), d=window.devicePixelRatio||1;
    var w=Math.max(1,Math.round(r.width*d)), h=Math.max(1,Math.round(r.height*d)); if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; } redraw(); }
  function open(){ build(); panel.hidden=false; openState=true; document.body.classList.add("sp-open"); var b=document.getElementById("spBtn"); if(b){ b.textContent="📝 收起計算紙"; b.setAttribute("aria-expanded","true"); } resize(); }
  function close(){ if(!panel) return; panel.hidden=true; openState=false; document.body.classList.remove("sp-open"); disarmSelGuard(); var b=document.getElementById("spBtn"); if(b){ b.textContent="📝 計算紙"; b.setAttribute("aria-expanded","false"); } }
  function toggle(){ openState?close():open(); }
  function reset(){ strokes=[]; cur=null; if(cv) redraw(); }
  return {open:open, close:close, toggle:toggle, reset:reset, _strokes:function(){return strokes.length;}};
})();

document.getElementById("homeBtn").onclick=home;
flushOutbox();
home();
})();
