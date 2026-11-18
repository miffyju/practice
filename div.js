// 紫嫈的三年級加油站：直式除法（逐步練習）。只做三年級：二位數÷一位數、三位數÷一位數。
// 逐步：試商 → 相乘 → 相減 → 落下（最後一位後若有餘數，再填餘數、比一比餘數＜除數）。
(function(){
"use strict";
var A=window.P3_APP; if(!A) return;
var KEY_CFG="p3_div_cfg", KEY_REC="p3_div_recent", REC_MAX=40;
var esc=A.esc;
var DEF={types:["d2"],feat:"any",rem:"none",count:5};
var TYPE_NAME={d2:"二位數÷一位數",d3:"三位數÷一位數"};
var FEAT_NAME={any:"不限・混合",nz:"商沒有0",mid:"商中間有0",end0:"商個位是0"};
var FEAT_TAG={any:"商不限",nz:"商沒有0",mid:"商中間有0",end0:"商個位是0"};
var REM_NAME={none:"沒有餘數",has:"有餘數",mix:"混合練習"};
var REM_TAG={none:"沒有餘數",has:"有餘數",mix:"餘數混合"};
var OPNAME={trial:"試商",mul:"相乘",sub:"相減",drop:"落下",rem:"餘數",chk:"比大小"};
var PLACES=["個","十","百"];

function dg(x){ return String(x).length; }
function rnd(a){ return a[Math.floor(Math.random()*a.length)]; }
function loadJ(k,d){ try{ var v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } }
function saveJ(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

// ---------- 出題 ----------
function qfeat(q){
  var s=String(q), last=s.charAt(s.length-1), ten=s.length>=2?s.charAt(s.length-2):"";
  return {nz:s.indexOf("0")<0, mid:s.length>=3 && ten==="0" && last!=="0", end0:last==="0"};
}
var ALL=null;
function allProblems(){
  if(ALL) return ALL;
  ALL=[];
  [["d2",10,99],["d3",100,999]].forEach(function(t){
    for(var d=2;d<=9;d++) for(var N=t[1];N<=t[2];N++){
      var q=Math.floor(N/d); if(q<10) continue; // 商至少兩位，不出九九乘法就能做完的題
      ALL.push({N:N,d:d,q:q,r:N%d,t:t[0],f:qfeat(q)});
    }
  });
  return ALL;
}
function matches(p,t,feat,rem){
  if(p.t!==t) return false;
  if(rem==="none" && p.r!==0) return false;
  if(rem==="has" && p.r===0) return false;
  if(feat==="nz") return p.f.nz;
  if(feat==="mid") return p.f.mid;
  if(feat==="end0") return p.f.end0;
  return true;
}
function normCfg(c){
  c=c||{}; var o={types:[],feat:"any",rem:"none",count:5};
  ["d2","d3"].forEach(function(t){ if((c.types||[]).indexOf(t)>=0) o.types.push(t); });
  if(!o.types.length) o.types=DEF.types.slice();
  if(FEAT_NAME[c.feat]) o.feat=c.feat;
  if(REM_NAME[c.rem]) o.rem=c.rem;
  o.count=c.count===10?10:5;
  if(o.feat==="mid" && o.types.indexOf("d3")<0) o.feat="any"; // 二位數的商最多兩位，沒有「中間有0」
  return o;
}
var FORCE=[]; // 只給自動測試用：指定下一題
function pickProblem(cfg,used){
  if(FORCE.length){ var f=FORCE.shift(), fp=allProblems().filter(function(x){ return x.N===f[0]&&x.d===f[1]; })[0]; if(fp){ used[fp.N+"/"+fp.d]=1; return fp; } }
  var recent=loadJ(KEY_REC,[]); if(!Array.isArray(recent)) recent=[];
  var all=allProblems(), tries, p=null;
  for(tries=0;tries<60 && !p;tries++){
    var t=rnd(cfg.types), rr=cfg.rem==="mix"?rnd(["none","has"]):cfg.rem;
    var pool=all.filter(function(x){ return matches(x,t,cfg.feat,rr) && !used[x.N+"/"+x.d]; });
    if(!pool.length) continue;
    var fresh=pool.filter(function(x){ return recent.indexOf(x.N+"/"+x.d)<0; });
    p=rnd(fresh.length?fresh:pool);
  }
  if(!p){ // 保底：忽略本回合已出過的
    var pool2=all.filter(function(x){ return matches(x,cfg.types[0],cfg.feat,cfg.rem==="mix"?"none":cfg.rem); });
    p=rnd(pool2.length?pool2:all);
  }
  used[p.N+"/"+p.d]=1; recent.push(p.N+"/"+p.d); saveJ(KEY_REC,recent.slice(-REC_MAX));
  return p;
}
// 把一題展開成逐步清單
function buildProblem(P){
  var digs=String(P.N).split("").map(Number), n=digs.length, v=P.d;
  var s=digs[0]>=v?0:1, w=s===0?digs[0]:digs[0]*10+digs[1], steps=[], qs="", lastDiff=0, i;
  for(i=s;i<n;i++){
    var qd=Math.floor(w/v), prod=qd*v, diff=w-prod;
    qs+=qd;
    steps.push({k:"trial",i:i,w:w,v:v,qd:qd,ans:qd});
    steps.push({k:"mul",i:i,qd:qd,v:v,w:w,ans:prod});
    steps.push({k:"sub",i:i,w:w,prod:prod,v:v,ans:diff});
    if(i<n-1){ var nd=digs[i+1], nw=diff*10+nd; steps.push({k:"drop",i:i,diff:diff,nd:nd,ans:nw}); w=nw; }
    else lastDiff=diff;
  }
  if(lastDiff>0){ steps.push({k:"rem",r:lastDiff,v:v,ans:lastDiff}); steps.push({k:"chk",r:lastDiff,v:v,ans:"<"}); }
  return {N:P.N,d:P.d,q:P.q,r:P.r,n:n,s:s,digs:digs,steps:steps,qstr:qs};
}

// ---------- 文字 ----------
function place(st,n){ return PLACES[n-1-st.i]+"位"; }
function askText(st,n){
  switch(st.k){
    case "trial": return st.w+" ÷ "+st.v+"，商（"+place(st,n)+"）要寫幾？"+(st.w<st.v?"（夠不夠分呢？）":"");
    case "mul": return st.qd+" × "+st.v+" 等於多少？";
    case "sub": return st.w+" − "+st.prod+" 等於多少？";
    case "drop": return "把被除數的 "+st.nd+" 落下來，接在 "+st.diff+" 後面，現在要除的數是多少？";
    case "rem": return "最後剩下的數是多少？它就是餘數。";
    case "chk": return "餘數 "+st.r+" 和除數 "+st.v+" 比一比，哪個大？";
  }
  return "";
}
function hintText(st,lv){
  var v=st.v, k;
  switch(st.k){
    case "trial":
      if(st.qd===0) return lv===1?"看看 "+st.w+" 有沒有比 "+v+" 大？不夠分的話，商要寫幾？":st.w+" 比 "+v+" 小，分不到 1 個，所以商寫 0。";
      if(lv===1) return "想想 "+v+" 的乘法：「"+v+" × 幾」最接近 "+st.w+"，又不能比 "+st.w+" 大。";
      var a=[]; for(k=Math.max(1,st.qd-1);k<=st.qd+1;k++) a.push(v+"×"+k+"＝"+(v*k));
      return "試試看："+a.join("、")+"。不超過 "+st.w+" 的最大一個，就是答案。";
    case "mul":
      if(st.qd===0) return lv===1?"0 乘任何數是多少？":"0 × "+v+" ＝ 0。";
      if(lv===1) return st.qd+" 個 "+v+" 加起來，也可以用「"+v+" 的乘法表」想。";
      var b=[]; for(k=0;k<st.qd;k++) b.push(v); return b.join("＋")+" ＝ ？（共 "+st.qd+" 個 "+v+"）";
    case "sub":
      if(lv===1) return "用上面的數 "+st.w+"，減掉剛剛乘出來的 "+st.prod+"。";
      return "從 "+st.prod+" 往上數，數到 "+st.w+" 差多少？答案一定比除數 "+st.v+" 小。";
    case "drop":
      if(lv===1) return "看最上面的被除數：把 "+st.nd+" 從上面拉下來，寫在 "+st.diff+" 的右邊。";
      return st.diff+" 的後面接上 "+st.nd+"，變成 "+st.ans+(st.diff===0?"（前面是 0，就直接寫 "+st.ans+"）":"")+"。";
    case "rem":
      return lv===1?"看最後一行，最下面剩下的數就是餘數。":"最後一行是 "+st.r+"，所以餘數是 "+st.r+"。";
    case "chk":
      return lv===1?"除法的餘數一定要比除數小，不然還可以再分一次。":st.r+" 比 "+st.v+" 小，所以選「＜」。";
  }
  return "";
}
function wrongText(st,val){
  switch(st.k){
    case "trial":
      var p=val*st.v;
      if(p>st.w) return "太大囉～"+val+"×"+st.v+"＝"+p+"，比 "+st.w+" 還大。換一個小一點的數試試！";
      return "再大一點～"+val+"×"+st.v+"＝"+p+"，"+st.w+" 還剩 "+(st.w-p)+"，還夠再分一次（剩下的要比 "+st.v+" 小）。";
    case "mul": return "差一點點，再算一次 "+st.qd+" × "+st.v+"。";
    case "sub": return "再算一次～"+st.w+" 減 "+st.prod+"。"+"（相減後剩下的數，會比除數 "+st.v+" 小。）";
    case "drop": return "把 "+st.nd+" 接在 "+st.diff+" 的後面，看看變成什麼數？";
    case "rem": return "最後一行剩下的數就是餘數，再看一次。";
    case "chk": return "餘數要比除數小才算除完喔，再比一比 "+st.r+" 和 "+st.v+"。";
  }
  return "";
}
function revealText(st){
  switch(st.k){
    case "trial": return st.qd+"×"+st.v+"＝"+(st.qd*st.v)+"，不超過 "+st.w+"，所以商寫 "+st.qd+"。";
    case "mul": return st.qd+"×"+st.v+"＝"+st.ans+"。";
    case "sub": return st.w+"−"+st.prod+"＝"+st.ans+"。";
    case "drop": return st.diff+" 後面接 "+st.nd+"，變成 "+st.ans+"。";
    case "rem": return "餘數是 "+st.ans+"。";
    case "chk": return st.r+" 比 "+st.v+" 小，用「＜」。";
  }
  return "";
}
function expr(st){
  switch(st.k){
    case "trial": return st.w+"÷"+st.v;
    case "mul": return st.qd+"×"+st.v;
    case "sub": return st.w+"−"+st.prod;
    case "drop": return st.diff+"落下"+st.nd;
    case "rem": return "最後剩下的數";
    case "chk": return st.r+"與"+st.v;
  }
  return "";
}

// ---------- 狀態 ----------
var S=null, rootEl=null, lastPD=0;

function setupPage(){
  var cfg=normCfg(loadJ(KEY_CFG,DEF));
  S=null;
  var only2=cfg.types.indexOf("d3")<0;
  function opt(group,val,label,on,dis){ return '<button type="button" class="dv-opt'+(on?' on':'')+(dis?' dis':'')+'" data-g="'+group+'" data-v="'+val+'" aria-pressed="'+(on?"true":"false")+'"'+(dis?' aria-disabled="true"':'')+'>'+label+'</button>'; }
  var h='<div class="dv-top"><button type="button" class="dv-back" data-a="back" aria-label="回數學單元">← 數學</button><h2 class="dv-title">直式除法</h2></div>'+
    '<div class="card dv-set"><h3 class="dv-h">今天想練什麼？</h3><div class="dv-grade">三年級</div>';
  h+='<div class="dv-sec"><div class="dv-lab"><b>①</b> 選擇練習題型<small>（可以兩個都選）</small></div><div class="dv-opts">'+
    ["d2","d3"].map(function(t){ return opt("types",t,TYPE_NAME[t],cfg.types.indexOf(t)>=0); }).join("")+'</div></div>';
  h+='<div class="dv-sec"><div class="dv-lab"><b>②</b> 商的特徵</div><div class="dv-opts">'+
    ["any","nz","mid","end0"].map(function(f){ var dis=(f==="mid"&&only2); return opt("feat",f,FEAT_NAME[f],cfg.feat===f,dis); }).join("")+'</div>'+
    '<p class="dv-note" id="dvNote"'+(only2?'':' hidden')+'>這個題型的商最多兩位，無法選「商中間有 0」。</p></div>';
  h+='<div class="dv-sec"><div class="dv-lab"><b>③</b> 餘數類型</div><div class="dv-opts">'+
    ["none","has","mix"].map(function(r){ return opt("rem",r,REM_NAME[r],cfg.rem===r); }).join("")+'</div></div>';
  h+='<div class="dv-sec"><div class="dv-lab"><b>④</b> 練習題數</div><div class="dv-opts">'+
    [5,10].map(function(c){ return opt("count",c,c+" 題",cfg.count===c); }).join("")+'</div></div>';
  h+='<button type="button" class="big primary dv-go" data-a="go">開始練習 ➡</button></div>';
  A.el(h);
  rootEl=A.app; rootEl.dataset.dv="setup"; S={cfg:cfg,setup:true};
  bindRoot();
}
function readOpts(){
  var cfg=S.cfg;
  rootEl.querySelectorAll(".dv-opt").forEach(function(b){ b.classList.toggle("on", false); });
  var only2=cfg.types.indexOf("d3")<0;
  rootEl.querySelectorAll(".dv-opt").forEach(function(b){
    var g=b.dataset.g, v=b.dataset.v, on=false;
    if(g==="types") on=cfg.types.indexOf(v)>=0;
    else if(g==="feat") on=cfg.feat===v;
    else if(g==="rem") on=cfg.rem===v;
    else if(g==="count") on=cfg.count===+v;
    var dis=(g==="feat"&&v==="mid"&&only2);
    b.classList.toggle("on",on); b.classList.toggle("dis",dis);
    b.setAttribute("aria-pressed",on?"true":"false");
    if(dis) b.setAttribute("aria-disabled","true"); else b.removeAttribute("aria-disabled");
  });
  var note=document.getElementById("dvNote"); if(note) note.hidden=!only2;
}
function onOpt(b){
  var cfg=S.cfg, g=b.dataset.g, v=b.dataset.v;
  if(g==="types"){
    var i=cfg.types.indexOf(v);
    if(i>=0){ if(cfg.types.length>1) cfg.types.splice(i,1); else A.toast("至少要選一種題型喔"); }
    else cfg.types.push(v);
    if(cfg.types.indexOf("d3")<0 && cfg.feat==="mid") cfg.feat="any";
  } else if(g==="feat"){
    if(b.classList.contains("dis")){ A.toast("這個題型的商最多兩位，無法選「商中間有 0」。"); return; }
    cfg.feat=v;
  } else if(g==="rem") cfg.rem=v;
  else if(g==="count") cfg.count=+v;
  S.cfg=normCfg(cfg); saveJ(KEY_CFG,S.cfg); readOpts();
}

function startRound(cfg){
  cfg=normCfg(cfg); saveJ(KEY_CFG,cfg);
  S={cfg:cfg,n:cfg.count,idx:0,results:[],used:{},cur:null};
  newProblem();
  renderAll();
}
function newProblem(){
  var P=buildProblem(pickProblem(S.cfg,S.used));
  S.cur={P:P,si:0,typed:"",vals:[],tries:[],events:[],hints:0,hintLv:0,revealed:0,msg:null,done:false};
}
function stepNow(){ return S.cur.P.steps[S.cur.si]; }

// ---------- 畫面 ----------
function tagLine(){
  var c=S.cfg, t=c.types.length===2?"二位數／三位數÷一位數":TYPE_NAME[c.types[0]];
  return "三年級・第 "+(S.idx+1)+" / "+S.n+" 題・"+t+"・"+FEAT_TAG[c.feat]+"・"+REM_TAG[c.rem];
}
function progressHTML(){
  var n=S.n, p=S.idx/n*100;
  return '<div class="progress dv-progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+n+'" aria-valuenow="'+S.idx+'" style="--p:'+p+'%"><div></div><span class="pchick" aria-hidden="true"><span class="pchick-i">'+A.chickSVG()+'</span></span></div>';
}
function renderAll(){
  var h='<div class="dv-top"><button type="button" class="dv-back" data-a="settings" aria-label="回設定">← 設定</button><h2 class="dv-title">直式除法</h2><div class="muted tag dv-tagline">'+esc(tagLine())+'</div></div>'+
    '<div id="dvProg">'+progressHTML()+'</div><div id="dvBody"></div>';
  A.el(h); rootEl=A.app; rootEl.dataset.dv="play";
  renderBody(); bindRoot();
  var pg=rootEl.querySelector(".progress"); if(pg){ var target=S.idx/S.n*100; pg.style.setProperty("--p",target+"%"); }
  focusCard();
}
// 小螢幕：一整題（算式＋提示＋數字鍵）一次看得到，不用每題都自己往下捲
function focusCard(){
  requestAnimationFrame(function(){
    var de=document.documentElement; if(de.scrollHeight<=window.innerHeight+4) return;
    var card=rootEl.querySelector(".dv-card"), bar=document.querySelector(".topbar"); if(!card) return;
    var y=card.getBoundingClientRect().top+(window.pageYOffset||0)-(bar?bar.getBoundingClientRect().height:0)-6;
    window.scrollTo(0,Math.max(0,y));
  });
}
function topAgain(){
  var reduced=false; try{ reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}
  try{ window.scrollTo({top:0,behavior:reduced?"auto":"smooth"}); }catch(e){ window.scrollTo(0,0); }
}
function numCells(spec,row,txt,endCol){
  for(var k=0;k<txt.length;k++){ var c=endCol-txt.length+1+k; if(c>=0&&c<row.length) row[c].t=txt.charAt(k); }
}
function rowHTML(left,row,box,right,rowCls){
  var n=row.length, h='<div class="dv-l '+(rowCls||"")+'">'+(left||"")+'</div>', c=0;
  while(c<n){
    if(box && c===box.c0){
      h+='<div class="dv-c dv-box'+(box.cur?' cur':'')+'" style="grid-column:span '+(box.c1-box.c0+1)+'"'+(box.cur?' id="dvLive" aria-live="polite"':'')+'>'+esc(box.t||"")+'</div>';
      c=box.c1+1; continue;
    }
    h+='<div class="dv-c '+row[c].cls+(row[c].ul?' ul':'')+(row[c].dd?' dd':'')+(row[c].first?' first':'')+'">'+esc(row[c].t||"")+'</div>'; c++;
  }
  if(right!==null) h+='<div class="dv-r">'+(right||"")+'</div>';
  return h;
}
function gridHTML(){
  var c=S.cur, P=c.P, n=P.n, s=P.s, steps=P.steps, cur=c.done?null:steps[c.si];
  var colCls=n===3?["ch","ct","co"]:["ct","co"], labels=n===3?["百","十","個"]:["十","個"], hasRem=P.r>0;
  function blank(){ var r=[]; for(var i=0;i<n;i++) r.push({t:"",cls:colCls[i],ul:false}); return r; }
  function idxOf(i,k){ for(var j=0;j<steps.length;j++) if(steps[j].i===i&&steps[j].k===k) return j; return -1; }
  function done(j){ return j>=0 && (c.done || j<c.si); }
  function isCur(j){ return j>=0 && !c.done && j===c.si; }
  var h='<div class="dv-grid n'+n+'" style="grid-template-columns:var(--dvl) repeat('+n+',var(--dvc))'+(hasRem?' var(--dvr)':'')+'">';
  // 欄位標籤
  h+='<div class="dv-l"></div>'; labels.forEach(function(t,i){ h+='<div class="dv-lb '+colCls[i]+'">'+t+'</div>'; }); if(hasRem) h+='<div class="dv-r"></div>';
  // 商
  var qrow=blank(), qbox=null, i;
  for(i=s;i<n;i++){
    var jt=idxOf(i,"trial");
    if(done(jt)) qrow[i].t=String(steps[jt].ans);
    else if(isCur(jt)) qbox={c0:i,c1:i,cur:true,t:c.typed};
  }
  var remHTML=null;
  if(hasRem){
    var jr=-1; steps.forEach(function(st,j){ if(st.k==="rem") jr=j; });
    if(done(jr)) remHTML='<span class="dv-rl">…餘</span><span class="dv-rv">'+P.r+'</span>';
    else if(isCur(jr)) remHTML='<span class="dv-rl">…餘</span><span class="dv-box cur" id="dvLive" aria-live="polite">'+esc(c.typed)+'</span>';
    else remHTML="";
  }
  h+=rowHTML("",qrow,qbox,remHTML,"q");
  // 被除數列
  var drow=blank(); for(i=0;i<n;i++){ drow[i].t=String(P.digs[i]); drow[i].dd=true; if(i===0) drow[i].first=true; }
  h+=rowHTML('<span class="dv-divisor">'+P.d+'</span>',drow,null,hasRem?"":null,"d");
  // 每一位：乘積列、相減（落下）列
  for(i=s;i<n;i++){
    var jm=idxOf(i,"mul"), js=idxOf(i,"sub"), jd=idxOf(i,"drop"), prow=blank(), pbox=null, st;
    st=steps[jm];
    var wl=dg(st.w), pl=dg(st.ans), ulStart=i-Math.max(wl,pl)+1, show=done(jm)||isCur(jm);
    if(show) for(var u=ulStart;u<=i;u++) if(u>=0) prow[u].ul=true;
    if(done(jm)) numCells(null,prow,String(st.ans),i);
    else if(isCur(jm)) pbox={c0:i-pl+1,c1:i,cur:true,t:c.typed};
    h+=rowHTML("",prow,pbox,hasRem?"":null,"p");
    var srow=blank(), sbox=null;
    var ss=steps[js];
    if(jd>=0 && done(jd)) numCells(null,srow,String(steps[jd].ans),i+1);
    else if(jd>=0 && isCur(jd)){ var wd=dg(steps[jd].ans); sbox={c0:i+2-wd,c1:i+1,cur:true,t:c.typed}; }
    else if(done(js)) numCells(null,srow,String(ss.ans),i);
    else if(isCur(js)) sbox={c0:i,c1:i,cur:true,t:c.typed};
    h+=rowHTML("",srow,sbox,hasRem?"":null,"s");
  }
  return h+'</div>';
}
function keypadHTML(){
  var keys=["1","2","3","4","5","6","7","8","9","⌫","0","✔"], h='<div class="dv-pad" role="group" aria-label="數字鍵盤">';
  keys.forEach(function(k){
    var lab=k==="⌫"?"刪除":k==="✔"?"確認":k;
    h+='<button type="button" class="dv-k'+(k==="✔"?' ok':k==="⌫"?' bk':'')+'" data-k="'+k+'" aria-label="'+lab+'">'+(k==="✔"?"確認":k)+'</button>';
  });
  return h+'</div>';
}
function renderBody(){
  var c=S.cur, P=c.P, body=document.getElementById("dvBody"); if(!body) return;
  var last=S.idx===S.n-1;
  var h='<div class="dv-play"><div class="card dv-card"><div class="dv-prob" aria-label="'+P.N+' 除以 '+P.d+'">'+P.N+' ÷ '+P.d+'</div>'+gridHTML()+'</div><div class="dv-side">';
  if(c.done){
    var chk=P.r>0?P.q+" × "+P.d+" ＋ "+P.r+" ＝ "+P.N:P.q+" × "+P.d+" ＝ "+P.N;
    var extra=c.events.length?'<p class="dv-miss">這一題有算錯的地方，我已經記起來，等一下一起看。</p>':"";
    h+='<div class="dv-dock"><div class="dv-fb good pop"><b class="fb-title">🎉 '+esc(A.pick(["太棒了！","算完囉，好厲害！","完全正確！⭐","你真會算！"]))+'</b><p class="dv-ans">'+P.N+' ÷ '+P.d+' ＝ '+P.q+(P.r>0?' …… 餘 '+P.r:'')+'</p><p class="dv-verify">驗算：'+chk+'</p>'+extra+'</div>';
    h+='<div class="row dv-next"><button type="button" class="big primary" data-a="next" id="dvNext">'+(last?"看成績 🏁":"下一題 ➡")+'</button></div></div>';
  } else {
    var st=stepNow();
    h+='<div class="dv-ask"><div class="dv-ask-h">這一步要算什麼？</div><div class="dv-ask-b"><span class="dv-steptag t-'+st.k+'">'+OPNAME[st.k]+'</span><span class="dv-q">'+esc(askText(st,P.n))+'</span></div></div>';
    h+='<div class="dv-dock"><div class="dv-fbwrap" id="dvFb">'+(c.msg?fbHTML(c.msg):"")+'</div>';
    if(st.k==="chk"){
      h+='<div class="dv-cmp" role="group" aria-label="比大小">'+
        [["<","＜","餘數比較小"],["=","＝","一樣大"],[">","＞","餘數比較大"]].map(function(x){ return '<button type="button" class="dv-cmpb" data-cmp="'+x[0]+'"><b>'+x[1]+'</b><small>'+x[2]+'</small></button>'; }).join("")+'</div>';
    } else h+=keypadHTML();
    h+='<div class="row dv-acts"><button type="button" class="big secondary" data-a="hint" id="dvHint">💡 '+(c.hintLv===0?"給我一點提示":"再多一點提示")+'</button><button type="button" class="big secondary" data-a="swap">🔀 換一題</button></div></div>';
  }
  h+='</div></div>';
  body.innerHTML=h;
}
function fbHTML(m){ return '<div class="dv-fb '+m.type+'">'+m.html+'</div>'; }
function setMsg(type,html){ S.cur.msg={type:type,html:html}; var f=document.getElementById("dvFb"); if(f) f.innerHTML=fbHTML(S.cur.msg); }
function paintLive(){ var e=document.getElementById("dvLive"); if(e) e.textContent=S.cur.typed; }

// ---------- 操作 ----------
function pressKey(k){
  if(!S||!S.cur||S.cur.done) return;
  var st=stepNow(); if(st.k==="chk") return;
  var cap=Math.max(2,dg(st.ans)+1);
  if(k==="⌫") S.cur.typed=S.cur.typed.slice(0,-1);
  else if(k==="✔"){ submit(); return; }
  else if(/^[0-9]$/.test(k) && S.cur.typed.length<cap) S.cur.typed=S.cur.typed+k;
  paintLive();
}
function submit(){
  var c=S.cur; if(!c||c.done) return;
  if(c.typed===""){ A.toast("先輸入答案喔"); return; }
  judge(parseInt(c.typed,10), c.typed);
}
function judge(val,shown){
  var c=S.cur, st=stepNow(), si=c.si, ok=(val===st.ans);
  c.tries[si]=(c.tries[si]||0);
  if(ok){ c.vals[si]=val; advance(true); return; }
  c.tries[si]++;
  c.events.push({si:si,k:st.k,i:st.i,expr:expr(st),typed:shown,ans:st.ans,rev:false});
  if(c.tries[si]>=2){
    c.events[c.events.length-1].rev=true; c.revealed++;
    c.vals[si]=st.ans;
    advance(false, revealText(st));
  } else {
    c.typed="";
    setMsg("hint",'<p><b>💪 '+esc(A.pick(["沒關係！","差一點點！","慢慢來！"]))+'</b> '+esc(wrongText(st,val))+' <span class="muted">（再試一次）</span></p>');
    renderBody();
    fbReveal();
  }
}
function pickCmp(sym){
  var c=S.cur; if(!c||c.done) return; var st=stepNow(); if(st.k!=="chk") return;
  var si=c.si; c.tries[si]=c.tries[si]||0;
  if(sym===st.ans){ c.vals[si]=sym; advance(true); return; }
  c.tries[si]++;
  c.events.push({si:si,k:st.k,i:st.i,expr:expr(st),typed:({"=":"＝",">":"＞","<":"＜"})[sym],ans:"＜",rev:false});
  if(c.tries[si]>=2){ c.events[c.events.length-1].rev=true; c.revealed++; c.vals[si]=st.ans; advance(false,revealText(st)); }
  else { setMsg("hint",'<p><b>💪 再想一想！</b> '+esc(wrongText(st,sym))+' <span class="muted">（再試一次）</span></p>'); }
}
function advance(ok,revealMsg){
  var c=S.cur;
  c.si++; c.typed=""; c.hintLv=0;
  if(c.si>=c.P.steps.length){ finishProblem(); return; }
  if(ok) c.msg={type:"good small",html:"✅ "+esc(A.pick(["對囉！","沒錯！","算對了！","很棒！"]))+" 繼續下一步。"};
  else c.msg={type:"explain",html:'<p><b>🌈 沒關係，我們一起看：</b>'+esc(revealMsg)+' <span class="muted">答案先幫你填好，繼續往下算吧！</span></p>'};
  renderBody();
  if(!ok) fbReveal();
}
function fbReveal(){
  var f=document.getElementById("dvFb"); if(!f||!f.firstChild) return;
  requestAnimationFrame(function(){
    if(!window.matchMedia("(max-width:720px)").matches) return;
    var r=f.getBoundingClientRect(), bar=document.querySelector(".topbar"), top=(bar?bar.getBoundingClientRect().height:0)+6;
    if(r.top<top || r.bottom>window.innerHeight-6){ try{ f.scrollIntoView({block:"nearest",behavior:"smooth"}); }catch(e){} }
  });
}
function giveHint(){
  var c=S.cur; if(!c||c.done) return; var st=stepNow();
  c.hintLv=Math.min(2,c.hintLv+1); c.hints++;
  c.msg={type:"hint",html:'<p><b>💡 提示：</b>'+esc(hintText(st,c.hintLv))+'</p>'};
  renderBody(); fbReveal();
}
function swap(){
  if(!S||!S.cur||S.cur.done) return;
  newProblem(); renderBody();
  var t=rootEl.querySelector(".dv-tagline"); if(t) t.textContent=tagLine();
  A.toast("換成新的題目囉！");
}
function eventDetail(c){
  var parts=c.events.map(function(e){
    var P=c.P;
    return (e.i==null?"":PLACES[P.n-1-e.i]+"位")+OPNAME[e.k]+"（"+e.expr+"）她答"+e.typed+"，正解"+(e.k==="chk"?"＜":e.ans)+(e.rev?"（看了答案）":"");
  });
  var t="錯在："+parts.join("；");
  if(c.hints>0) t+="；用了提示 "+c.hints+" 次";
  return t;
}
function finishProblem(){
  var c=S.cur, P=c.P; c.done=true;
  var firstTry=c.events.length===0, correct=c.revealed===0;
  var ansStr=P.r>0?P.q+" 餘 "+P.r:String(P.q);
  var detail=firstTry?"":eventDetail(c);
  S.results.push({it:{sid:"math",uid:"mdiv",idx:S.idx,custom:"longdiv"},q:P.N+" ÷ "+P.d,unit:"直式除法",
    tries:firstTry?[ansStr]:[detail],answer:ansStr,correct:correct,firstTry:firstTry,detail:detail});
  A.celebrate();
  var last=S.idx===S.n-1, bar=rootEl.querySelector(".progress");
  if(bar){
    var pct=(S.idx+1)/S.n*100;
    bar.setAttribute("aria-valuenow",S.idx+1);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      bar.style.setProperty("--p",pct+"%"); bar.classList.add("walking");
      if(last){ bar.classList.add("finished"); var svg=bar.querySelector(".chick-svg"); if(svg) svg.classList.add("is-celeb"); }
      setTimeout(function(){ bar.classList.remove("walking"); },700);
    }); });
  }
  renderBody(); topAgain();
  var nb=document.getElementById("dvNext"); if(nb){ try{ nb.focus({preventScroll:true}); }catch(e){ nb.focus(); } }
}
function nextProblem(){
  if(!S||!S.cur||!S.cur.done) return;
  if(S.idx>=S.n-1){
    A.setRound({sname:"數學",uname:"直式除法",items:S.results.map(function(r){return r.it;}),i:S.n-1,results:S.results,isWB:false,src:{custom:"longdiv",cfg:S.cfg}});
    A.end(); return;
  }
  S.idx++; newProblem(); renderAll();
}
function toSettings(){
  if(S && S.cur && (S.idx>0 || S.cur.si>0) && !S.cur.done){ if(!confirm("要回到設定嗎？這一回合的進度不會保留。")) return; }
  else if(S && S.idx>0 && S.cur && S.cur.done && S.idx<S.n-1){ if(!confirm("要回到設定嗎？這一回合的進度不會保留。")) return; }
  setupPage();
}

