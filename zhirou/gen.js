// 隨機出題（每回合題目都不一樣）：數字、情境隨機，答案由程式計算。在 data.js、extra.js 之後載入。
(function(){
var D=window.PRACTICE_DATA;
function ri(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
function pk(a){ return a[Math.floor(Math.random()*a.length)]; }
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=a%b; a=b; b=t; } return a; }
function lcm(a,b){ return a/gcd(a,b)*b; }
// 分數（整數分子分母，永遠化成最簡）
function F(n,d){ if(d<0){n=-n;d=-d;} var g=gcd(n,d)||1; return {n:n/g,d:d/g}; }
function fadd(a,b){ return F(a.n*b.d+b.n*a.d, a.d*b.d); }
function fsub(a,b){ return F(a.n*b.d-b.n*a.d, a.d*b.d); }
function fstr(f){ if(f.d===1) return String(f.n); if(f.n>f.d) return Math.floor(f.n/f.d)+"又"+(f.n%f.d)+"/"+f.d; return f.n+"/"+f.d; }
// 小數：用「千分之一」為單位的整數計算，避免浮點誤差
function dstr(t){ var neg=t<0; t=Math.abs(t); var i=Math.floor(t/1000), r=t%1000, s=String(i);
  if(r){ var f=String(r); while(f.length<3) f="0"+f; s+="."+f.replace(/0+$/,""); } return (neg?"−":"")+s; }
function hm(m){ var h=Math.floor(m/60), mm=m%60; return h+":"+(mm<10?"0":"")+mm; }
// 組選項：答案＋不重複的干擾項，湊滿 4 個
function opts(ans, cands, more){ var o=[ans], seen={}; seen[ans]=1;
  cands.forEach(function(c){ c=String(c); if(/^-/.test(c)) return; if(o.length<4 && !seen[c] && c.indexOf("NaN")<0 && c.indexOf("undefined")<0 && c.indexOf("Infinity")<0){ seen[c]=1; o.push(c); } });
  if(!more && /^\d+$/.test(ans)){ var A=+ans; more=function(){ return Math.max(0,A+ri(-9,12)); }; }
  var guard=0; while(o.length<4 && more && guard++<200){ var c=String(more()); if(!seen[c] && !/^-/.test(c) && c.indexOf("NaN")<0){ seen[c]=1; o.push(c); } }
  return o; }
function Q(q,ans,cands,more,hint,explain,extra){ var o={type:"mc", q:q, answer:String(ans), options:opts(String(ans),cands,more), hint:hint, explain:explain}; if(extra) for(var k in extra) o[k]=extra[k]; return o; }
function N(q,ans,hint,explain){ return {type:"num", q:q, answer:String(ans), hint:hint, explain:explain}; }
var NAMES=["小安","阿哲","小芸","宜蓁","子恩","品妤","柏宇","小晴"];

var G={};
// ===== 一、多位小數與加減 =====
G.dec_sum=function(){ var a=ri(1000,3999), b=ri(500,2999), c=ri(100,999); if(Math.random()<.5) b-=b%10; if(Math.random()<.5) a-=a%100;
  var s=a+b+c, T=(Math.floor(s/1000)+1+ri(0,1))*1000, ans=T-s, item=pk(["緞帶","繩子","水管","鐵絲"]);
  return Q(pk(NAMES)+"有三段"+item+"，分別長 "+dstr(a)+"、"+dstr(b)+"、"+dstr(c)+" 公尺，合起來比 "+dstr(T)+" 公尺少多少公尺？", dstr(ans),
   [dstr(ans+100),dstr(ans-10),dstr(ans+10),dstr(ans+1000)].filter(function(x){return x.charAt(0)!=="−"&&x!=="0";}), function(){ return dstr(ans+ri(1,99)*10); },
   "先算三段的總長，再用 "+dstr(T)+" 去減。小數點要對齊！", [dstr(a)+" + "+dstr(b)+" + "+dstr(c)+" = "+dstr(s), dstr(T)+" − "+dstr(s)+" = "+dstr(ans)]); };
G.dec_round=function(){ var ask=pk(["最大","最小"]), place=pk(["百分位","十分位"]), v;
  do{ v=place==="百分位"?ri(101,999):ri(11,99); }while(v%10===0);
  var base=place==="百分位"?v*10:v*100, step=place==="百分位"?1:10;
  var max=base+4*step, min=base-5*step, ans2=ask==="最大"?max:min, dig=place==="百分位"?"三位小數":"二位小數";
  var cands=ask==="最大"?[dstr(base+5*step),dstr(base+9*step),dstr(min)]:[dstr(base-4*step),dstr(base-6*step),dstr(max)];
  return Q("一個"+dig+"，四捨五入到"+place+"是 "+dstr(base)+"。這個"+dig+"「"+ask+"」可能是多少？", dstr(ans2), cands, null,
   "想想最後一位是幾的時候會進位、幾的時候會捨去。", ["能變成 "+dstr(base)+" 的"+dig+"：從 "+dstr(min)+" 到 "+dstr(max),"最後一位 5 以上要進位，4 以下捨去","所以"+ask+"是 "+dstr(ans2)]); };
G.dec_misread=function(){ var b=pk([1600,2500,3700,4800,1200,2300]), wrong=b/10, x=ri(1000,8999), W=x+wrong, ans=x+b;
  return Q(pk(NAMES)+"計算「某數 + "+dstr(b)+"」時，把 "+dstr(b)+" 看成 "+dstr(wrong)+"，算出 "+dstr(W)+"。正確答案是多少？", dstr(ans),
   [dstr(W+b),dstr(x),dstr(W+wrong),dstr(ans+wrong)], function(){ return dstr(ans+ri(1,9)*100); },
   "先用錯的算式倒推出「某數」。", ["某數 = "+dstr(W)+" − "+dstr(wrong)+" = "+dstr(x), "正確：" + dstr(x)+" + "+dstr(b)+" = "+dstr(ans)]); };
// ===== 二、因數與公因數 =====
function divs(n){ var r=[]; for(var i=1;i<=n;i++) if(n%i===0) r.push(i); return r; }
G.fac_count=function(){ var n=pk([36,48,60,72,84,90,96,100,120,126,144,150,180,196,210,225]), d=divs(n);
  if(Math.random()<.5) return Q(n+" 有幾個因數？", d.length, [d.length-1,d.length+1,d.length-2,d.length+2], null,
   "一對一對找：1 × "+n+"、2 × ……，找到兩數相同或交叉就停。", [n+" 的因數："+d.join("、"),"共 "+d.length+" 個"]);
  var ev=d.filter(function(x){return x%2===0;});
  return Q("⭐ "+n+" 的因數中，有幾個是「偶數」？", ev.length, [d.length-ev.length,ev.length+1,ev.length-1,d.length], null,
   "先列出全部因數，再挑出偶數。", [n+" 的因數："+d.join("、"),"偶數："+ev.join("、"),"共 "+ev.length+" 個"]); };
G.gcd_ribbon=function(){ var g=ri(4,15), p=ri(2,9), q=ri(2,9); while(gcd(p,q)!==1||p===q){ p=ri(2,9); q=ri(2,9); }
  var a=g*p, b=g*q, cd=divs(g).filter(function(x){return x<g;}), d2=cd[cd.length-1];
  var A="每段 "+g+" 公分，共 "+(p+q)+" 段";
  return Q("兩條緞帶分別長 "+a+" 公分和 "+b+" 公分，要剪成同樣長的小段，而且都不能有剩。每段「最長」幾公分？一共可以剪成幾段？", A,
   ["每段 "+g+" 公分，共 "+(p*q)+" 段","每段 "+d2+" 公分，共 "+((a+b)/d2)+" 段","每段 "+lcm(a,b)+" 公分，共 2 段","每段 "+g+" 公分，共 "+(p+q+1)+" 段"], null,
   "每段最長＝兩數的最大公因數。", [a+" 和 "+b+" 的最大公因數是 "+g,"每段 "+g+" 公分","段數："+a+" ÷ "+g+" + "+b+" ÷ "+g+" = "+p+" + "+q+" = "+(p+q)]); };
G.gcd_square=function(){ var g=ri(3,12), p=ri(2,7), q=ri(2,7); while(gcd(p,q)!==1||p===q){ p=ri(2,7); q=ri(2,7); }
  var a=g*p, b=g*q;
  return Q("⭐ 一塊長方形紙長 "+a+" 公分、寬 "+b+" 公分，要剪成同樣大小、邊長是整數公分的正方形，不能有剩。正方形邊長最大時，可以剪成幾個？", p*q,
   [p+q,p*q*2,(p*q)/1+1,a*b/g],null,"正方形邊長＝長和寬的最大公因數。",[a+" 和 "+b+" 的最大公因數是 "+g,"長邊排 "+p+" 個，寬邊排 "+q+" 個","共 "+p+" × "+q+" = "+(p*q)+" 個"]); };
// ===== 三、倍數與公倍數 =====
G.lcm_bus=function(){ var a,b; do{ a=ri(4,20); b=ri(4,20); }while(a===b||gcd(a,b)===1||lcm(a,b)>120||a%b===0||b%a===0);
  var st=ri(6,8)*60+pk([0,10,15,30]), L=lcm(a,b);
  return Q("甲公車每 "+a+" 分鐘發一班，乙公車每 "+b+" 分鐘發一班。早上 "+hm(st)+" 兩車同時發車，下一次同時發車是幾點幾分？", hm(st+L),
   [hm(st+a*b),hm(st+a+b),hm(st+2*L),hm(st+L-gcd(a,b))], null, "下一次同時發車＝兩數的最小公倍數。",
   [a+" 和 "+b+" 的最小公倍數是 "+L,hm(st)+" 再過 "+L+" 分鐘是 "+hm(st+L)]); };
G.mult_count=function(){ var a,b; do{ a=ri(2,9); b=ri(2,9); }while(a===b||a%b===0||b%a===0); var n=ri(10,30)*10, L=lcm(a,b);
  var x=Math.floor(n/a), y=Math.floor(n/b), z=Math.floor(n/L), ans=x+y-z;
  return Q("⭐ 1 到 "+n+" 的整數中，是 "+a+" 的倍數「或」是 "+b+" 的倍數的，共有幾個？", ans, [x+y, x+y-2*z, z, ans+1], null,
   "兩種都算到的（公倍數）會被重複算一次。", [a+" 的倍數："+n+" ÷ "+a+" → "+x+" 個", b+" 的倍數："+n+" ÷ "+b+" → "+y+" 個", "公倍數（"+L+" 的倍數）："+z+" 個，重複算了要扣掉", x+" + "+y+" − "+z+" = "+ans]); };
G.lcm_rem=function(){ var a,b; do{ a=ri(3,9); b=ri(3,9); }while(a===b); var r=ri(1,Math.min(a,b)-1), L=lcm(a,b), ans=L+r; if(ans<10) ans+=L;
  return Q("⭐ 一盒糖果，每 "+a+" 顆裝一袋會剩 "+r+" 顆，每 "+b+" 顆裝一袋也剩 "+r+" 顆。這盒糖果「最少」有幾顆？（超過 10 顆）", ans,
   [L, ans+L, a*b+r, ans-1], null, "先拿掉剩下的 "+r+" 顆，剩下的數同時是 "+a+" 和 "+b+" 的倍數。", [a+" 和 "+b+" 的最小公倍數是 "+L,"糖果數 ＝ 公倍數 + "+r,"超過 10 顆的最小值是 "+ans]); };
// ===== 四、擴分、約分與通分 =====
G.frac_reduce=function(){ var p,q; do{ p=ri(1,11); q=ri(2,15); }while(p>=q||gcd(p,q)!==1); var k=pk([4,6,8,9,12,14,15,18]), n=p*k, d=q*k;
  var half=gcd(n,d)%2===0&&k!==2?(n/2)+"/"+(d/2):null;
  return Q("把 "+n+"/"+d+" 約成最簡分數，是多少？", p+"/"+q, [half,(p+1)+"/"+q,p+"/"+(q+1),q+"/"+p].filter(Boolean), null,
   "分子、分母同除以它們的最大公因數。", [n+" 和 "+d+" 的最大公因數是 "+k, n+" ÷ "+k+" = "+p+"，"+d+" ÷ "+k+" = "+q, "最簡分數是 "+p+"/"+q]); };
G.frac_compare=function(){ var fs=[], seen={}; while(fs.length<4){ var d=ri(3,15), n=ri(1,d-1), f=F(n,d), key=f.n/f.d; if(!seen[key]){ seen[key]=1; fs.push(f); } }
  var big=pk([true,false]), best=fs.reduce(function(m,f){ return (big? f.n*m.d>m.n*f.d : f.n*m.d<m.n*f.d)?f:m; });
  return Q("下面哪一個分數「"+(big?"最大":"最小")+"」？"+fs.map(fstr).join("、"), fstr(best), fs.filter(function(f){return f!==best;}).map(fstr), null,
   "可以通分，或和 1/2 比一比、用交叉相乘比較。", fs.map(function(f){ return fstr(f)+" ≈ "+(Math.round(f.n/f.d*1000)/1000); }).concat(["所以"+(big?"最大":"最小")+"的是 "+fstr(best)])); };
G.frac_between=function(){ var m=pk([12,15,18,20,24,30,36]), lo=pk([F(1,4),F(1,3),F(1,5),F(2,5)]), hi=pk([F(2,3),F(3,4),F(4,5),F(5,6)]), list=[];
  for(var n=1;n<m;n++) if(gcd(n,m)===1 && n*lo.d>lo.n*m && n*hi.d<hi.n*m) list.push(n+"/"+m);
  var all=0; for(n=1;n<m;n++) if(n*lo.d>lo.n*m && n*hi.d<hi.n*m) all++;
  return Q("⭐ 分母是 "+m+" 的「最簡分數」中，比 "+fstr(lo)+" 大、比 "+fstr(hi)+" 小的有幾個？", list.length, [all, list.length+1, list.length-1, list.length+2].filter(function(x){return x>=0;}), null,
   "把 "+fstr(lo)+" 和 "+fstr(hi)+" 擴分成分母 "+m+"（或比較大小），再看分子和 "+m+" 有沒有公因數。", ["符合的有："+(list.join("、")||"沒有"),"共 "+list.length+" 個（不是最簡分數的要排除）"]); };
// ===== 五、多邊形與扇形 =====
G.poly_angle=function(){ var t=ri(0,2);
  if(t===0){ var n=ri(5,12); return Q(n+" 邊形的內角和是幾度？", (n-2)*180, [n*180,(n-1)*180,(n-3)*180,n*90], null, "從一個頂點畫對角線，可以分成幾個三角形？", ["n 邊形可分成 (n − 2) 個三角形", "("+n+" − 2) × 180 = "+((n-2)*180)+" 度"]); }
  if(t===1){ var m=pk([5,6,8,9,10,12]), e=(m-2)*180/m; return Q("正 "+m+" 邊形的每一個內角是幾度？", e, [(m-2)*180, 360/m, 180-e+ (e===90?10:0), e+10], null, "先算內角和，再平分。", ["內角和 ("+m+" − 2) × 180 = "+((m-2)*180),"÷ "+m+" = "+e+" 度"]); }
  var s=ri(5,12), tot=(s-2)*180; return Q("⭐ 一個多邊形的內角和是 "+tot+" 度，它是幾邊形？", s+" 邊形", [(s-1)+" 邊形",(s+1)+" 邊形",(s+2)+" 邊形"], null, "內角和 ÷ 180 再加 2。", [tot+" ÷ 180 = "+(s-2)+"（個三角形）",(s-2)+" + 2 = "+s+" 邊形"]); };
G.sector=function(){ var th=pk([30,40,45,60,72,80,90,108,120,135,150,210,240,270,300]), f=F(th,360);
  if(Math.random()<.5) return Q("圓心角是 "+th+" 度的扇形，是圓的幾分之幾？", fstr(f), [fstr(F(th,180)),fstr(F(360-th,360)),th+"/100",fstr(F(th,720))].filter(function(x){return x!==fstr(f);}), null, "一整個圓的圓心角是 360 度。", [th+"/360 約分 = "+fstr(f)]);
  var k=f.d, n=f.n; return Q("一個扇形是圓的 "+fstr(f)+"，它的圓心角是幾度？", th, [th+10<360?th+10:th-15, 360-th, Math.round(180*n/k), 360/k===th?th*2:360/k].filter(function(x){return x>0&&x!==th;}), null, "圓心角 = 360 × 幾分之幾。", ["360 × "+fstr(f)+" = "+th+" 度"]); };
// ===== 六、異分母分數的加減 =====
function rf(dmax){ var d=ri(2,dmax), n=ri(1,d-1); return F(n,d); }
G.frac_addsub=function(){ var a,b,c,r,op; do{ a=F(ri(1,3)*12+0,12); a=fadd(F(ri(1,3),1),rf(9)); b=rf(10); c=rf(12); op=pk(["+","−"]); r=op==="+"?fsub(fadd(a,b),c):fsub(fsub(a,b),c); }while(r.n<=0||a.d===b.d);
  var wrong=F(a.n+b.n+c.n, a.d+b.d+c.d);
  return Q("計算："+fstr(a)+" "+op+" "+fstr(b)+" − "+fstr(c)+" = ？（答案化成最簡）", fstr(r), [fstr(fadd(r,F(1,a.d*b.d))), fstr(op==="+"?fadd(fadd(a,b),c):fadd(fsub(a,b),c)), fstr(wrong), fstr(fadd(r,F(1,1)))].filter(function(x){return x.charAt(0)!=="-";}), null,
   "先通分（找分母的最小公倍數），整數和分數分開算也可以。", ["分母 "+a.d+"、"+b.d+"、"+c.d+" 的最小公倍數是 "+lcm(lcm(a.d,b.d),c.d), "算出來是 "+fstr(r)]); };
G.frac_word=function(){ var L,a,b,r; do{ L=fadd(F(ri(2,5),1),rf(6)); a=fadd(F(ri(0,1),1),rf(8)); b=rf(10); r=fsub(fsub(L,a),b); }while(r.n<=0||a.n===0);
  var item=pk(["緞帶","彩帶","毛線","繩子"]);
  return Q(pk(NAMES)+"有一條"+item+"長 "+fstr(L)+" 公尺，先剪下 "+fstr(a)+" 公尺，再剪下 "+fstr(b)+" 公尺，還剩下多少公尺？", fstr(r),
   [fstr(fadd(fsub(L,a),b)), fstr(fsub(L,fsub(a,b)).n>0?fsub(L,fsub(a,b)):fadd(r,F(1,2))), fstr(fadd(r,F(1,lcm(a.d,b.d)))), fstr(fadd(a,b))], null,
   "還剩 ＝ 全長 − 第一次 − 第二次。", [fstr(L)+" − "+fstr(a)+" − "+fstr(b)+" = "+fstr(r)]); };
// ===== 七、線對稱圖形 =====
var SYM=[["正三角形",3],["正方形",4],["長方形",2],["菱形",2],["等腰三角形",1],["等腰梯形",1],["平行四邊形（不是長方形或菱形）",0],["正五邊形",5],["正六邊形",6],["正八邊形",8],["半圓形",1],["箏形",1]];
G.sym_axes=function(){ if(Math.random()<.6){ var s=pk(SYM); return Q(s[0]+"有幾條對稱軸？", s[1]===0?"0 條（不是線對稱圖形）":s[1]+" 條", ["0 條（不是線對稱圖形）","1 條","2 條","3 條","4 條","5 條","6 條","8 條"].map(function(x){return x;}).sort(function(){return Math.random()-.5;}), null,
   "想像沿著一條直線對摺，兩邊能不能完全疊合。", [s[0]+"的對稱軸有 "+s[1]+" 條","正 n 邊形有 n 條對稱軸"]); }
  var d=ri(2,9), side=pk(["左","右"]);
  return Q("⭐ 在線對稱圖形中，A 點到對稱軸的距離是 "+d+" 公分。A 的對稱點 A' 和 A 相距幾公分？", d*2, [d,d+2,d*4], null, "對稱點到對稱軸的距離相等。", ["A 和 A' 到對稱軸都是 "+d+" 公分","AA' = "+d+" × 2 = "+(d*2)+" 公分","連線 AA' 會和對稱軸垂直"]); };
// ===== 八、整數四則運算 =====
G.order_ops=function(){ var t=ri(0,3), e, ans, ltr;
  if(t===0){ var c=ri(2,9), d=ri(2,9), b=c*d*ri(1,3), a=ri(b/d*c,b/d*c+200); a=ri(Math.max(50,b*c/d+1),400); ans=a-b*c/d; e=a+" − "+b+" × "+c+" ÷ "+d; ltr=(a-b)*c/d; }
  else if(t===1){ var a1=ri(12,60), b1=ri(5,40), c1=ri(3,9), d1=ri(10,99); ans=(a1+b1)*c1-d1; e="("+a1+" + "+b1+") × "+c1+" − "+d1; ltr=a1+b1*c1-d1; }
  else if(t===2){ var a2=ri(3,9), b2=ri(20,60), c2=ri(2,19), d2=pk([2,3,4,5,6]); while((a2*(b2-c2))%d2) c2=ri(2,19); ans=a2*(b2-c2)/d2; e=a2+" × ("+b2+" − "+c2+") ÷ "+d2; ltr=a2*b2-c2/d2; }
  else { var x=ri(11,49), y=ri(2,9), z=ri(11,49); ans=x*y+z*y; e=x+" × "+y+" + "+z+" × "+y; ltr=(x*y+z)*y; }
  return Q("計算："+e+" = ？", ans, [ltr, ans+10, ans-1, ans+100].filter(function(v){return v===Math.floor(v)&&v>=0;}), function(){ return ans+ri(2,30); },
   "先算括號，再算乘除，最後算加減；同級運算由左往右。", [e+" = "+ans].concat(t===3?["也可以用分配律：("+x+" + "+z+") × "+y+" = "+ans]:[])); };
G.ops_word=function(){ var p=ri(25,60), n=ri(3,8), q=ri(15,40), m=ri(2,6), pay=Math.ceil((p*n+q*m)/100)*100+pk([0,100,500]);
  var cost=p*n+q*m, ans=pay-cost;
  return Q(pk(NAMES)+"買了 "+n+" 枝筆，每枝 "+p+" 元，又買了 "+m+" 本筆記本，每本 "+q+" 元。付了 "+pay+" 元，應找回多少元？（用併式想一想）", ans,
   [pay-p*n-q, pay-(p+q)*(n+m)>0?pay-(p+q)*(n+m):ans+p, ans+q, ans-p].filter(function(v){return v>=0;}), function(){return ans+ri(1,20);},
   "併式："+pay+" − ("+p+" × "+n+" + "+q+" × "+m+")", [p+" × "+n+" = "+(p*n), q+" × "+m+" = "+(q*m), pay+" − "+cost+" = "+ans]); };
// ===== 九、面積 =====
G.area=function(){ var t=ri(0,3);
  if(t===0){ var a=ri(3,15), b=a+ri(2,12), h=ri(2,14); if(((a+b)*h)%2) h++; return Q("梯形的上底 "+a+" 公分、下底 "+b+" 公分、高 "+h+" 公分，面積是多少平方公分？", (a+b)*h/2, [(a+b)*h, a*b*h/2===Math.floor(a*b*h/2)?a*b*h/2:a*h, b*h, (a+b)*h/2+h], null, "梯形面積 =（上底 + 下底）× 高 ÷ 2", ["("+a+" + "+b+") × "+h+" ÷ 2 = "+((a+b)*h/2)+" 平方公分"]); }
  if(t===1){ var bb=ri(4,20), hh=ri(3,15), sl=hh+ri(1,5); return Q("平行四邊形的底 "+bb+" 公分，高 "+hh+" 公分，斜邊長 "+sl+" 公分，面積是多少平方公分？", bb*hh, [bb*sl, bb*hh/2===Math.floor(bb*hh/2)?bb*hh/2:bb*hh+1, (bb+sl)*2], function(){return bb*hh+ri(1,9)*2;}, "平行四邊形面積 = 底 × 高（不是斜邊！）", [bb+" × "+hh+" = "+(bb*hh)+" 平方公分","斜邊長是多出來的干擾資料"]); }
  if(t===2){ var b3=ri(4,24), h3=ri(3,16); if((b3*h3)%2) b3++; return Q("三角形的底 "+b3+" 公分、高 "+h3+" 公分，面積是多少平方公分？", b3*h3/2, [b3*h3, b3+h3, b3*h3/2+b3], null, "三角形面積 = 底 × 高 ÷ 2", [b3+" × "+h3+" ÷ 2 = "+(b3*h3/2)]); }
  var L=ri(8,20), W=ri(6,14), tb=2*ri(1,Math.floor((L-1)/2)), th=ri(2,W), ans=L*W-tb*th/2;
  return Q("⭐ 長 "+L+" 公分、寬 "+W+" 公分的長方形紙，剪掉一個底 "+tb+" 公分、高 "+th+" 公分的三角形，剩下的面積是多少平方公分？", ans, [L*W-tb*th, L*W, tb*th/2, ans+tb], null, "剩下 = 長方形 − 三角形", [L+" × "+W+" = "+(L*W), tb+" × "+th+" ÷ 2 = "+(tb*th/2), (L*W)+" − "+(tb*th/2)+" = "+ans]); };
G.area_rev=function(){ var a=ri(3,12), b=a+ri(2,10), h=ri(3,12); if(((a+b)*h)%2) a++; if(b<=a) b=a+2; var S=(a+b)*h/2;
  if(!Number.isInteger(S)){ h++; S=(a+b)*h/2; }
  return Q("⭐ 梯形面積是 "+S+" 平方公分，上底 "+a+" 公分、下底 "+b+" 公分，高是幾公分？", h, [S*2/(a+b)*2, h+1, h*2, S/(a+b)===Math.floor(S/(a+b))?S/(a+b):h-1].filter(function(v){return v>0;}), function(){return h+ri(2,6);}, "反過來想：高 = 面積 × 2 ÷（上底 + 下底）", [S+" × 2 = "+(S*2), (S*2)+" ÷ ("+a+" + "+b+") = "+h+" 公分"]); };
// ===== 十、柱體、錐體和球 =====
G.solid=function(){ var n=ri(3,10), names={3:"三",4:"四",5:"五",6:"六",7:"七",8:"八",9:"九",10:"十"}, kind=pk(["角柱","角錐"]), what=pk(["面","邊","頂點"]);
  var v= kind==="角柱"?{面:n+2,邊:3*n,頂點:2*n}:{面:n+1,邊:2*n,頂點:n+1}, ans=v[what];
  return Q(names[n]+kind+"有幾個"+what+"？", ans, [n+2,3*n,2*n,n+1,2*n+2,n].filter(function(x){return x!==ans;}), null,
   kind==="角柱"?"角柱有上下兩個底面，側面數 = 底面的邊數。":"角錐只有一個底面，側面都是三角形，在頂點會合。",
   kind==="角柱"?["n 角柱：面 n + 2、邊 3n、頂點 2n","n = "+n+" → "+what+" "+ans]:["n 角錐：面 n + 1、邊 2n、頂點 n + 1","n = "+n+" → "+what+" "+ans]); };

// ===== 第六～十單元：再增加變化（分配律、平均、連除、複合面積、展開圖、球、對稱性質）=====
G.frac_mix=function(){
  var a=fadd(F(ri(1,4),1),F(ri(1,5),pk([2,3,4,5,6])));
  var b=F(ri(1,8),pk([3,4,5,6,8,10]));
  var op=pk(["+","−"]), r=op==="+"?fadd(a,b):fsub(a,b);
  if(r.n<=0){ op="+"; r=fadd(a,b); }
  var item=pk(["果汁","牛奶","糖漿","麵粉"]);
  return Q("媽媽先準備 "+fstr(a)+" 公升"+item+"，再"+(op==="+"?"倒入":"倒出")+" "+fstr(b)+" 公升，現在有多少公升？（化成最簡）", fstr(r),
    [fstr(op==="+"?fsub(a,b):fadd(a,b)), fstr(F(a.n+b.n,a.d+b.d)), fstr(a)], function(){ return fstr(F(ri(1,9),ri(2,9))); },
    "先通分再"+(op==="+"?"加":"減")+"，最後約分。",
    [fstr(a)+" "+op+" "+fstr(b)+" = "+fstr(r)]);
};
G.dist_law=function(){
  var t=ri(0,2);
  if(t===0){ var a=ri(12,80), b=ri(20,400), c=pk([100,200,250,300,400,500,600,800,1000])-b; if(c<=0){ c=ri(20,200); }
    var ans=a*(b+c), e=a+" × "+b+" + "+a+" × "+c;
    return Q("計算："+e+" = ？（用分配律會比較快）", ans, [a*b+c, a*(b+c+1), (a+b)*c, a*b*c], function(){return ans+ri(-30,30);},
      "相同的因數可以提出來：a×b + a×c = a×(b+c)。", [e+" = "+a+" × ("+b+" + "+c+") = "+a+" × "+(b+c)+" = "+ans]); }
  if(t===1){ var s=ri(20,90), p=ri(15,80), q=ri(15,80); while(p===q) q=ri(15,80);
    var ans=s*(p+q), e=p+" × "+s+" + "+q+" × "+s;
    return Q("計算："+e+" = ？", ans, [(p+q)*s+s, p*s+q, p*q*s], function(){return ans+ri(-40,40);},
      "右邊都有 × "+s+"，把 "+s+" 提出來。", [e+" = ("+p+" + "+q+") × "+s+" = "+(p+q)+" × "+s+" = "+ans]); }
  var x=ri(8,40), y=ri(100,800), z=ri(10,80); var ans=x*y-x*z; if(ans<=0){ z=ri(5,Math.max(6,Math.floor(y/3))); ans=x*y-x*z; }
  var e2=x+" × "+y+" − "+x+" × "+z;
  return Q("計算："+e2+" = ？", ans, [x*(y-z+1), x*y-z, x*(y+z)], function(){return Math.max(1,ans+ri(-50,50));},
    "a×b − a×c = a×(b−c)。", [e2+" = "+x+" × ("+y+" − "+z+") = "+x+" × "+(y-z)+" = "+ans]);
};
G.avg_prob=function(){
  var t=ri(0,2);
  if(t===0){ var n=pk([3,4,5]), avg=ri(60,95), arr=[]; var s=avg*n; for(var i=0;i<n-1;i++){ arr.push(ri(avg-15,avg+15)); } var last=s-arr.reduce(function(a,b){return a+b;},0);
    if(last<0||last>100){ return G.avg_prob(); }
    return Q(n+" 科的平均分數是 "+avg+" 分，前 "+(n-1)+" 科分別是 "+arr.join("、")+" 分，最後一科是幾分？", last,
      [avg, last+ri(2,8), Math.round(s/(n-1)), Math.abs(last-10)], function(){return ri(40,100);},
      "總分 = 平均 × 科數，再減去已經知道的分數。", ["總分 "+avg+" × "+n+" = "+s, s+" − ("+arr.join(" + ")+") = "+last]); }
  if(t===1){ var m=pk([4,5,6,8]), a1=ri(10,40), tot=a1*m, add=ri(2,m-1), more=ri(5,20), newAvg=(tot+more)/m;
    if((tot+more)%m) { more=m-tot%m + ri(0,3)*m; newAvg=(tot+more)/m; }
    return Q(m+" 個人平均有 "+a1+" 顆彈珠。後來又放入 "+more+" 顆再平均分，現在平均每人幾顆？", newAvg,
      [a1+more, a1+more/m, tot+more, a1], function(){return ri(a1,a1+10);},
      "先算總數，加上新的，再除以人數。", ["原來總共 "+a1+" × "+m+" = "+tot, tot+" + "+more+" = "+(tot+more), (tot+more)+" ÷ "+m+" = "+newAvg]); }
  var k=pk([5,6,8,10]), avg2=ri(8,20), one=avg2+ri(3,12), rest=(avg2*k-one)/(k-1);
  if(rest!==Math.floor(rest)||rest<=0) return G.avg_prob();
  return Q(k+" 筆資料的平均是 "+avg2+"，其中一筆是 "+one+"，其餘 "+(k-1)+" 筆的平均是多少？", rest,
    [avg2, one, avg2*k-one, Math.round(rest+1)], function(){return ri(1,30);},
    "先還原總和，減去這一筆，再除以剩下的筆數。", ["總和 "+avg2+" × "+k+" = "+(avg2*k), (avg2*k)+" − "+one+" = "+(avg2*k-one), (avg2*k-one)+" ÷ "+(k-1)+" = "+rest]);
};
G.div_chain=function(){
  var c=ri(2,9), b=ri(2,12), mid=b*c*ri(2,8), a=mid*ri(2,6), ans=a/b/c;
  if(ans!==Math.floor(ans)) return G.div_chain();
  var t=ri(0,1);
  if(t===0) return Q("計算："+a+" ÷ "+b+" ÷ "+c+" = ？", ans, [a/(b+c), a/b, a/c, a-b-c].map(function(x){return Math.round(x);}), function(){return ri(2,40);},
    "連除由左而右，也可以先算 "+b+" × "+c+" 再一次除。", [a+" ÷ "+b+" = "+(a/b), (a/b)+" ÷ "+c+" = "+ans, "或 "+a+" ÷ ("+b+" × "+c+" = "+(b*c)+") = "+ans]);
  var item=pk(["彩帶","繩子","布"]);
  return Q(item+"長 "+a+" 公分，先平均剪成 "+b+" 段，每段再平均剪成 "+c+" 小段。每小段長幾公分？", ans,
    [a/b, a/c, b*c, a-b-c].map(function(x){return Math.max(1,Math.round(x));}), function(){return ri(2,30);},
    "就是連除：總長 ÷ 第一刀的段數 ÷ 再細分的段數。", [a+" ÷ "+b+" ÷ "+c+" = "+ans]);
};
G.area_compound=function(){
  var t=ri(0,2);
  if(t===0){ var L=ri(10,24), W=ri(6,16), tb=2*ri(1,Math.floor((L-2)/2)), th=ri(2,W-1); if((tb*th)%2) th++; var ans=L*W-tb*th/2;
    return Q("長方形長 "+L+" 公分、寬 "+W+" 公分，從裡面剪去一個底 "+tb+" 公分、高 "+th+" 公分的三角形，剩下面積是多少平方公分？", ans,
      [L*W, L*W-tb*th, L*W+tb*th/2, tb*th/2], function(){return ri(20,200);},
      "剩餘面積 = 長方形 − 三角形。", [L+" × "+W+" = "+(L*W), "三角形 "+tb+" × "+th+" ÷ 2 = "+(tb*th/2), (L*W)+" − "+(tb*th/2)+" = "+ans]); }
  if(t===1){ var a=ri(6,16), b=ri(4,12), c=ri(3,10); var ans=a*b+a*c;
    return Q("一個大 L 形可以看成兩個長方形：一個是 "+a+"×"+b+"，另一個是 "+a+"×"+c+"（共用邊 "+a+" 公分）。全面積是多少平方公分？", ans,
      [a*b, a*(b+c+1), a+b+c, (a+b)*c], function(){return ri(20,200);},
      "拆成兩個長方形再相加，或看成一個長方形 a×(b+c)。", [a+" × "+b+" = "+(a*b), a+" × "+c+" = "+(a*c), (a*b)+" + "+(a*c)+" = "+ans]); }
  var B=ri(8,20), H=ri(6,16), cut=ri(2,Math.min(5,H-2)); var ans=B*H-B*cut;
  return Q("長方形長 "+B+" 公分、寬 "+H+" 公分，沿著長邊剪掉一條寬 "+cut+" 公分的小長方形，剩下多少平方公分？", ans,
    [B*H, B*(H-cut+1), B*cut, B+H-cut], function(){return ri(20,200);},
    "大面積減去剪掉的小長方形。", [B+" × "+H+" = "+(B*H), B+" × "+cut+" = "+(B*cut), (B*H)+" − "+(B*cut)+" = "+ans+"（也等於 "+B+" × "+(H-cut)+"）"]);
};
G.solid_net=function(){
  var t=ri(0,3);
  if(t===0) return Q("下面哪一種「不能」摺成正方體？", "六個正方形連成一長條",
    ["有四個正方形排成一列，左右再各接一個（像十字架再加長）","兩個並排的正方形組成的「階梯」形展開圖，共六個正方形且沒有重疊面","四個正方形排成一列，兩側在不同位置各接一個"],
    null, "正方體展開圖不能有超過四個正方形排成一直線，也不能讓面重疊。",
    ["六個連成一長條時，摺起來會有面重疊或蓋不起來","展開圖一定剛好六個面，且排列要能折成盒子"]);
  if(t===1) return Q("直的四角柱（長方體）展開圖，下面哪一句正確？", "要有 6 個面：通常是 2 個底面和 4 個側面，排列時不能重疊",
    ["只要畫 4 個長方形就夠了","展開圖一定是 8 個面","球的展開圖和長方體完全一樣"],
    null, "先數面的個數，再想它們怎麼連在一起。",
    ["長方體有 6 個面","展開後仍是這 6 個面，只是拆開排在平面上"]);
  if(t===2) return Q("三角柱的展開圖通常包含哪些面？", "兩個三角形底面，加上三個長方形（或矩形）側面",
    ["六個一樣的三角形","只有三個三角形","一個圓形和一個長方形"],
    null, "角柱：兩個全等的底，側面個數等於底的邊數。",
    ["三角柱的底是三角形，所以有 2 個三角形和 3 個側面"]);
  return Q("下面哪一句關於展開圖是正確的？", "球的表面不能像柱體或錐體那樣，完整展開成一個沒有重疊、又不破裂的平面圖形",
    ["任何立體都可以像紙盒一樣攤成平面","正方體沒有展開圖","圓柱絕對不能有展開圖（其實側面可以攤成矩形）"],
    null, "想想球的表面是不是「可展開曲面」。",
    ["柱體、錐體的側面常常可以展開","球面不行"]);
};
G.solid_rel=function(){
  var t=ri(0,2);
  if(t===0) return Q("直的四角柱中，兩個底面的關係最正確的是哪一句？", "互相平行，而且形狀、大小都相同",
    ["互相垂直，而且一定是三角形","只相交於一點","一定不平行"],
    null, "直柱的兩底像樓層的地板和天花板。", ["上下底平行且全等","側邊垂直於底面"]);
  if(t===1) return Q("直的五角柱，側面和底面的關係是？", "每個側面都和底面垂直",
    ["每個側面都和底面平行","側面和底面一定重合","沒有側面"],
    null, "「直」的角柱，側邊垂直於底。", ["側面直立在底面上 → 垂直"]);
  var n=ri(3,8), names={3:"三",4:"四",5:"五",6:"六",7:"七",8:"八"};
  return Q("直的"+names[n]+"角柱，互相平行的側面一共有幾對？", n%2?0:n/2,
    [n, n-1, 2, 1].filter(function(x,i,a){return x!==(n%2?0:n/2)&&a.indexOf(x)===i;}), function(){return ri(0,6);},
    "底是正多邊形時，對邊平行的才會讓對應側面平行。奇數邊沒有對邊。",
    n%2?["正"+names[n]+"邊形沒有對邊，所以側面沒有平行的一對","答案是 0 對"]:["正"+names[n]+"邊形有 "+(n/2)+" 組對邊","所以有 "+(n/2)+" 對互相平行的側面"]);
};
G.sphere=function(){
  var t=ri(0,3);
  if(t===0) return Q("球和圓有什麼不同？", "圓是平面圖形，球是立體形體",
    ["兩者完全相同，只是名字不同","球是平面圖形，圓是立體","球有棱，圓有頂點"],
    null, "一個在平面上，一個佔有空間。", ["圓：平面；球：立體","球沒有稜、沒有頂點"]);
  if(t===1) return Q("把一個球平分成兩半，切面最可能是什麼形狀？", "圓形",
    ["正方形","三角形","五邊形"],
    null, "通過球心的切面是大圓，一般的平面切球也會得到圓。", ["平面切球，切面是圓"]);
  if(t===2) return Q("球有幾個平面？有幾條稜？", "0 個平面，0 條稜",
    ["2 個平面，1 條稜","1 個平面，0 條稜","6 個平面，12 條稜"],
    null, "球的表面是曲面。", ["球沒有平面的「面」，也沒有稜和頂點"]);
  return Q("下面哪一個日常物品最接近「球」？", "籃球（充氣後外形接近球體）",
    ["一本教科書","一個紙箱","一塊三角板"],
    null, "球體從各個方向看起來都接近圓形。", ["球體沒有稜角"]);
};
G.sym_prop=function(){
  var t=ri(0,2);
  if(t===0){ var d=ri(2,12); return Q("點 A 和它的對稱點 A' 對某一條對稱軸來說，A 到軸的垂直距離是 "+d+" 公分。A' 到軸的垂直距離是幾公分？", d,
    [2*d, d+1, 0, d*3], null, "對稱點到對稱軸的距離相等，而且連線被軸垂直平分。",
    ["距離相同，都是 "+d+" 公分","AA' 會被對稱軸垂直平分"]); }
  if(t===1) return Q("在線對稱圖形裡，下面哪一句正確？", "對應邊相等，對應角也相等",
    ["對應邊一定不相等","對應角一定差 90 度","對稱軸兩邊的圖形不必能完全重合"],
    null, "對摺後會重合，所以對應的邊和角都一樣。", ["重合 → 對應邊、對應角相等"]);
  var m=ri(3,9); return Q("線段 PQ 的垂直平分線是對稱軸，P 的對稱點是 Q。若 PQ 長 "+(2*m)+" 公分，對稱軸和 PQ 的交點到 P 是幾公分？", m,
    [2*m, 2*m+1, m+2, 0], null, "垂直平分線通過中點。", ["中點把 "+(2*m)+" 公分分成兩段，各 "+m+" 公分"]);
};

// ===== 英文單字：期末 Unit 3–4 與新年文化 =====
var DAYS=[["星期日","Sunday"],["星期一","Monday"],["星期二","Tuesday"],["星期三","Wednesday"],["星期四","Thursday"],["星期五","Friday"],["星期六","Saturday"]];
var SUBJS=[["美術","art"],["國語","Chinese"],["英文","English"],["數學","math"],["音樂","music"],["體育","PE"],["自然","science"],["社會","social studies"]];
var CNY=[["農曆新年","Chinese New Year"],["紅包","red envelope"],["團圓飯","reunion dinner"],["舞獅","lion dance"],["舞龍","dragon dance"],["鞭炮","firecrackers"],["煙火","fireworks"],["餃子","dumplings"],["新衣","new clothes"],["新年快樂","Happy New Year"]];
var W=DAYS.concat(SUBJS,CNY).map(function(x){ return [x[0], x[1], x[1]]; });
function others(w,i){ return W.filter(function(x){return x!==w;}).map(function(x){return x[i];}); }
function shuf(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
G.en_zh2en=function(){ var w=pk(W); return Q("「"+w[0]+"」的英文是哪一個？", w[2], shuf(others(w,2)), null, "先按 🔊 唸唸看。", [w[0]+" = "+w[2]], {say:w[2], sayAfter:true}); };
G.en_en2zh=function(){ var w=pk(W); return Q(w[2]+" 在本課裡是什麼意思？", w[0], shuf(others(w,0)), null, "按 🔊 聽一聽。", [w[2]+" = "+w[0]], {say:w[2]}); };
G.en_blank=function(){ var w=pk(W.filter(function(x){return x[2].replace(/ /g,"").length>=4;})), s=w[2], idx; do{ idx=ri(0,s.length-1); }while(!/[a-zA-Z]/.test(s[idx]));
  var c=s[idx], masked=s.slice(0,idx)+"_"+s.slice(idx+1), letters="aeioulrnstcmpbdghHyN".split("").filter(function(x){return x!==c;});
  return Q("「"+w[0]+"」的英文："+masked+"，空格要填哪一個字母？", c, shuf(letters), null, "注意大寫（專有名詞、星期常大寫）。", [w[0]+" = "+s], {say:s, sayAfter:true}); };
G.en_pat=function(){
  var t=ri(0,3);
  if(t===0){ var d=pk(DAYS); return Q("今天是"+d[0]+"。A: What day is today?  B 該怎麼答？", "It's "+d[1]+".",
    shuf(["It's "+d[1]+".","It "+d[1]+".","Is "+d[1]+".","I am "+d[1]+"."]), null, "It's = It is。", ["What day is today? It's "+d[1]+"."], {say:"It's "+d[1]+"."}); }
  if(t===1){ var a=pk(DAYS), b=pk(DAYS.filter(function(x){return x[0]!==a[0];})); return Q("今天是"+b[0]+"，不是"+a[0]+"。A: Is today "+a[1]+"?  該怎麼答？", "No, it's "+b[1]+".",
    shuf(["No, it's "+b[1]+".","Yes, it is.","No, I don't.","Yes, I am "+b[1]+"."]), null, "先說 No, it isn't / No, it's … 再更正。", ["No, it's "+b[1]+"."], {say:"No, it's "+b[1]+"."}); }
  if(t===2){ var s=pk(SUBJS); return Q("我最喜歡的科目是"+s[0]+"。A: What's your favorite subject?  該怎麼答？", "My favorite subject is "+s[1]+".",
    shuf(["My favorite subject is "+s[1]+".","I favorite is "+s[1]+".","My subject favorite "+s[1]+".","He favorite subject is "+s[1]+"."]), null, "My favorite subject is …", ["My favorite subject is "+s[1]+"."], {say:"My favorite subject is "+s[1]+"."}); }
  var s2=pk(SUBJS), who=pk([["他","his","What's his favorite subject?"],["她","her","What's her favorite subject?"]]);
  return Q(who[0]+"最喜歡的科目是"+s2[0]+"。A: "+who[2]+"  該怎麼答？", who[1][0].toUpperCase()+who[1].slice(1)+" favorite subject is "+s2[1]+".",
    shuf([who[1][0].toUpperCase()+who[1].slice(1)+" favorite subject is "+s2[1]+".","He favorite subject is "+s2[1]+".","She favorite is "+s2[1]+".","My favorite subject is "+s2[1]+"."]),
    null, "his / her + favorite subject is …", [who[2]+" "+who[1][0].toUpperCase()+who[1].slice(1)+" favorite subject is "+s2[1]+"."], {say:who[1][0].toUpperCase()+who[1].slice(1)+" favorite subject is "+s2[1]+"."});
};

// ===== 單元設定（數學按六～十單元分開；期末衝刺再做綜合）=====
var MATH_C="#ff9f68", EN_C="#b48ee0";
var G6=["frac_addsub","frac_word","frac_mix","frac_reduce","frac_compare"];
var G7=["sym_axes","sym_prop"];
var G8=["order_ops","ops_word","dist_law","avg_prob","div_chain"];
var G9=["area","area_rev","area_compound"];
var G10=["solid","solid_net","solid_rel","sphere"];
var G610=G6.concat(G7,G8,G9,G10);
var GX=["frac_mix","frac_between","frac_addsub","area_rev","area_compound","order_ops","dist_law","avg_prob","solid","solid_rel","sym_prop"];
function MU(id,name,gen,round){ return {id:id,name:name,color:MATH_C,scratch:true,round:round||10,gen:gen,questions:[]}; }
var MATH_UNITS=[
  MU("mg6","🎲 第六單元 異分母分數的加減",G6),
  MU("mg7","🎲 第七單元 線對稱圖形",G7),
  MU("mg8","🎲 第八單元 整數四則運算",G8),
  MU("mg9","🎲 第九單元 面積",G9),
  MU("mg10","🎲 第十單元 柱體、錐體和球",G10),
  MU("mgX","⭐🎲 數學資優挑戰（六～十）",GX,8)
];
var EN_UNITS=[
  {id:"egA", name:"🎲 英文期末隨機練習（星期・科目・新年・句型）", color:EN_C, round:10, gen:["en_zh2en","en_en2zh","en_blank","en_pat"], questions:[]}
];
function make(gid){ var q=G[gid](); q.gid=gid; return q; }
function sub(id){ return D.subjects.filter(function(s){return s.id===id;})[0]; }
function unitById(id){ var r=null; D.subjects.forEach(function(s){ s.units.forEach(function(u){ if(u.id===id) r=u; }); }); return r; }
MATH_UNITS.forEach(function(u){ sub("math").units.push(u); });
var zfMa=MU("zf_ma","🎲 數學期末綜合（六～十）隨機題",G610,10);
sub("exam").units.splice(1,0,zfMa);
var mix=unitById("zf_mix"); if(mix) mix.gen=G610;
var gift=unitById("zf_gift"); if(gift) gift.gen=GX;
var zfEn=unitById("zf_en"); if(zfEn) zfEn.gen=["en_zh2en","en_en2zh","en_blank","en_pat"];
if(W.length>=4) EN_UNITS.forEach(function(u){ sub("english").units.unshift(u); });
window.PRACTICE_GEN={make:make, generators:G, list:Object.keys(G)};
})();
