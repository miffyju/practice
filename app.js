(function(){
"use strict";
var D = window.PRACTICE_DATA, app = document.getElementById("app");
var KEY_H = "p3_history", KEY_W = "p3_wrongbook", KEY_RECENT = "p3_recent", ROUND = 8, RECENT_ROUNDS = 3;
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
  var h = '<p class="greet">嗨，小練習生！今天想練習什麼呢？😊</p><div class="grid">';
  D.subjects.forEach(function(s){ h += '<button class="big subject'+(s.featured?' exam':'')+'" style="background:'+s.color+'" data-s="'+s.id+'"><span aria-hidden="true">'+s.icon+'</span> '+esc(s.name)+(s.sub?'<small class="sub">'+esc(s.sub)+'</small>':'')+'</button>'; });
  h += '</div><div class="row"><button class="big secondary" id="wbBtn">📒 我的錯題本（'+wb.length+'）</button><button class="big secondary" id="parentBtn">👪 家長區</button></div>';
  el(h);
  app.querySelectorAll("[data-s]").forEach(function(b){ b.onclick=function(){ units(b.dataset.s); }; });
  document.getElementById("wbBtn").onclick=wrongbook;
  document.getElementById("parentBtn").onclick=parent;
}
function units(sid){
  var s=subj(sid), h='<h2>'+s.icon+' '+esc(s.name)+(s.sub?'<small class="sub2">（'+esc(s.sub)+'）</small>':'')+'</h2><p class="muted">選一個單元開始，每回合最多 '+ROUND+' 題，每次的題目都不一樣。</p>', last=null;
  s.units.forEach(function(u){
    if(u.group&&u.group!==last){ if(last!==null) h+='</div>'; h+='<h3 class="grp">'+esc((D.groups&&D.groups[u.group])||u.group)+'</h3><div class="grid">'; last=u.group; }
    else if(last===null){ h+='<div class="grid">'; last=u.group||""; }
    h+='<button class="big" data-u="'+u.id+'">'+esc(u.name)+' <span class="muted">（'+(genList(u).length?'題目無限變化':poolSize(u)+'題，每次抽題')+'）</span></button>'; });
  el(h+'</div><div class="row"><button class="big secondary" id="back">⬅ 回首頁</button></div>');
  app.querySelectorAll("[data-u]").forEach(function(b){ b.onclick=function(){
    var u=unit(s,b.dataset.u);
    start(s.name, u.name, buildRound(s,u), false, {sid:s.id,uid:u.id});
  }; });
  document.getElementById("back").onclick=home;
}
function getQ(it){
  if(it.lg){ return it.g ? {q:it.g, u:{id:it.uid,name:it.un||"舊題",scratch:!!it.scr}, s:{id:it.sid,name:it.sn||"舊題"}} : null; }
  var s=subj(it.sid), u=s&&unit(s,it.uid); if(!u) return null;
  if(it.gen){ if(!it.g&&GEN) it.g=GEN.make(it.gen,it.seed); return it.g ? {q:it.g, u:u, s:s} : null; }
  var q=u.questions[it.idx]; return q ? {q:q, u:u, s:s} : null; }
// ---------- 每回合出題：數學用產生器；其他科從題庫抽題，避開最近 3 回合出現過的 ----------
function genList(u){ return (GEN&&GEN.units[u.id])||[]; }
function newSeed(){ return 1+Math.floor(Math.random()*2147483646); }
function genItem(s,u,name){ var seed=newSeed(); return {sid:s.id,uid:u.id,gen:name,seed:seed,g:GEN.make(name,seed)}; }
function recentIds(key){ var r=load(KEY_RECENT,{}); var a=(r&&r[key])||[]; var seen={}; a.forEach(function(round){ (round||[]).forEach(function(id){ seen[id]=1; }); }); return seen; }
function remember(key, ids){ var r=load(KEY_RECENT,{}); if(!r||typeof r!=="object"||Array.isArray(r)) r={}; var a=Array.isArray(r[key])?r[key]:[]; a.push(ids); r[key]=a.slice(-RECENT_ROUNDS); save(KEY_RECENT,r); }
function itemId(it){ return it.gen ? it.gen : (it.m ? it.uid+"#"+it.idx : "q"+it.idx); }
// 「綜合」單元（u.mix）：題目從其他單元的題庫抽，分成幾組，每組平均抽幾題
function mixPool(group){ var all=[]; group.forEach(function(r){ var ms=subj(r[0]), mu=ms&&unit(ms,r[1]); if(mu) mu.questions.forEach(function(q,i){ all.push({sid:ms.id,uid:mu.id,idx:i,m:1}); }); }); return all; }
function poolSize(u){ if(!u.mix) return u.questions.length; var n=0; u.mix.forEach(function(g){ n+=mixPool(g).length; }); return n; }
function pickMix(u,size,seen){
  var G=u.mix, out=[];
  G.forEach(function(g,gi){
    var per=Math.floor(size/G.length)+(gi<size%G.length?1:0), all=mixPool(g);
    var fresh=shuffle(all.filter(function(it){ return !seen[itemId(it)]; })), old=shuffle(all.filter(function(it){ return seen[itemId(it)]; }));
    out=out.concat(fresh.concat(old).slice(0,per)); });
  return shuffle(out);
}
function pickStatic(s,u,n,seen){
  var all=u.questions.map(function(q,i){ return {sid:s.id,uid:u.id,idx:i}; });
  var fresh=shuffle(all.filter(function(it){ return !seen[itemId(it)]; })), old=shuffle(all.filter(function(it){ return seen[itemId(it)]; }));
  return fresh.concat(old).slice(0,n);
}
function buildRound(s,u){
  var key=s.id+"|"+u.id, seen=recentIds(key), gens=genList(u), size=u.round||ROUND, items;
  if(gens.length){
    var nStatic=Math.min(2,u.questions.length), st=pickStatic(s,u,nStatic,seen), g=[];
    // 產生器輪流使用，最近用過的題型排後面
    var order=shuffle(gens.filter(function(n){return !seen[n];})).concat(shuffle(gens.filter(function(n){return seen[n];})));
    for(var i=0;g.length<size-st.length;i++) g.push(genItem(s,u,order[i%order.length]));
    items=shuffle(st.concat(g));
  } else if(u.mix) items=pickMix(u,size,seen);
  else items=pickStatic(s,u,size,seen);
  remember(key, items.map(itemId));
  return items;
}
var PIN=/^(以上皆是|以上皆非|以上都是|以上都不是|以上都對|以上都不對|以上皆對|都對|都不對|都是|都不是|以上.*)$/;
function orderOptions(opts){ var free=opts.filter(function(o){return !PIN.test(o);}), pin=opts.filter(function(o){return PIN.test(o);}); return shuffle(free).concat(pin); }

// ---------- 作答 ----------
var R;
function start(sname, uname, items, isWB, src){
  items=items.filter(getQ);
  if(!items.length){ toast("沒有題目喔"); return home(); }
  R={sname:sname,uname:uname,items:items,i:0,results:[],isWB:isWB,src:src||null}; showQ();
}
function showQ(){
  var it=R.items[R.i], g=getQ(it), q=g.q, n=R.items.length;
  R.cur={tries:[],done:false};
  var h='<div class="muted">'+esc(g.s.name)+'・'+esc(g.u.name)+'　第 '+(R.i+1)+' / '+n+' 題</div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+n+'" aria-valuenow="'+R.i+'"><div style="width:'+(R.i/n*100)+'%"></div></div><div class="quiz"><div>';
  if(g.u.passage) h+='<div class="passage" tabindex="0" aria-label="短文">'+esc(g.u.passage)+'</div>';
  h+='<div class="card"><div class="qtext" id="qt">'+esc(q.q)+'</div>'+(q.say&&canSpeak()?'<button class="big secondary say" id="sayBtn" aria-label="唸給我聽">🔊 唸給我聽</button>':'')+'</div></div><div>';
  if(q.type==="mc"){
    h+='<div class="options" role="group" aria-labelledby="qt">';
    orderOptions(q.options).forEach(function(o){ h+='<button class="big opt" data-o="'+esc(o)+'">'+esc(o)+'</button>'; });
    h+='</div>';
  } else if(q.type==="spell"){
    var w=String(q.answer).toLowerCase(), pool=w.split(""), ab="abcdefghijklmnopqrstuvwxyz".split("").filter(function(c){return w.indexOf(c)<0;});
    ab=shuffle(ab).slice(0,3); pool=shuffle(pool.concat(ab));
    h+='<div class="spboxes" id="spx" aria-live="polite" aria-label="你的拼字">'+w.split("").map(function(){return '<span class="spbox"></span>';}).join("")+'</div><div class="spdiff" id="spdiff"></div><div class="tiles" role="group" aria-label="字母按鍵">';
    pool.forEach(function(c,i){ h+='<button class="tile" data-t="'+i+'" data-c="'+c+'" aria-label="'+c+'">'+c+'</button>'; });
    h+='</div><div class="row"><button class="big secondary" id="spBack" aria-label="退格">⌫ 退格</button><button class="big primary" id="spOk" aria-label="送出">✔ 送出</button></div>';
  } else {
    h+='<div class="display" id="disp" aria-live="polite" aria-label="你的答案"></div><div class="keypad">';
    ["1","2","3","4","5","6","7","8","9","⌫","0","✔"].forEach(function(k){
      var lab = k==="⌫"?"刪除":k==="✔"?"送出":k;
      h+='<button data-k="'+k+'" aria-label="'+lab+'"'+(k==="✔"?' class="ok"':'')+'>'+k+'</button>'; });
    h+='</div>';
  }
  h+='<div id="fb"></div><div class="row" id="nextRow"></div></div></div>';
  var spWas=SP.isOpen(); el(h);
  SP.reset(); if(g.u.scratch){ var spb=document.createElement("button"); spb.className="big secondary spbtn"; spb.id="spBtn"; spb.setAttribute("aria-expanded","false"); spb.innerHTML="📝 計算紙"; tap(spb, SP.toggle); document.querySelector(".quiz .card").appendChild(spb); if(spWas) SP.open(); }
  var sb=document.getElementById("sayBtn"); if(sb) sb.onclick=function(){ speak(q.say); };
  if(q.type==="mc"){
    app.querySelectorAll(".opt").forEach(function(b){ b.onclick=function(){ if(R.cur.done||b.disabled) return; answer(b.dataset.o, b); }; });
  } else if(q.type==="spell"){
    var used=[], boxes=app.querySelectorAll(".spbox"), W=String(q.answer).length;
    var paint=function(){ boxes.forEach(function(b,i){ b.textContent=used[i]?used[i].dataset.c:""; b.classList.toggle("on",i===used.length); }); };
    R.cur.spReset=function(){ used.forEach(function(t){ t.disabled=false; }); used=[]; paint(); };
    app.querySelectorAll(".tile").forEach(function(t){ t.onclick=function(){ if(R.cur.done||t.disabled||used.length>=W) return; t.disabled=true; used.push(t); paint(); }; });
    document.getElementById("spBack").onclick=function(){ if(R.cur.done||!used.length) return; used.pop().disabled=false; paint(); };
    document.getElementById("spOk").onclick=function(){ if(R.cur.done) return; if(used.length<W){ toast("還有空格喔，把格子填滿再送出"); return; } answer(used.map(function(t){return t.dataset.c;}).join(""), null); };
    paint();
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
  var g=getQ(R.items[R.i]), q=g.q, fb=document.getElementById("fb"), ok=(q.type==="spell"?a.toLowerCase()===String(q.answer).toLowerCase():a===String(q.answer));
  R.cur.tries.push(a);
  if(ok){
    R.cur.done=true; if(btn) btn.classList.add("right");
    if(q.type==="num") document.getElementById("disp").textContent=a;
    celebrate();
    fb.innerHTML='<div class="feedback good pop"><b>🎉 '+pick(CHEER)+'</b>'+explainHTML(q)+'</div>';
    finishQ(true);
  } else if(R.cur.tries.length===1){
    if(btn){ btn.classList.add("wrong"); btn.disabled=true; }
    fb.innerHTML='<div class="feedback hint">💪 '+pick(ENC)+'<br>💡 提示：'+esc(q.hint)+'<br><span class="muted">（再試一次）</span></div>';
    if(q.type==="num") document.getElementById("disp").textContent="";
    if(q.type==="spell"){ document.getElementById("spdiff").innerHTML='你拼的：'+diffHTML(a,q.answer); R.cur.spReset(); }
  } else {
    R.cur.done=true; if(btn) btn.classList.add("wrong");
    app.querySelectorAll(".opt").forEach(function(b){ if(b.dataset.o===String(q.answer)) b.classList.add("right"); });
    if(q.type==="num") document.getElementById("disp").textContent=a+" → "+q.answer;
    if(q.type==="spell") document.getElementById("spdiff").innerHTML='你拼的：'+diffHTML(a,q.answer)+'　正確：<b class="good-w">'+esc(q.answer)+'</b>';
    fb.innerHTML='<div class="feedback explain">🌈 沒關係，我們一起看看怎麼想：<br>正確答案是 <b>'+esc(q.answer)+'</b>'+explainHTML(q)+'</div>';
    finishQ(false);
  }
}
function diffHTML(a,ans){ var s=String(ans).toLowerCase(); return '<span class="diff">'+a.split("").map(function(c,i){ return c.toLowerCase()===s[i]?esc(c):'<span class="bad">'+esc(c)+'</span>'; }).join("")+'</span>'; }
function explainHTML(q){ return '<ol>'+q.explain.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'; }
function finishQ(correct){
  var it=R.items[R.i], g=getQ(it), firstTry=correct&&R.cur.tries.length===1;
  R.results.push({it:it, q:g.q.q, unit:g.u.name, tries:R.cur.tries.slice(), answer:String(g.q.answer), correct:correct, firstTry:firstTry});
  // 錯題本
  var wb=load(KEY_W,[]), key=it.gen?"gen|"+it.sid+"|"+it.uid+"|"+g.q.gid:it.sid+"|"+it.uid+"|"+it.idx, pos=-1;
  wb.forEach(function(w,i){ if(w.key===key) pos=i; });
  if(!firstTry && pos<0) wb.push(it.gen?(it.lg?{key:key,v:2,lg:1,sid:it.sid,uid:it.uid,gen:it.gen,seed:it.seed,g:g.q,sn:it.sn,un:it.un,scr:it.scr,date:today()}:{key:key,v:2,sid:it.sid,uid:it.uid,gen:it.gen,seed:it.seed,g:g.q,date:today()}):{key:key,v:2,sid:it.sid,uid:it.uid,idx:it.idx,date:today()});
  if(firstTry && R.isWB && pos>=0) wb.splice(pos,1);
  save(KEY_W,wb);
  var last=R.i===R.items.length-1;
  var nr=document.getElementById("nextRow");
  nr.innerHTML='<button class="big primary" id="next">'+(last?"看成績 🏁":"下一題 ➡")+'</button>';
  var nb=document.getElementById("next"); nb.focus();
  nb.onclick=function(){ if(last) end(); else { R.i++; showQ(); } };
}

// ---------- 送給媽媽（Google 表單；離線先排進 p3_outbox） ----------
var KEY_OUT = "p3_outbox", OUTBOX_MAX = 50;
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
    lines.push(r.it.uid+"#"+(r.it.gen?(r.it.g&&r.it.g.gid)||(r.it.gen+"~"+r.it.seed):(r.it.idx+1))+"｜"+trimQ(r.q)+"｜她答："+herAnswer(r)+"｜正解："+r.answer); });
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
    "entry.648531033":"紫嫈",
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
    var sr=R.src||{sid:R.items[0].sid,uid:R.items[0].uid}, s=subj(sr.sid), u=unit(s,sr.uid);
    start(s.name,u.name,buildRound(s,u),false,sr);
  };
}
function summary(r){
  var t="【紫嫈的三年級加油站 練習結果】\n日期："+r.date+"\n科目："+r.subject+"\n單元："+r.unit+"\n成績："+r.right+" / "+r.total+"（第一次就答對 "+r.first+" 題，"+r.stars+" 顆星）\n";
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
  var wb=load(KEY_W,[]).filter(function(w){return (w.gen||w.v===2)&&getQ(w);});
  var h='<h2>📒 我的錯題本</h2>';
  if(!wb.length){ el(h+'<div class="card">目前沒有錯題，太厲害了！🌟</div><div class="row"><button class="big secondary" id="hm">🏠 回首頁</button></div>'); document.getElementById("hm").onclick=home; return; }
  h+='<p class="muted">共 '+wb.length+' 題。重做時第一次就答對，題目就會從錯題本畢業喔！</p><div class="row"><button class="big primary" id="redo">✏️ 重做錯題（最多10題）</button></div><div class="card"><ol>';
  wb.forEach(function(w){ var g=getQ(w); h+='<li>'+esc(g.q.q)+' <span class="muted">（'+esc(g.s.name)+'・'+esc(g.u.name)+'）</span></li>'; });
  el(h+'</ol></div><div class="row"><button class="big secondary" id="hm">🏠 回首頁</button></div>');
  document.getElementById("hm").onclick=home;
  document.getElementById("redo").onclick=function(){ start("錯題本","錯題重做",shuffle(wb).slice(0,10).map(function(w){return w.gen?(w.lg?{sid:w.sid,uid:w.uid,gen:w.gen,seed:w.seed,g:w.g,lg:1,sn:w.sn,un:w.un,scr:w.scr}:{sid:w.sid,uid:w.uid,gen:w.gen,seed:w.seed,g:w.g}):{sid:w.sid,uid:w.uid,idx:w.idx};}),true); };
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
    document.addEventListener("selectstart",blockSel); document.addEventListener("contextmenu",blockSel); panel.addEventListener("contextmenu",function(e){ e.preventDefault(); });
    window.addEventListener("resize",resize); window.addEventListener("orientationchange",resize);
    mark();
  }
  function mark(){ panel.querySelectorAll(".sp-color").forEach(function(b){ b.classList.toggle("on",mode==="pen"&&b.dataset.c===color); });
    panel.querySelector("#spEraser").classList.toggle("on",mode==="eraser"); }
  function pt(e){ var r=cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
  // 畫圖中：整頁禁止選取文字、擋掉長按選單，避免用筆寫字時把題目反白
  function blockSel(e){ if(cur) e.preventDefault(); }
  function clearSel(){ try{ var g=window.getSelection&&window.getSelection(); if(g&&g.removeAllRanges) g.removeAllRanges(); }catch(_){} }
  function down(e){ e.preventDefault(); clearSel(); document.body.classList.add("sp-drawing"); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    cur={mode:mode,color:color,w:mode==="eraser"?28:(e.pointerType==="pen"?3:4),pts:[pt(e)]}; strokes.push(cur); redraw(); }
  function move(e){ if(!cur) return; e.preventDefault(); cur.pts.push(pt(e)); drawStroke(cur,true); }
  function up(e){ cur=null; document.body.classList.remove("sp-drawing"); if(e&&e.pointerId!=null){ try{ cv.releasePointerCapture(e.pointerId); }catch(_){} } }
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
  function close(){ if(!panel) return; cur=null; document.body.classList.remove("sp-drawing"); panel.hidden=true; openState=false; document.body.classList.remove("sp-open"); var b=document.getElementById("spBtn"); if(b){ b.textContent="📝 計算紙"; b.setAttribute("aria-expanded","false"); } }
  function toggle(){ openState?close():open(); }
  function reset(){ strokes=[]; cur=null; if(cv) redraw(); }
  return {isOpen:function(){return openState;}, open:open, close:close, toggle:toggle, reset:reset, _strokes:function(){return strokes.length;}};
})();