// ---------- 事件（整個畫面共用一組，換畫面不用重綁） ----------
var KEYS_ON=false;
function bindRoot(){
  var root=A.app;
  if(root.dataset.dvBound!=="1"){
    root.dataset.dvBound="1";
    root.addEventListener("pointerdown",function(e){
      var b=e.target.closest&&e.target.closest("[data-k]"); if(!b||!root.dataset.dv) return;
      if(e.pointerType==="mouse"&&e.button>0) return;
      e.preventDefault(); lastPD=Date.now(); pressKey(b.dataset.k);
    });
    root.addEventListener("click",function(e){
      if(!root.dataset.dv) return;
      var t=e.target.closest&&e.target.closest("button"); if(!t||!root.contains(t)) return;
      if(t.dataset.k!==undefined){ if(Date.now()-lastPD<700) { e.preventDefault(); return; } pressKey(t.dataset.k); return; }
      if(t.dataset.cmp!==undefined){ pickCmp(t.dataset.cmp); return; }
      if(t.classList.contains("dv-opt")){ onOpt(t); return; }
      var a=t.dataset.a; if(!a) return;
      if(a==="go") startRound(S.cfg);
      else if(a==="back") A.units("math");
      else if(a==="settings") toSettings();
      else if(a==="hint") giveHint();
      else if(a==="swap") swap();
      else if(a==="next") nextProblem();
    });
  }
  if(!KEYS_ON){
    KEYS_ON=true;
    document.addEventListener("keydown",function(e){
      if(!A.app.dataset.dv || A.app.dataset.dv!=="play" || !S || !S.cur || S.cur.done) return;
      var t=e.target; if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)) return;
      if(!document.getElementById("dvBody")) return;
      var k=e.key;
      if(k==="Enter"){ if(t&&t.tagName==="BUTTON"&&t.dataset.a) return; e.preventDefault(); if(stepNow().k!=="chk") submit(); return; }
      if(k==="Backspace"){ e.preventDefault(); pressKey("⌫"); return; }
      if(/^[0-9]$/.test(k)){ e.preventDefault(); pressKey(k); }
      else if(stepNow().k==="chk"){ if(k==="<"||k===","){ pickCmp("<"); } else if(k===">"||k==="."){ pickCmp(">"); } else if(k==="="){ pickCmp("="); } }
    },true);
  }
}

A.registerCustom("longdiv",{
  open:function(){ setupPage(); },
  again:function(src){ startRound((src&&src.cfg)||normCfg(loadJ(KEY_CFG,DEF))); }
});
window.__p3Div={force:function(a){ FORCE=a.slice(); },buildProblem:buildProblem,pickProblem:pickProblem,allProblems:allProblems,normCfg:normCfg,matches:matches,qfeat:qfeat,state:function(){return S;},startRound:startRound,pressKey:pressKey,pickCmp:pickCmp,stepNow:function(){return S&&S.cur&&!S.cur.done?stepNow():null;}};
})();
