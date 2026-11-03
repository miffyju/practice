(function(){
"use strict";
var D = window.PRACTICE_DATA, app = document.getElementById("app");
var KEY_H = "p3_history", KEY_W = "p3_wrongbook", ROUND = 8;
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

// ---------- 首頁 ----------
function home(){
  var wb = load(KEY_W, []);
  var h = '<p class="greet">嗨，小練習生！今天想練習什麼呢？😊</p><div class="grid">';
  D.subjects.forEach(function(s){ h += '<button class="big subject'+(s.featured?' exam':'')+'" style="background:'+s.color+'" data-s="'+s.id+'"><span aria-hidden="true">'+s.icon+'</span> '+esc(s.name)+'</button>'; });
  h += '</div><div class="row"><button class="big secondary" id="wbBtn">📒 我的錯題本（'+wb.length+'）</button><button class="big secondary" id="parentBtn">👪 家長區</button></div>';
  el(h);
  app.querySelectorAll("[data-s]").forEach(function(b){ b.onclick=function(){ units(b.dataset.s); }; });
  document.getElementById("wbBtn").onclick=wrongbook;
  document.getElementById("parentBtn").onclick=parent;
}
function units(sid){
  var s=subj(sid), h='<h2>'+s.icon+' '+esc(s.name)+'</h2><p class="muted">選一個單元開始，每回合最多 '+ROUND+' 題。</p><div class="grid">';
  s.units.forEach(function(u){ h+='<button class="big" data-u="'+u.id+'">'+esc(u.name)+' <span class="muted">（'+u.questions.length+'題）</span></button>'; });
  el(h+'</div><div class="row"><button class="big secondary" id="back">⬅ 回首頁</button></div>');
  app.querySelectorAll("[data-u]").forEach(function(b){ b.onclick=function(){
    var u=unit(s,b.dataset.u);
    var items=shuffle(u.questions.map(function(q,i){ return {sid:s.id,uid:u.id,idx:i}; })).slice(0,ROUND);
    start(s.name, u.name, items, false);
  }; });
  document.getElementById("back").onclick=home;
}
function getQ(it){ var s=subj(it.sid), u=s&&unit(s,it.uid); return u ? {q:u.questions[it.idx], u:u, s:s} : null; }

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
  var h='<div class="muted">'+esc(g.s.name)+'・'+esc(g.u.name)+'　第 '+(R.i+1)+' / '+n+' 題</div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+n+'" aria-valuenow="'+R.i+'"><div style="width:'+(R.i/n*100)+'%"></div></div><div class="quiz"><div>';
  if(g.u.passage) h+='<div class="passage" tabindex="0" aria-label="短文">'+esc(g.u.passage)+'</div>';
  h+='<div class="card"><div class="qtext" id="qt">'+esc(q.q)+'</div>'+(q.say&&canSpeak()?'<button class="big secondary say" id="sayBtn" aria-label="唸給我聽">🔊 唸給我聽</button>':'')+'</div></div><div>';
  if(q.type==="mc"){
    h+='<div class="options" role="group" aria-labelledby="qt">';
    shuffle(q.options).forEach(function(o){ h+='<button class="big opt" data-o="'+esc(o)+'">'+esc(o)+'</button>'; });
    h+='</div>';
  } else {
    h+='<div class="display" id="disp" aria-live="polite" aria-label="你的答案"></div><div class="keypad">';
    ["1","2","3","4","5","6","7","8","9","⌫","0","✔"].forEach(function(k){
      var lab = k==="⌫"?"刪除":k==="✔"?"送出":k;
      h+='<button data-k="'+k+'" aria-label="'+lab+'"'+(k==="✔"?' class="ok"':'')+'>'+k+'</button>'; });
    h+='</div>';
  }
  h+='<div id="fb"></div><div class="row" id="nextRow"></div></div></div>';
  var spWas=SP.isOpen(); el(h);
  SP.reset(); if(g.u.scratch){ var spb=document.createElement("button"); spb.className="big secondary spbtn"; spb.id="spBtn"; spb.setAttribute("aria-expanded","false"); spb.innerHTML="📝 計算紙"; spb.onclick=SP.toggle; document.querySelector(".quiz .card").appendChild(spb); if(spWas) SP.open(); }
  var sb=document.getElementById("sayBtn"); if(sb) sb.onclick=function(){ speak(q.say); };
  if(q.type==="mc"){
    app.querySelectorAll(".opt").forEach(function(b){ b.onclick=function(){ if(R.cur.done||b.disabled) return; answer(b.dataset.o, b); }; });
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
  var g=getQ(R.items[R.i]), q=g.q, fb=document.getElementById("fb"), ok=(a===String(q.answer));
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
  } else {
    R.cur.done=true; if(btn) btn.classList.add("wrong");
    app.querySelectorAll(".opt").forEach(function(b){ if(b.dataset.o===String(q.answer)) b.classList.add("right"); });
    if(q.type==="num") document.getElementById("disp").textContent=a+" → "+q.answer;
    fb.innerHTML='<div class="feedback explain">🌈 沒關係，我們一起看看怎麼想：<br>正確答案是 <b>'+esc(q.answer)+'</b>'+explainHTML(q)+'</div>';
    finishQ(false);
  }
}
function explainHTML(q){ return '<ol>'+q.explain.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'; }
function finishQ(correct){
  var it=R.items[R.i], g=getQ(it), firstTry=correct&&R.cur.tries.length===1;
  R.results.push({it:it, q:g.q.q, unit:g.u.name, tries:R.cur.tries.slice(), answer:String(g.q.answer), correct:correct, firstTry:firstTry});
  // 錯題本
  var wb=load(KEY_W,[]), key=it.sid+"|"+it.uid+"|"+it.idx, pos=-1;
  wb.forEach(function(w,i){ if(w.key===key) pos=i; });
  if(!firstTry && pos<0) wb.push({key:key,sid:it.sid,uid:it.uid,idx:it.idx,date:today()});
  if(firstTry && R.isWB && pos>=0) wb.splice(pos,1);
  save(KEY_W,wb);
  var last=R.i===R.items.length-1;
  var nr=document.getElementById("nextRow");
  nr.innerHTML='<button class="big primary" id="next">'+(last?"看成績 🏁":"下一題 ➡")+'</button>';
  var nb=document.getElementById("next"); nb.focus();
  nb.onclick=function(){ if(last) end(); else { R.i++; showQ(); } };
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
    '<div class="score">'+right+' / '+n+'</div><p class="muted">第一次就答對 '+first+' 題</p></div>';
  if(wrong.length){
    h+='<div class="card"><h3>要再練習的題目</h3><ol>';
    wrong.forEach(function(r){ h+='<li>'+esc(r.q)+'<br><span class="muted">你的答案：'+esc(r.tries.join("、"))+'　正確答案：'+esc(r.answer)+'</span></li>'; });
    h+='</ol></div>';
  }
  h+='<div class="row"><button class="big primary" id="copy">📋 複製結果給教練</button><button class="big secondary" id="again">🔁 再玩一次</button><button class="big secondary" id="hm">🏠 回首頁</button></div><div id="fallback"></div>';
  el(h); if(stars>=2) celebrate();
  document.getElementById("copy").onclick=function(){ copyText(summary(rec)); };
  document.getElementById("hm").onclick=home;
  document.getElementById("again").onclick=function(){
    if(R.isWB) return wrongbook();
    var it=R.items[0], s=subj(it.sid), u=unit(s,it.uid);
    start(s.name,u.name,shuffle(u.questions.map(function(q,i){return {sid:s.id,uid:u.id,idx:i};})).slice(0,ROUND),false);
  };
}
function summary(r){
  var t="【小學三年級練習站 練習結果】\n日期："+r.date+"\n科目："+r.subject+"\n單元："+r.unit+"\n成績："+r.right+" / "+r.total+"（第一次就答對 "+r.first+" 題，"+r.stars+" 顆星）\n";
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
  document.getElementById("redo").onclick=function(){ start("錯題本","錯題重做",shuffle(wb).slice(0,10).map(function(w){return {sid:w.sid,uid:w.uid,idx:w.idx};}),true); };
}

// ---------- 家長區 ----------
function parent(){
  var hist=load(KEY_H,[]);
  var h='<h2>👪 家長區</h2><div class="card"><h3>最近練習紀錄</h3>';
  if(!hist.length) h+='<p>還沒有紀錄。</p>';
  else { h+='<table><thead><tr><th>日期</th><th>科目・單元</th><th>成績</th></tr></thead><tbody>';
    hist.slice(0,20).forEach(function(r,i){ h+='<tr><td>'+esc(r.date)+'</td><td>'+esc(r.subject)+'・'+esc(r.unit)+'</td><td>'+r.right+'/'+r.total+' '+"⭐".repeat(r.stars)+' <button class="iconbtn" data-c="'+i+'" aria-label="複製這次結果">📋</button></td></tr>'; });
    h+='</tbody></table>'; }
  h+='<p class="muted">紀錄只存在這台裝置的瀏覽器裡（localStorage），不會上傳。</p><div id="fallback"></div></div><div class="row"><button class="big secondary" id="clr">🗑 清除所有紀錄與錯題本</button><button class="big secondary" id="hm">🏠 回首頁</button></div>';
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
    h+='<button class="sp-t" id="spEraser" aria-label="橡皮擦">🧽 橡皮擦</button><button class="sp-t" id="spUndo" aria-label="復原">↶ 復原</button><button class="sp-t" id="spClear" aria-label="全部清除">🗑 清除</button><button class="sp-t sp-close" id="spClose" aria-label="收起計算紙">⬇ 收起</button></div><canvas id="spCanvas" aria-label="計算紙，可以用手指或筆書寫"></canvas>';
    panel.innerHTML=h; document.body.appendChild(panel);
    cv=panel.querySelector("canvas"); ctx=cv.getContext("2d");
    panel.querySelectorAll(".sp-color").forEach(function(b){ b.onclick=function(){ mode="pen"; color=b.dataset.c; mark(); }; });
    panel.querySelector("#spEraser").onclick=function(){ mode="eraser"; mark(); };
    panel.querySelector("#spUndo").onclick=function(){ strokes.pop(); redraw(); };
    panel.querySelector("#spClear").onclick=function(){ strokes=[]; redraw(); };
    panel.querySelector("#spClose").onclick=close;
    cv.addEventListener("pointerdown",down); cv.addEventListener("pointermove",move);
    ["pointerup","pointercancel","pointerleave"].forEach(function(e){ cv.addEventListener(e,up); });
    window.addEventListener("resize",resize); window.addEventListener("orientationchange",resize);
    mark();
  }
  function mark(){ panel.querySelectorAll(".sp-color").forEach(function(b){ b.classList.toggle("on",mode==="pen"&&b.dataset.c===color); });
    panel.querySelector("#spEraser").classList.toggle("on",mode==="eraser"); }
  function pt(e){ var r=cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
  function down(e){ e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    cur={mode:mode,color:color,w:mode==="eraser"?28:(e.pointerType==="pen"?3:4),pts:[pt(e)]}; strokes.push(cur); redraw(); }
  function move(e){ if(!cur) return; e.preventDefault(); cur.pts.push(pt(e)); drawStroke(cur,true); }
  function up(){ cur=null; }
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
  function close(){ if(!panel) return; panel.hidden=true; openState=false; document.body.classList.remove("sp-open"); var b=document.getElementById("spBtn"); if(b){ b.textContent="📝 計算紙"; b.setAttribute("aria-expanded","false"); } }
  function toggle(){ openState?close():open(); }
  function reset(){ strokes=[]; cur=null; if(cv) redraw(); }
  return {isOpen:function(){return openState;}, open:open, close:close, toggle:toggle, reset:reset, _strokes:function(){return strokes.length;}};
})();

document.getElementById("homeBtn").onclick=home;
home();
})();
