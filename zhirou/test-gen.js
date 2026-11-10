// node test-gen.js — 每個產生器出 200 題，檢查格式與答案
global.window={}; require("./data.js"); require("./archive.js"); require("./extra.js"); require("./gen.js");
var G=window.PRACTICE_GEN, err=0, made=0;
function bad(k,m,q){ err++; if(err<40) console.log("✗",k,m,q?JSON.stringify(q).slice(0,240):""); }
G.list.forEach(function(k){ var texts={};
  for(var i=0;i<200;i++){ var q; try{ q=G.make(k); }catch(e){ bad(k,"例外 "+e.message); continue; } made++;
    var js=JSON.stringify(q); if(/NaN|undefined|Infinity/.test(js)) bad(k,"NaN/undefined",q);
    if(!/[\u4e00-\u9fff]/.test(q.q)) bad(k,"題目沒有中文",q);
    if(!q.hint||!Array.isArray(q.explain)||!q.explain.length) bad(k,"缺 hint/explain",q);
    if(q.type==="mc"){ if(q.options.indexOf(String(q.answer))<0 && q.options.indexOf(q.answer)<0) bad(k,"答案不在選項",q);
      if(new Set(q.options).size!==q.options.length) bad(k,"選項重複",q); if(q.options.length<3) bad(k,"選項少於3",q);
      q.options.forEach(function(o){ if(/^−/.test(o) || (/^-/.test(o)&&/^\-?\d/.test(o))) bad(k,"負數選項",q); }); }
    texts[q.q]=1; }
  console.log(k, "不同題目數/200 =", Object.keys(texts).length); });
function g(a,b){ return b?g(b,a%b):Math.abs(a); }
for(var i=0;i<500;i++){ var q=G.make("frac_reduce"), m=/(\d+)\/(\d+)/.exec(q.q), a=q.answer.split("/").map(Number);
  if(a[0]*m[2]!=a[1]*m[1]||g(a[0],a[1])!==1) bad("frac_reduce","答案錯",q); }
for(i=0;i<500;i++){ var q=G.make("order_ops"), e=q.q.replace("計算：","").replace(" = ？","").replace(" = ？（用分配律會比較快）","").replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
  if(String(eval(e))!==String(q.answer)) bad("order_ops","答案錯",q); }
function pf(s){ var m=/^(\d+)又(\d+)\/(\d+)$/.exec(s); if(m) return [m[1]*m[3]+ +m[2], +m[3]]; m=/^(\d+)\/(\d+)$/.exec(s); if(m) return [+m[1], +m[3]?+m[2]:+m[2], m[3]?+m[3]:1]; if(m) return [+m[1], +m[2]]; return [+s,1]; }
function pf2(s){ var m=/^(\d+)又(\d+)\/(\d+)$/.exec(s); if(m) return [+m[1]*+m[3]+ +m[2], +m[3]]; m=/^(\d+)\/(\d+)$/.exec(s); if(m) return [+m[1], +m[2]]; return [+s,1]; }
for(i=0;i<500;i++){ var q=G.make("frac_addsub"), parts=q.q.replace("計算：","").replace(" = ？（答案化成最簡）","").split(" "), v=pf2(parts[0]);
  for(var j=1;j<parts.length;j+=2){ var w=pf2(parts[j+1]); v= parts[j]==="+"?[v[0]*w[1]+w[0]*v[1],v[1]*w[1]]:[v[0]*w[1]-w[0]*v[1],v[1]*w[1]]; }
  var a=pf2(q.answer); if(a[0]*v[1]!==v[0]*a[1]||g(a[0]%a[1]||a[1],a[1])!==1) bad("frac_addsub","答案錯",q); }
for(i=0;i<500;i++){ var q=G.make("dec_sum"), nums=q.q.match(/\d+(\.\d+)?/g).map(function(x){return Math.round(+x*1000);});
  if(Math.round(+q.answer*1000)!==nums[3]-nums[0]-nums[1]-nums[2]) bad("dec_sum","答案錯",q); }
for(i=0;i<500;i++){ var q=G.make("dist_law"), e=q.q.replace("計算：","").replace(" = ？（用分配律會比較快）","").replace(" = ？","").replace(/×/g,"*").replace(/−/g,"-");
  if(String(eval(e))!==String(q.answer)) bad("dist_law","答案錯",q); }
for(i=0;i<500;i++){ var q=G.make("div_chain"); if(/^計算：/.test(q.q)){ var e=q.q.replace("計算：","").replace(" = ？","").replace(/÷/g,"/"); var parts=e.split(" / "); if(String(parts[0]/parts[1]/parts[2])!==String(q.answer) && String(Math.round(parts[0]/parts[1]/parts[2]))!==String(q.answer)) bad("div_chain","答案錯",q); } }
for(i=0;i<300;i++){ var q=G.make("avg_prob"); if(/平均分數是 (\d+) 分，前 \d+ 科分別是 ([0-9、]+) 分，最後一科是幾分？/.test(q.q)){ var m=q.q.match(/(\d+) 科的平均分數是 (\d+) 分，前 \d+ 科分別是 ([0-9、]+) 分/); var nn=+m[1], avg=+m[2], arr=m[3].split("、").map(Number); if(+q.answer!==avg*nn-arr.reduce(function(a,b){return a+b;},0)) bad("avg_prob","答案錯",q); } }
console.log("產生器 "+G.list.length+" 個，共產生 "+made+" 題");
console.log(err?err+" 個錯誤":"全部通過 ✅");
process.exit(err?1:0);
