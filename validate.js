// node validate.js — 檢查題庫
global.window={}; require("./data.js"); var D=window.PRACTICE_DATA, err=0, count={};
D.subjects.forEach(function(s){ s.units.forEach(function(u){ count[s.name+" / "+u.name]=u.questions.length;
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
console.log(count); console.log(err? err+" 個錯誤":"全部通過 ✅"); process.exit(err?1:0);
