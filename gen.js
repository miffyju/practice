// 數學題目產生器：每題由「產生器名稱＋種子」決定（同一個種子永遠產生同一題），答案由程式計算。
// 回傳格式與 data.js 題目相同：{type:"num"|"mc", q, answer(字串), options?, hint, explain[]}
(function(){
"use strict";
function rng(seed){ var a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; var t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function R(r){ return {
  int:function(a,b){ return a+Math.floor(r()*(b-a+1)); },
  pick:function(arr){ return arr[Math.floor(r()*arr.length)]; },
  shuffle:function(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
}; }
var NAMES=["小明","小美","阿哲","小芸","小安","紫嫈","阿凱","小萱","哥哥","姊姊"];
var PLACE=["個","十","百","千"];
function num(q,ans,hint,explain){ return {type:"num",q:q,answer:String(ans),hint:hint,explain:explain}; }
function mc(q,ans,opts,hint,explain){ return {type:"mc",q:q,answer:String(ans),options:opts.map(String),hint:hint,explain:explain}; }
function uniqOpts(x,ans,cands){ var o=[String(ans)]; cands.forEach(function(c){ c=String(c); if(o.length<4&&o.indexOf(c)<0) o.push(c); }); return x.shuffle(o); }
// 有進位/退位的四位數
function noZeroTail(x){ return x.int(1,9); }

var G={
// ---------- 第1單元 10000以內的數 ----------
m1_compose:function(x){ var a=x.int(1,8),b=x.int(0,19),c=x.int(0,19),d=x.int(0,9); if(b<10&&c<10&&x.int(0,1)) b+=10;
  var v=a*1000+b*100+c*10+d; if(v>9999){ a=1; v=a*1000+b*100+c*10+d; }
  return num(a+" 個一千、"+b+" 個一百、"+c+" 個十和 "+d+" 個一，合起來是多少？",v,"超過 10 個的要進位："+(b>=10?b+" 個一百＝"+(b*100)+"。":"每一位分別算出來再加。"),
   [a+"個一千＝"+(a*1000)+"，"+b+"個一百＝"+(b*100),c+"個十＝"+(c*10)+"，"+d+"個一＝"+d,(a*1000)+"＋"+(b*100)+"＋"+(c*10)+"＋"+d+"＝"+v]); },
m1_place:function(x){ var v=x.int(1000,9999), p=x.int(0,3), dgt=Math.floor(v/Math.pow(10,p))%10;
  if(dgt===0){ v+=Math.pow(10,p); if(v>9999) v-=2*Math.pow(10,p); dgt=Math.floor(v/Math.pow(10,p))%10; }
  if(x.int(0,1)) return num(v+" 的"+PLACE[p]+"位數字是多少？",dgt,"從右邊數：個位、十位、百位、千位。",[v+"：千位"+Math.floor(v/1000)+"、百位"+(Math.floor(v/100)%10)+"、十位"+(Math.floor(v/10)%10)+"、個位"+(v%10),PLACE[p]+"位數字是"+dgt]);
  var val=dgt*Math.pow(10,p);
  return num("在 "+v+" 裡，"+PLACE[p]+"位上的「"+dgt+"」代表多少？",val,"數字在"+PLACE[p]+"位，就表示有幾個"+(p===0?"一":"一"+PLACE[p])+"。",[dgt+" 在"+PLACE[p]+"位","代表 "+dgt+" 個"+(p===0?"一":"一"+PLACE[p])+"＝"+val]); },
m1_digitdiff:function(x){ var ds=x.shuffle([1,2,3,4,5,6,7,8,9]).slice(0,4), a=ds.join(""); var i=x.int(0,2), j=x.int(i+1,3); var b=ds.slice(); var t=b[i]; b[i]=b[j]; b[j]=t; b=b.join("");
  var d=ds[i], pa=3-i, pb=3-j, diff=d*Math.pow(10,pa)-d*Math.pow(10,pb);
  return num(a+" 和 "+b+" 中的「"+d+"」，代表的數相差多少？",diff,"先找出 "+d+" 在兩個數裡各是哪一位。",[a+" 的 "+d+" 在"+PLACE[pa]+"位，代表 "+(d*Math.pow(10,pa)),b+" 的 "+d+" 在"+PLACE[pb]+"位，代表 "+(d*Math.pow(10,pb)),(d*Math.pow(10,pa))+"−"+(d*Math.pow(10,pb))+"＝"+diff]); },
m1_order:function(x){ var ds=x.shuffle([0,1,2,3,4,5,6,7,8,9]).slice(0,4); if(ds[0]===0){ ds[0]=ds[3]; ds[3]=0; }
  var big=x.int(0,1), set={}; var perms=[];
  function perm(a,pre){ if(!a.length){ if(pre[0]!==0) perms.push(+pre.join("")); return; } a.forEach(function(v,k){ perm(a.slice(0,k).concat(a.slice(k+1)),pre.concat([v])); }); }
  perm(ds,[]); perms=x.shuffle(perms).filter(function(v){ if(set[v]) return false; set[v]=1; return true; }).slice(0,4);
  var ans=big?Math.max.apply(null,perms):Math.min.apply(null,perms);
  return mc("下面哪一個數"+(big?"最大":"最小")+"？",ans,x.shuffle(perms),"先比千位；千位一樣再比百位，依序比下去。",["從千位開始一位一位比","所以"+(big?"最大":"最小")+"的是 "+ans]); },
m1_make:function(x){ var ds=x.shuffle([1,2,3,4,5,6,7,8,9]).slice(0,3).concat([0]); var big=x.int(0,1);
  var s=ds.slice().sort(function(a,b){return b-a;}), ans;
  if(big) ans=+s.join(""); else { var asc=ds.slice().sort(function(a,b){return a-b;}); var f=asc[1]; asc.splice(1,1); ans=+([f].concat(asc).join("")); }
  return num("用 "+x.shuffle(ds).join("、")+" 這四張數字卡，每張用一次，排出"+(big?"最大":"最小")+"的四位數是多少？",ans,big?"大的數字放在越前面（千位）越好。":"0 不能放在千位喔！",big?["由大到小排：千位放最大的數字","最大的四位數是 "+ans]:["千位不能是0，放最小的非0數字","其他由小到大排，得到 "+ans]); },
m1_money:function(x){ var a=x.int(1,6),b=x.int(1,12),c=x.int(0,15), tot=a*1000+b*100+c*10, price=x.int(Math.ceil(tot/100)+1, 99)*100;
  if(price>9900) price=9900; var need=price-tot; if(need<=0){ price=tot+x.int(1,30)*100; need=price-tot; }
  if(price>9999){ return num(x.pick(NAMES)+"有 "+a+" 張一千元、"+b+" 張一百元和 "+c+" 個十元，一共是多少元？",tot,"先各自算出多少元再加起來。",[a+"000＋"+(b*100)+"＋"+(c*10)+"＝"+tot]); }
  var n=x.pick(NAMES);
  return num(n+"有 "+a+" 張一千元、"+b+" 張一百元和 "+c+" 個十元。想買一台 "+price+" 元的腳踏車，還差多少元？",need,"先算出"+n+"共有多少元，再用價錢減掉。",[n+"有 "+(a*1000)+"＋"+(b*100)+"＋"+(c*10)+"＝"+tot+" 元",price+"−"+tot+"＝"+need+" 元"]); },
m1_pattern:function(x){ var step=x.pick([10,50,100,200,250,500]), up=x.int(0,1), n=5;
  var start=up?x.int(1,30)*step%9000+step:x.int(5,9)*1000-x.int(0,4)*step; if(up&&start+step*n>9999) start=1000;
  var seq=[]; for(var i=0;i<n;i++) seq.push(start+(up?1:-1)*step*i); if(seq[n-1]<0) seq=seq.map(function(v,i){return 9000-step*i;});
  var ans=seq[n-1]; return num("找規律："+seq.slice(0,n-1).join("、")+"、□，□是多少？",ans,"看看每次"+(up?"多":"少")+"多少。",["每次"+(up?"多 ":"少 ")+step,seq[n-2]+(up?"＋":"−")+step+"＝"+ans]); },
// ---------- 第2單元 四位數的加減 ----------
m2_add:function(x){ var a=x.int(1200,6500), b=x.int(800,9999-a-1); var n=x.pick(NAMES), s=a+b;
  var t=x.pick([["圖書館原有故事書 "+a+" 本，又買進 "+b+" 本，現在共有幾本？","本"],["果園第一天採了 "+a+" 顆柳丁，第二天採了 "+b+" 顆，兩天共採了幾顆？","顆"],[n+"存了 "+a+" 元，過年又拿到紅包 "+b+" 元，現在共有多少元？","元"],["運動會上午有 "+a+" 人進場，下午又來了 "+b+" 人，全天共有幾人進場？","人"]]);
  return num(t[0],s,"個位對齊，從個位開始加，滿十要進位。",[a+"＋"+b+"＝"+s,"共 "+s+" "+t[1]]); },
m2_sub:function(x){ var a=x.pick([x.int(2,9)*1000, x.int(2,9)*1000+x.int(1,9), x.int(2000,9999)]), b=x.int(500,a-100); var d=a-b;
  var t=x.pick([["一台腳踏車 "+b+" 元，爸爸付了 "+a+" 元，應該找回多少元？","元"],["學校有 "+a+" 位學生，其中 "+b+" 位是男生，女生有幾位？","位"],["一本書有 "+a+" 個字，"+x.pick(NAMES)+"已經讀了 "+b+" 個字，還剩幾個字沒讀？","個"],[a+" − "+b+" = ?",""]]);
  return num(t[0],d,"不夠減時要向前一位借 1 當 10；遇到 0 要再往前借。",[a+"−"+b+"＝"+d,"驗算："+d+"＋"+b+"＝"+a]); },
m2_twostep:function(x){ var a=x.int(2500,7000), b=x.int(600,a-500), c=x.int(200,2500); var r=a-b+c;
  var t=x.pick([["圖書館原有 "+a+" 本書，借出 "+b+" 本，又還回 "+c+" 本，現在有幾本？","本"],["倉庫有 "+a+" 箱水，賣出 "+b+" 箱後，又運來 "+c+" 箱，現在有幾箱？","箱"],["文具店有 "+a+" 枝鉛筆，賣掉 "+b+" 枝，又進貨 "+c+" 枝，現在有幾枝？","枝"]]);
  return num(t[0],r,"先算「少掉」的，再算「多出來」的。",["先減："+a+"−"+b+"＝"+(a-b),"再加："+(a-b)+"＋"+c+"＝"+r+" "+t[1]]); },
m2_compare:function(x){ var a=x.int(1200,4500), d=x.int(80,1200), more=x.int(0,1), b=more?a+d:a-d, n1=x.pick(["男生","三年級","紅隊","上午"]), n2={"男生":"女生","三年級":"四年級","紅隊":"藍隊","上午":"下午"}[n1];
  var ask=x.int(0,1);
  if(ask) return num("活動有"+n1+" "+a+" 人，"+n2+"比"+n1+(more?"多 ":"少 ")+d+" 人，"+n2+"和"+n1+"共有幾人？",a+b,"先算出"+n2+"有幾人，再把兩個加起來。",[n2+"："+a+(more?"＋":"−")+d+"＝"+b,"合起來："+a+"＋"+b+"＝"+(a+b)]);
  return num("活動有"+n1+" "+a+" 人，"+n2+"比"+n1+(more?"多 ":"少 ")+d+" 人，"+n2+"有幾人？",b,more?"比較多，要用加法。":"比較少，要用減法。",[a+(more?"＋":"−")+d+"＝"+b]); },
m2_missing:function(x){ var r=x.int(1000,5000), b=x.int(500,4500), type=x.int(0,2);
  if(type===0) return num("一個數減掉 "+b+" 後是 "+r+"，這個數是多少？",r+b,"想一想：減掉以前比較多，要把減掉的加回去。",["這個數 − "+b+" ＝ "+r,"這個數 ＝ "+r+"＋"+b+"＝"+(r+b)]);
  if(type===1) return num("一個數加上 "+b+" 後是 "+(r+b)+"，這個數是多少？",r,"用減法找回原來的數。",[(r+b)+"−"+b+"＝"+r]);
  return num(x.pick(NAMES)+"的存錢筒裡有一些錢，花掉 "+b+" 元後，還剩 "+r+" 元。原來有多少元？",r+b,"花掉的加上剩下的，就是原來的。",[b+"＋"+r+"＝"+(r+b)+" 元"]); },
m2_estimate:function(x){ var a=x.int(11,79)*100+x.int(-30,30), b=x.int(10,(99-Math.round(a/100)))*100+x.int(-30,30); if(b<100) b=150; var A=Math.round(a/100)*100, B=Math.round(b/100)*100, e=A+B;
  return num("用整百估算："+a+" ＋ "+b+" 大約是多少？",e,"先把每個數變成最接近的整百數。",[a+" 大約是 "+A+"，"+b+" 大約是 "+B,A+"＋"+B+"＝"+e]); },
// ---------- 第3單元 公分和毫米 ----------
m3_tomm:function(x){ var c=x.int(1,25), m=x.int(1,9);
  return num(c+" 公分 "+m+" 毫米 ＝ 幾毫米？",c*10+m,"1 公分 ＝ 10 毫米。",[c+" 公分＝"+(c*10)+" 毫米",(c*10)+"＋"+m+"＝"+(c*10+m)+" 毫米"]); },
m3_tocm:function(x){ var v=x.int(21,249); if(v%10===0) v+=3; var c=Math.floor(v/10), m=v%10;
  return mc(v+" 毫米 ＝ 幾公分幾毫米？",c+"公分"+m+"毫米",uniqOpts(x,c+"公分"+m+"毫米",[m+"公分"+c+"毫米",(c+1)+"公分"+m+"毫米",v+"公分",(c-1)+"公分"+(m+10)+"毫米",c+"公分"+((m+1)%10)+"毫米"]),"每 10 毫米是 1 公分。",[v+" 毫米 ＝ "+(c*10)+" 毫米＋"+m+" 毫米",(c*10)+" 毫米＝"+c+" 公分","所以是 "+c+" 公分 "+m+" 毫米"]); },
m3_ruler:function(x){ var a=x.int(1,6)*10+x.int(0,9), b=a+x.int(25,90); var f=function(v){ return Math.floor(v/10)+" 公分"+(v%10?" "+(v%10)+" 毫米":""); };
  var obj=x.pick(["鉛筆","橡皮擦","迴紋針","髮夾","蠟筆"]);
  return num("用尺量"+obj+"，"+obj+"的一端對在 "+f(a)+"，另一端對在 "+f(b)+"，"+obj+"長幾毫米？",b-a,"不是從 0 開始量！用後面的刻度減前面的刻度。",[f(b)+"＝"+b+" 毫米，"+f(a)+"＝"+a+" 毫米",b+"−"+a+"＝"+(b-a)+" 毫米"]); },
m3_join:function(x){ var a=x.int(3,15)*10+x.int(1,9), b=x.int(2,12)*10+x.int(1,9), f=function(v){ return Math.floor(v/10)+" 公分 "+(v%10)+" 毫米"; };
  var c1=x.pick(["紅","黃","綠"]);
  if(x.int(0,1)) return num(c1+"緞帶長 "+f(a)+"，藍緞帶比"+c1+"緞帶長 "+(b)+" 毫米，藍緞帶長幾毫米？",a+b,"先把公分換成毫米，再相加。",[f(a)+"＝"+a+" 毫米",a+"＋"+b+"＝"+(a+b)+" 毫米"]);
  return num("緞帶長 "+f(a)+"，又接上 "+f(b)+"，接好後共幾毫米？（不計接頭）",a+b,"都換成毫米再加。",[f(a)+"＝"+a+" 毫米，"+f(b)+"＝"+b+" 毫米",a+"＋"+b+"＝"+(a+b)+" 毫米"]); },
m3_cut:function(x){ var c=x.int(8,30), cut=x.int(15,c*10-10);
  return num("一條線長 "+c+" 公分，剪掉 "+cut+" 毫米，還剩幾毫米？",c*10-cut,"先把公分換成毫米，單位一樣才能相減。",[c+" 公分＝"+(c*10)+" 毫米",(c*10)+"−"+cut+"＝"+(c*10-cut)+" 毫米"]); },
m3_repeat:function(x){ var c=x.int(2,9), m=x.int(0,9), n=x.int(3,8), v=c*10+m;
  return num("一張書籤長 "+c+" 公分"+(m?" "+m+" 毫米":"")+"，把 "+n+" 張書籤頭尾相接排成一直線，全長幾毫米？",v*n,"先換成毫米，再用乘法。",["一張長 "+v+" 毫米",v+"×"+n+"＝"+(v*n)+" 毫米"]); },
m3_cmp:function(x){ var c=x.int(2,9), m=c*10+x.pick([-4,-2,-1,1,2,5]); var ans=m>c*10?">":"<";
  return mc("比一比："+m+" 毫米 ○ "+c+" 公分，○ 裡要填什麼？",ans,[">","<","="],"把公分換成毫米再比。",[c+" 公分＝"+(c*10)+" 毫米",m+(ans===">"?" > ":" < ")+(c*10)]); },
// ---------- 第4單元 乘法 ----------
m4_calc:function(x){ var a=x.pick([x.int(12,99),x.int(101,999),x.int(1,9)*100+x.int(0,9)]), b=x.int(2,9); if(a*b>9999) b=Math.floor(9999/a);
  return num(a+" × "+b+" = ?",a*b,"從個位開始乘，乘完記得加上進位。",["個位、十位、百位分別乘 "+b+"，再處理進位",a+"×"+b+"＝"+(a*b)]); },
m4_word:function(x){ var b=x.int(3,9), n=x.pick(NAMES);
  var t=x.pick([function(){ var a=x.int(12,48); return ["一盒彩色筆有 "+a+" 枝，買 "+b+" 盒，共有幾枝？",a,"枝"]; },
    function(){ var a=x.int(12,45)*10; return ["一張門票 "+a+" 元，"+b+" 個人去，共要付多少元？",a,"元"]; },
    function(){ var a=x.int(105,350); return [n+"每天跳繩 "+a+" 下，"+b+" 天共跳幾下？",a,"下"]; },
    function(){ var a=x.int(24,96); return ["一輛遊覽車可以坐 "+a+" 人，"+b+" 輛遊覽車共可以坐幾人？",a,"人"]; }])();
  return num(t[0],t[1]*b,"「每一份一樣多，有好幾份」就用乘法。",["每份 "+t[1]+"，有 "+b+" 份",t[1]+"×"+b+"＝"+(t[1]*b)+" "+t[2]]); },
m4_change:function(x){ var p=x.int(12,95), n=x.int(3,9), pay=Math.ceil(p*n/100)*100+x.pick([0,100,500]); if(pay===p*n) pay+=100; if(pay<p*n) pay=Math.ceil(p*n/1000)*1000;
  var it=x.pick(["筆記本","色鉛筆","麵包","飲料","貼紙"]);
  return num("一個"+it+" "+p+" 元，"+x.pick(NAMES)+"買了 "+n+" 個，付了 "+pay+" 元，應該找回多少元？",pay-p*n,"先算總共要付多少錢，再算找回多少。",["先乘："+p+"×"+n+"＝"+(p*n)+" 元","再減："+pay+"−"+(p*n)+"＝"+(pay-p*n)+" 元"]); },
m4_threestep:function(x){ var r=x.int(2,6), b=x.int(3,8), e=x.int(12,30);
  return num("倉庫每排有 "+b+" 箱，每箱 "+e+" 瓶水，共 "+r+" 排，一共有幾瓶？",r*b*e,"可以先算一排有幾瓶，再乘排數。",["一排："+e+"×"+b+"＝"+(e*b)+" 瓶",(e*b)+"×"+r+"＝"+(r*b*e)+" 瓶"]); },
m4_save:function(x){ var w=x.int(4,9), a=x.int(50,250), g=x.int(1,9)*50, n=x.pick(NAMES);
  return num(n+"每週存 "+a+" 元，存了 "+w+" 週後，又拿到紅包 "+g+" 元，現在共有多少元？",a*w+g,"先用乘法算存的錢，再加紅包。",[a+"×"+w+"＝"+(a*w)+" 元",(a*w)+"＋"+g+"＝"+(a*w+g)+" 元"]); },
m4_cmp:function(x){ var exps=[], seen={}; while(exps.length<4){ var a=x.int(12,60), b=x.int(2,9), v=a*b; if(seen[v]) continue; seen[v]=1; exps.push([a+"×"+b,v]); }
  var big=x.int(0,1), best=exps.slice().sort(function(p,q){ return big?q[1]-p[1]:p[1]-q[1]; })[0];
  return mc("下面哪一個算式的答案"+(big?"最大":"最小")+"？",best[0],exps.map(function(e){return e[0];}),"每一個都算算看再比較。",exps.map(function(e){return e[0]+"＝"+e[1];}).concat(["所以"+(big?"最大":"最小")+"的是 "+best[0]])); },
m4_compare_mul:function(x){ var a=x.int(15,80), k=x.int(2,6), n=x.pick(["小明","小美","阿哲","小芸","小安","紫嫈","弟弟","妹妹"]);
  return num("哥哥有 "+a+" 張貼紙，"+n+"的貼紙是哥哥的 "+k+" 倍，兩人共有幾張？",a+a*k,"先算出"+n+"有幾張，再合起來。",[n+"："+a+"×"+k+"＝"+(a*k)+" 張","共："+a+"＋"+(a*k)+"＝"+(a+a*k)+" 張"]); },
// ---------- 第5單元 角 ----------
m5_clock:function(x){ var h=x.pick([1,2,3,4,5,7,8,9,10,11]), d=h>6?12-h:h, ans=d<3?"銳角":d===3?"直角":"鈍角";
  return mc("時鐘 "+h+" 點整時，長針和短針形成的角（比較小的那個）是什麼角？",ans,["銳角","直角","鈍角"],"3 點整是直角；兩針張開比 3 點小還是大？",[h+" 點整，兩針相隔 "+d+" 大格","3 大格是直角，所以是"+ans]); },
m5_right:function(x){ var a=x.int(0,4), b=x.int(1,4), c=x.int(0,3); if(a+b+c===0) a=1;
  var parts=[]; if(a) parts.push(a+" 個長方形"); parts.push(b+" 個正方形"); if(c) parts.push(c+" 個三角板（每個有 1 個直角）");
  return num(parts.join("、")+"，一共有幾個直角？",4*a+4*b+c,"長方形和正方形都有 4 個直角。",[(a?a+"×4＝"+(4*a)+"，":"")+b+"×4＝"+(4*b)+(c?"，三角板 "+c+" 個":""),"合起來 "+(4*a+4*b+c)+" 個"]); },
m5_corners:function(x){ var t=x.int(0,5), q=x.int(0,4), p=x.int(1,3); if(t+q===0) t=1;
  var parts=[]; if(t) parts.push(t+" 個三角形"); if(q) parts.push(q+" 個四邊形"); parts.push(p+" 個五邊形");
  return num(parts.join("、")+"，一共有幾個角？",3*t+4*q+5*p,"三角形 3 個角，四邊形 4 個角，五邊形 5 個角。",[(t?t+"×3＝"+(3*t)+"，":"")+(q?q+"×4＝"+(4*q)+"，":"")+p+"×5＝"+(5*p),"合起來 "+(3*t+4*q+5*p)+" 個"]); },
m5_kind:function(x){ var k=x.pick([["一張紙的直角","直角"],["打開一點點的剪刀","銳角"],["三角板上最尖的角","銳角"],["時鐘 4 點整兩針形成的角","鈍角"],["正方形的角","直角"],["把扇子打開得很大（還沒成一直線）","鈍角"],["時鐘 2 點整兩針形成的角","銳角"],["時鐘 9 點整兩針形成的角","直角"]]);
  return mc("「"+k[0]+"」是哪一種角？",k[1],["銳角","直角","鈍角"],"拿三角板的直角比一比：比直角小是銳角，比直角大是鈍角。",["和直角比一比","答案是"+k[1]]); }
};
var UNITS={
 m1:["m1_compose","m1_place","m1_digitdiff","m1_order","m1_make","m1_money","m1_pattern"],
 m2:["m2_add","m2_sub","m2_twostep","m2_compare","m2_missing","m2_estimate"],
 m3:["m3_tomm","m3_tocm","m3_ruler","m3_join","m3_cut","m3_repeat","m3_cmp"],
 m4:["m4_calc","m4_word","m4_change","m4_threestep","m4_save","m4_cmp","m4_compare_mul"],
 m5:["m5_clock","m5_right","m5_corners","m5_kind"]
};
function make(name,seed){ var f=G[name]; if(!f) return null; var q=f(R(rng(seed))); q.gid=name+"~"+seed; return q; }
var api={generators:G, units:UNITS, make:make, rng:rng, h:{R:R,num:num,mc:mc,uniqOpts:uniqOpts,NAMES:NAMES}};
if(typeof window!=="undefined") window.PRACTICE_GEN=api;
if(typeof module!=="undefined") module.exports=api;
})();
