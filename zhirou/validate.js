// node validate.js — 檢查題庫
global.window={}; require("./data.js"); require("./archive.js"); require("./extra.js"); require("./olympiad.js"); require("./gen.js");
var D=window.PRACTICE_DATA, err=0, count={}, seenN={};
function W(n){ var a="zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" "), t={2:"twenty",3:"thirty",4:"forty",5:"fifty",6:"sixty",7:"seventy",8:"eighty",9:"ninety"};
 return n===100?"one hundred":n<20?a[n]:t[(n-n%10)/10]+(n%10?"-"+a[n%10]:""); }
function checkQs(label, u, skipN){
  (u.questions||[]).forEach(function(q,i){ var id=label+"/"+u.id+"#"+(i+1);
   ["q","answer","hint"].forEach(function(k){ if(!q[k]&&q[k]!==0){ console.log("缺 "+k+": "+id); err++; } });
   if(!Array.isArray(q.explain)||!q.explain.length){ console.log("缺 explain: "+id); err++; }
   if(q.say!==undefined && (typeof q.say!=="string"||!/^[\x20-\x7E]+$/.test(q.say))){ console.log("say 須為英文字串: "+id+" → "+q.say); err++; }
   if(q.type==="mc"){ if(!q.options||q.options.indexOf(q.answer)<0){ console.log("答案不在選項: "+id); err++; } if(new Set(q.options).size!==q.options.length){console.log("選項重複: "+id);err++;} if(q.options.length<2){ console.log("選項少於2: "+id); err++; } }
   else if(q.type==="num"){ if(!/^\d+$/.test(String(q.answer))){ console.log("數字答案格式: "+id); err++; }
    if(q.check===undefined){ console.log("缺 check: "+id); err++; } else if(String(eval(q.check))!==String(q.answer)){ console.log("答案算錯: "+id+" "+q.check+"="+eval(q.check)+" ≠ "+q.answer); err++; } }
   else if(q.type==="fill"){ if(typeof q.answer!=="string"||!String(q.answer).trim()){ console.log("填充題答案空: "+id); err++; }
    if(q.accept&&!Array.isArray(q.accept)){ console.log("accept 須為陣列: "+id); err++; }
    if(q.check!==undefined && String(eval(q.check))!==String(q.answer)){ console.log("答案算錯: "+id+" "+q.check+"="+eval(q.check)+" ≠ "+q.answer); err++; } }
   else if(q.type==="text"){ if(typeof q.answer!=="string"||!/^[a-z][a-z \-]*$/.test(q.answer)){ console.log("打字題答案格式: "+id+" → "+q.answer); err++; }
    if(q.accept&&!Array.isArray(q.accept)){ console.log("accept 須為陣列: "+id); err++; }
    if(q.n!==undefined){ if(!skipN){ seenN[q.n]=(seenN[q.n]||0)+1; } if(q.answer!==W(q.n)){ console.log("數字拼字錯: "+id+" "+q.n+" "+q.answer+" ≠ "+W(q.n)); err++; } } }
   else { console.log("type 錯誤: "+id+" "+q.type); err++; }
  });
}
D.subjects.forEach(function(s){ s.units.forEach(function(u){
  var n=(u.questions||[]).length;
  count[s.name+" / "+u.name]=(u.gen?"🎲"+ (u.gen.length)+"個產生器, ":"")+"固定題 "+n;
  var need=u.minQ!=null?u.minQ:15; if(!u.gen && n<need){ console.log("單元題數不足"+need+": "+s.name+" / "+u.name+" = "+n); err++; }
  checkQs(s.name,u);
 }); });
(window.PRACTICE_ARCHIVE||[]).forEach(function(u){ checkQs("archive",u,true); });
if(Object.keys(seenN).length){ for(var k=0;k<=100;k++) if(seenN[k]!==1){ console.log("數字題缺漏或重複: "+k+" ×"+(seenN[k]||0)); err++; } }
console.log(count);
console.log(err? err+" 個錯誤":"全部通過 ✅");
process.exit(err?1:0);