document.getElementById("homeBtn").onclick=home;
// ---------- 舊版錯題本轉換：期中版依「題號」存放的錯題，改存成完整題目，不會因為題庫改版而錯亂 ----------
function migrateWB(){
  var wb=load(KEY_W,[]); if(!Array.isArray(wb)||!wb.some(function(w){ return w&&w.v!==2; })) return;
  var L=window.LEGACY_DATA; if(!L) return;
  function lsu(sid,uid){ var ls=L.subjects.filter(function(x){return x.id===sid;})[0], lu=ls&&ls.units.filter(function(x){return x.id===uid;})[0]; return {ls:ls,lu:lu}; }
  var out=[], seen={};
  wb.forEach(function(w){
    if(!w||typeof w!=="object") return;
    var e=null;
    if(w.v===2) e=w;
    else {
      var f=lsu(w.sid,w.uid), keepLive=false;
      if(w.gen&&w.g){
        var cs=subj(w.sid), cu=cs&&unit(cs,w.uid);
        keepLive=!!(cu&&GEN&&GEN.generators[w.gen]&&(GEN.units[w.uid]||[]).indexOf(w.gen)>=0);
        if(keepLive) e={key:w.key,v:2,sid:w.sid,uid:w.uid,gen:w.gen,seed:w.seed,g:w.g,date:w.date};
        else e={key:"gen|"+w.sid+"|"+w.uid+"|"+(w.g.gid||w.gen+"~"+w.seed),v:2,lg:1,sid:w.sid,uid:w.uid,gen:"legacy",seed:0,g:w.g,sn:f.ls?f.ls.name:"舊題",un:f.lu?f.lu.name:"舊題",scr:w.sid==="math"||w.uid==="x6"||w.uid==="x12",date:w.date};
      } else if(f.lu&&f.lu.questions[w.idx]){
        var q=JSON.parse(JSON.stringify(f.lu.questions[w.idx])); q.gid="old-"+w.uid+"#"+(w.idx+1);
        e={key:"gen|"+w.sid+"|"+w.uid+"|"+q.gid,v:2,lg:1,sid:w.sid,uid:w.uid,gen:"legacy",seed:0,g:q,sn:f.ls.name,un:f.lu.name,scr:!!f.lu.scratch,date:w.date};
      }
    }
    if(e&&!seen[e.key]){ seen[e.key]=1; out.push(e); }
  });
  save(KEY_W,out);
}
migrateWB();
flushOutbox();
home();
})();
