// node validate.js — 檢查題庫
global.window={}; require("./data.js"); require("./extra.js"); require("./gen.js"); var D=window.PRACTICE_DATA, err=0, count={}, seenN={};
// 獨立的數字拼字表（和 data.js 分開寫，用來交叉核對）
function W(n){ var a="zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" "), t={2:"twenty",3:"thirty",4:"forty",5:"fifty",6:"sixty",7:"seventy",8:"eighty",9:"ninety"};
 return n===100?"one hundred":n<20?a[n]:t[(n-n%10)/10]+(n%10?"-"+a[n%10]:""); }
D.subjects.forEach(function(s){ s.units.forEach(function(u){ count[s.name+" / "+u.name]=u.questions.length;
 u.questions.forEach(function(q,i){ var id=u.id+"#"+(i+1);
  ["q","answer","hint"].forEach(function(k){ if(!q[k]){ console.log("缺 "+k+": "+id); err++; } });
  if(!Array.isArray(q.explain)||!q.explain.length){ console.log("缺 explain: "+id); err++; }
  if(q.say!==undefined && (typeof q.say!=="string"||!/^[\x20-\x7E]+$/.test(q.say))){ console.log("say 須為英文字串: "+id); err++; }
  if(q.type==="mc"){ if(q.options.indexOf(q.answer)<0){ console.log("答案不在選項: "+id); err++; } if(new Set(q.options).size!==q.options.length){console.log("選項重複: "+id);err++;} }
  else if(q.type==="num"){ if(!/^\d+$/.test(q.answer)){ console.log("數字答案格式: "+id); err++; }
   if(q.check===undefined){ console.log("缺 check: "+id); err++; } else if(String(eval(q.check))!==q.answer){ console.log("答案算錯: "+id+" "+q.check+"="+eval(q.check)+" ≠ "+q.answer); err++; } }
  else if(q.type==="text"){ if(typeof q.answer!=="string"||!/^[a-z][a-z \-]*$/.test(q.answer)){ console.log("打字題答案格式: "+id); err++; }
   if(q.accept&&!Array.isArray(q.accept)){ console.log("accept 須為陣列: "+id); err++; }
   if(q.n!==undefined){ seenN[q.n]=(seenN[q.n]||0)+1; if(q.answer!==W(q.n)){ console.log("數字拼字錯: "+id+" "+q.n+" "+q.answer+" ≠ "+W(q.n)); err++; } } }
  else { console.log("type 錯誤: "+id); err++; }
 }); }); });
if(Object.keys(seenN).length){ for(var k=0;k<=100;k++) if(seenN[k]!==1){ console.log("數字題缺漏或重複: "+k); err++; } }
console.log(count); console.log(err? err+" 個錯誤":"全部通過 ✅"); process.exit(err?1:0);
