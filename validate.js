// node validate.js — 檢查題庫
global.window={}; require("./data.js"); var D=window.PRACTICE_DATA, err=0, count={};
// ---- 結構檢查：單元 id 不重複、group 有定義、mix 指到的單元存在、題目不重複 ----
(function(){ var ids={}, S={}; D.subjects.forEach(function(s){ S[s.id]=s; if(!s.name||!s.icon){ console.log("科目缺名稱/圖示: "+s.id); err++; } });
 D.subjects.forEach(function(s){ var seenQ={}; s.units.forEach(function(u){
  if(ids[s.id+"/"+u.id]){ console.log("單元 id 重複: "+s.id+"/"+u.id); err++; } ids[s.id+"/"+u.id]=1;
  if(u.group&&!D.groups[u.group]){ console.log("group 未定義: "+u.id); err++; }
  if(u.mix) u.mix.forEach(function(g){ g.forEach(function(r){ var ms=S[r[0]], mu=ms&&ms.units.filter(function(x){return x.id===r[1];})[0]; if(!mu||!mu.questions.length){ console.log("mix 指到不存在或沒有題目的單元: "+u.id+" → "+r); err++; } }); });
  var tx={}; u.questions.forEach(function(q,i){ var k=q.q+"|"+(u.passage||"")+"|"+(q.options||[]).slice().sort().join(","); if(tx[k]){ console.log("單元內題目重複: "+u.id+"#"+(i+1)+" "+q.q.slice(0,20)); err++; } tx[k]=1; });
 }); });
})();
D.subjects.forEach(function(s){ s.units.forEach(function(u){ count[s.id+"/"+u.id]=u.questions.length+(u.mix?"(mix)":"");
 u.questions.forEach(function(q,i){ var id=u.id+"#"+(i+1);
  ["q","answer","hint"].forEach(function(k){ if(!q[k]){ console.log("缺 "+k+": "+id); err++; } });
  if(!Array.isArray(q.explain)||!q.explain.length){ console.log("缺 explain: "+id); err++; }
  if(q.say!==undefined && (typeof q.say!=="string"||!/^[\x20-\x7E]+$/.test(q.say))){ console.log("say 須為英文字串: "+id); err++; }
  if(q.type==="mc"){ if(q.options.indexOf(q.answer)<0){ console.log("答案不在選項: "+id); err++; } if(new Set(q.options).size!==q.options.length){console.log("選項重複: "+id);err++;} }
  else if(q.type==="num"){ if(!/^\d+$/.test(q.answer)){ console.log("數字答案格式: "+id); err++; }
   if(q.check===undefined){ console.log("缺 check: "+id); err++; } else if(String(eval(q.check))!==q.answer){ console.log("答案算錯: "+id+" "+q.check+"="+eval(q.check)+" ≠ "+q.answer); err++; } }
  else if(q.type==="spell"){ if(!/^[a-z]+$/.test(q.answer)){ console.log("拼字答案須為小寫英文字母: "+id); err++; } if(q.say!==q.answer){ console.log("拼字 say 應等於 answer: "+id); err++; } if(!q.hint||q.hint.indexOf(q.answer[0])<0){ console.log("拼字 hint 應含首字母: "+id); err++; } if(!/[\u4e00-\u9fff]/.test(q.q)){ console.log("拼字題須有中文意思: "+id); err++; } }
  else { console.log("type 錯誤: "+id); err++; }
 }); }); });
// ---- 數學產生器：每個跑 200 次 ----
var GEN=require("./gen.js"); require("./gen2.js"); var gcount={};
Object.keys(GEN.units).forEach(function(uid){ var found=false; D.subjects.forEach(function(s){ s.units.forEach(function(u){ if(u.id===uid){ found=true; if(!u.scratch){ console.log("產生器單元沒有計算紙: "+uid); err++; } } }); }); if(!found){ console.log("產生器對應不到單元: "+uid); err++; }
 GEN.units[uid].forEach(function(n){ if(!GEN.generators[n]){ console.log("找不到產生器: "+n); err++; } }); });
Object.keys(GEN.generators).forEach(function(n){ var texts={};
 for(var k=0;k<200;k++){ var seed=1+((k*2654435761)>>>0)%2147483646, q, id=n+"~"+seed;
  try{ q=GEN.make(n,seed); }catch(e){ console.log("產生器錯誤: "+id+" "+e.message); err++; continue; }
  var q2=GEN.make(n,seed); if(JSON.stringify(q)!==JSON.stringify(q2)){ console.log("同種子題目不同: "+id); err++; }
  if(q.gid!==id){ console.log("gid 錯: "+id); err++; }
  ["q","answer","hint"].forEach(function(f){ if(!q[f]&&q[f]!=="0"){ console.log("缺 "+f+": "+id); err++; } });
  if(!Array.isArray(q.explain)||!q.explain.length){ console.log("缺 explain: "+id); err++; }
  var all=q.q+" "+q.answer+" "+(q.options||[]).join(" ")+" "+q.explain.join(" ")+" "+q.hint;
  if(/NaN|undefined|Infinity|null/.test(all)){ console.log("出現 NaN/undefined: "+id+" "+q.q); err++; }
  if(/(^|[^\d])-\d|−\s*-/.test(q.q+" "+(q.options||[]).join(" "))){ console.log("出現負數: "+id+" "+q.q); err++; }
  (q.q.match(/\d+\.\d+/)||[]).forEach(function(){ console.log("出現小數: "+id); err++; });
  if(q.type==="num"){ if(!/^\d+$/.test(q.answer)||+q.answer<0||+q.answer>99999){ console.log("數字答案須為非負整數: "+id+" "+q.answer); err++; }
   if(q.answer.length>6){ console.log("答案超過鍵盤 6 位: "+id); err++; } }
  else if(q.type==="mc"){ if(!Array.isArray(q.options)||q.options.length<2){ console.log("選項不足: "+id); err++; }
   else { if(q.options.indexOf(q.answer)<0){ console.log("答案不在選項: "+id); err++; } if(new Set(q.options).size!==q.options.length){ console.log("選項重複: "+id+" "+q.options); err++; }
    q.options.forEach(function(o){ if(/^-|公分-|-\d/.test(o)){ console.log("選項有負數: "+id+" "+o); err++; } }); } }
  else { console.log("type 錯誤: "+id); err++; }
  texts[q.q+"|"+(q.options||[]).join(",")]=1; }
 gcount[n]=Object.keys(texts).length; });
console.log("產生器（200 次中不同題目數）：", gcount);
console.log(count); console.log(err? err+" 個錯誤":"全部通過 ✅"); process.exit(err?1:0);
