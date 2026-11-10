// 數學題目產生器（第二部分）：單元 5～9 的新增題型、多步驟挑戰題。載入順序：gen.js → gen2.js
(function(){
"use strict";
var api = (typeof window!=="undefined" && window.PRACTICE_GEN) ? window.PRACTICE_GEN : require("./gen.js");
var H=api.h, num=H.num, mc=H.mc, uniqOpts=H.uniqOpts, NAMES=H.NAMES, G=api.generators, U=api.units;
function fr(a,b){ return a+"/"+b; }
function lmml(v){ var l=Math.floor(v/1000), m=v%1000; return (l?l+" 公升":"")+(l&&m?" ":"")+(m?m+" 毫升":""); }
function lm(a,b){ return a+" 公升"+(b?" "+b+" 毫升":""); }

var g={
// ---------- 第5單元 角（新增） ----------
m5_clockright:function(x){ var ans=x.pick([3,9]), wrong=x.shuffle([1,2,4,5,6,7,8,10,11,12]).slice(0,3);
  return mc("下面哪一個時間，時鐘的長針和短針會形成直角？",ans+" 點整",x.shuffle([ans].concat(wrong)).map(function(h){return h+" 點整";}),"直角像紙張的角，3 點整和 9 點整兩針是互相垂直的。",["3 點整、9 點整，兩針形成直角","所以答案是 "+ans+" 點整"]); },
m5_cmp:function(x){ var kinds=x.shuffle(["銳角","直角","鈍角"]), names=["甲","乙","丙"], desc={"銳角":"比直角小","直角":"剛好和直角一樣大","鈍角":"比直角大"};
  var ask=x.pick(["最大","最小","是直角"]), target=ask==="最大"?"鈍角":ask==="最小"?"銳角":"直角", ans=names[kinds.indexOf(target)];
  var t=names.map(function(n,i){ return n+"角"+desc[kinds[i]]; }).join("，");
  return mc("用三角板的直角比一比："+t+"。哪一個角"+ask+"？",ans,names,"比直角小是銳角，比直角大是鈍角。",names.map(function(n,i){return n+"角是"+kinds[i];}).concat(["所以"+ask+"的是"+ans+"角"])); },
m5_cut:function(x){ var k=x.int(1,4), n=x.pick(["長方形","正方形"]), nm=x.pick(["色紙","卡片","紙板"]);
  return num("一張"+n+nm+"有 4 個角，用剪刀每次剪掉一個角（每次剪一刀、剪掉一個角），剪了 "+k+" 次後，這張紙一共有幾個角？",4+k,"每剪掉一個角，會多出一個角。",["剪掉一個角，原本 1 個角變成 2 個角，總數多 1","4＋"+k+"＝"+(4+k)+" 個角"]); },
m5_poly:function(x){ var N={3:"三",4:"四",5:"五",6:"六",7:"七",8:"八"}, n=x.int(3,8), m=x.int(3,8), a=x.int(1,3), b=x.int(1,3), what=x.int(0,1), nm=x.pick(["圖形","紙片","積木面"]);
  return num("有 "+a+" 個"+N[n]+"邊形的"+nm+"，和 "+b+" 個"+N[m]+"邊形的"+nm+"，一共有幾"+(what?"條邊":"個角")+"？",a*n+b*m,"N 邊形有 N 個角、N 條邊。",[N[n]+"邊形有 "+n+" "+(what?"條邊":"個角")+"，"+N[m]+"邊形有 "+m+" "+(what?"條邊":"個角"),a+"×"+n+"＋"+b+"×"+m+"＝"+(a*n+b*m)]); },
// ---------- 第6單元 面積 ----------
m6_unit:function(x){ var a=x.int(4,18), b=x.int(4,18), nm=x.pick(["甲","乙"]);
  return num("邊長 1 公分的小正方形，面積是 1 平方公分。甲圖形用了 "+a+" 個，乙圖形用了 "+b+" 個，兩個圖形合起來的面積是多少平方公分？",a+b,"一個小正方形是 1 平方公分。",["甲："+a+" 平方公分，乙："+b+" 平方公分",a+"＋"+b+"＝"+(a+b)+" 平方公分"]); },
m6_rect:function(x){ var a=x.int(3,30), b=x.int(2,Math.min(a,25)), t=x.pick([["一張長方形卡片","卡片"],["一塊長方形的布","布"],["一個長方形的公布欄","公布欄"],["一張長方形的桌墊","桌墊"]]);
  return num(t[0]+"，長 "+a+" 公分，寬 "+b+" 公分，面積是多少平方公分？",a*b,"長方形面積＝長×寬。",["長×寬："+a+"×"+b+"＝"+(a*b),"面積是 "+(a*b)+" 平方公分"]); },
m6_square:function(x){ var a=x.int(3,30), t=x.pick(["一張正方形色紙","一塊正方形地墊","一片正方形磁磚","一個正方形的相框"]);
  return num(t+"，邊長 "+a+" 公分，面積是多少平方公分？",a*a,"正方形的四個邊一樣長，面積＝邊長×邊長。",[a+"×"+a+"＝"+(a*a),"面積是 "+(a*a)+" 平方公分"]); },
m6_findside:function(x){ var a=x.int(3,12), b=x.int(2,9);
  return num("一個長方形的面積是 "+(a*b)+" 平方公分，長是 "+a+" 公分，寬是幾公分？",b,"想："+a+"×□＝"+(a*b)+"。",["長×寬＝面積，"+a+"×□＝"+(a*b),"因為 "+a+"×"+b+"＝"+(a*b)+"，所以寬是 "+b+" 公分"]); },
m6_cmp:function(x){ var a=x.int(4,16), b=x.int(3,12), c=x.int(4,16), d=x.int(3,12); if(a*b===c*d) c++;
  var A=a*b, B=c*d, big=Math.max(A,B), sm=Math.min(A,B);
  return num("甲長方形長 "+a+" 公分、寬 "+b+" 公分；乙長方形長 "+c+" 公分、寬 "+d+" 公分。兩個長方形的面積相差多少平方公分？",big-sm,"先分別算出兩個面積，再相減。",["甲："+a+"×"+b+"＝"+A,"乙："+c+"×"+d+"＝"+B,big+"−"+sm+"＝"+(big-sm)]); },
m6_L:function(x){ var a=x.int(8,20), b=x.int(6,15), c=x.int(2,a-3), d=x.int(2,b-2), nm=x.pick(["紙板","色紙","木板"]);
  return num("一張長 "+a+" 公分、寬 "+b+" 公分的長方形"+nm+"，剪掉一個長 "+c+" 公分、寬 "+d+" 公分的小長方形角，剩下的面積是多少平方公分？",a*b-c*d,"先算大長方形，再減掉剪掉的小長方形。",["大長方形："+a+"×"+b+"＝"+(a*b),"剪掉："+c+"×"+d+"＝"+(c*d),(a*b)+"−"+(c*d)+"＝"+(a*b-c*d)]); },
m6_wall:function(x){ var n=x.int(2,6), a=x.int(10,40), b=x.int(10,30), nm=x.pick(["海報","美勞作品","班級照片","獎狀"]);
  return num("牆上貼了 "+n+" 張一樣大的長方形"+nm+"，每張長 "+a+" 公分、寬 "+b+" 公分，一共佔了多少平方公分？",n*a*b,"先算一張的面積，再乘張數。",["一張："+a+"×"+b+"＝"+(a*b)+" 平方公分",(a*b)+"×"+n+"＝"+(n*a*b)+" 平方公分"]); },
m6_remain:function(x){ var a=x.int(10,40), b=x.int(8,30), use=x.int(5,Math.floor(a*b/2)), nm=x.pick(["色紙","白紙","布"]);
  return num("一張長 "+a+" 公分、寬 "+b+" 公分的長方形"+nm+"，用掉了 "+use+" 平方公分，還剩下多少平方公分？",a*b-use,"先算全部的面積，再減掉用掉的。",["全部："+a+"×"+b+"＝"+(a*b),(a*b)+"−"+use+"＝"+(a*b-use)+" 平方公分"]); },
// ---------- 第7單元 除法 ----------
m7_share:function(x){ var d=x.int(2,9), q=x.int(2,9), n=x.pick(NAMES), t=x.pick([["顆糖果","顆"],["張貼紙","張"],["枝鉛筆","枝"],["本故事書","本"]]);
  return num(n+"有 "+(d*q)+" "+t[0]+"，平均分給 "+d+" 個人，每個人分到幾"+t[1]+"？",q,"平分用除法，想想九九乘法：□×"+d+"＝"+(d*q)+"。",[(d*q)+"÷"+d+"＝"+q,"每人 "+q+" "+t[1]]); },
m7_group:function(x){ var d=x.int(2,9), q=x.int(2,9), t=x.pick([["個蘋果","每 "+d+" 個裝一袋","袋"],["位小朋友","每 "+d+" 位一組","組"],["枝彩色筆","每 "+d+" 枝裝一盒","盒"]]);
  return num("有 "+(d*q)+" "+t[0]+"，"+t[1]+"，剛好可以分成幾"+t[2]+"？",q,"每份一樣多，問可以分成幾份，也是用除法。",[(d*q)+"÷"+d+"＝"+q,"可以分成 "+q+" "+t[2]]); },
m7_rem:function(x){ var d=x.int(3,9), q=x.int(2,9), r=x.int(1,d-1), n=d*q+r, ask=x.int(0,1);
  return num(n+" ÷ "+d+"，"+(ask?"商是多少？":"餘數是多少？"),ask?q:r,"想："+d+" 乘幾最接近 "+n+"又不超過？",[d+"×"+q+"＝"+(d*q)+"，"+n+"−"+(d*q)+"＝"+r,n+" ÷ "+d+" ＝ "+q+" … "+r]); },
m7_pack:function(x){ var d=x.int(3,9), q=x.int(3,9), r=x.int(1,d-1), n=d*q+r, ask=x.int(0,1), t=x.pick([["顆糖果","包","顆"],["顆彈珠","袋","顆"],["張色紙","疊","張"]]);
  return num("有 "+n+" "+t[0]+"，每 "+d+" "+t[2]+"裝成一"+t[1]+"，"+(ask?"最多可以裝滿幾"+t[1]+"？":"裝滿以後，還剩下幾"+t[2]+"？"),ask?q:r,ask?"商就是裝滿的數量。":"餘數就是剩下的。",[n+" ÷ "+d+" ＝ "+q+" … "+r,ask?"最多裝滿 "+q+" "+t[1]:"剩下 "+r+" "+t[2]]); },
m7_need:function(x){ var d=x.int(3,9), q=x.int(3,8), r=x.int(1,d-1), n=d*q+r, t=x.pick([["人去郊遊","輛小客車","每輛車最多坐"],["位學生分組","張桌子","每張桌子最多坐"],["本書要裝箱","個箱子","每個箱子最多裝"]]);
  return num(n+" "+t[0]+"，"+t[2]+" "+d+" 個，至少需要幾"+t[1]+"才夠？",q+1,"有餘下的也要再多一個才夠喔！",[n+" ÷ "+d+" ＝ "+q+" … "+r,"還剩 "+r+" 個，還要再多 1 個，所以是 "+q+"＋1＝"+(q+1)]); },
m7_check:function(x){ var d=x.int(3,9), q=x.int(3,9), r=x.int(1,d-1);
  return num("□ ÷ "+d+" ＝ "+q+" … "+r+"，□ 是多少？",d*q+r,"被除數＝商×除數＋餘數。",[q+"×"+d+"＝"+(q*d),(q*d)+"＋"+r+"＝"+(d*q+r)]); },
m7_fact:function(x){ var d=x.int(2,9), q=x.int(2,9), form=x.int(0,1);
  return num((form?(d+" × □ ＝ "+(d*q)):("□ × "+d+" ＝ "+(d*q)))+"，□ 是多少？",q,"乘法算式裡找不到的數，可以用除法算。",[(d*q)+" ÷ "+d+" ＝ "+q]); },
m7_twostep:function(x){ var d=x.int(2,8), q=x.int(3,9), e=x.int(1,6), t=x.int(0,2), n=x.pick(NAMES);
  if(t===0) return num(n+"把 "+(d*q)+" 顆糖果平分給 "+d+" 個人，每個人後來又多拿到 "+e+" 顆。現在每個人有幾顆？",q+e,"先除，再加。",[(d*q)+"÷"+d+"＝"+q,q+"＋"+e+"＝"+(q+e)]);
  if(t===1){ var a=x.int(2,6); return num("買了 "+a+" 盒餅乾，每盒 "+(d*q)+" 片，要平均分給 "+d+" 個人，每個人可以分到幾片？",a*q,"先算一共有幾片，再平分。",[a+"×"+(d*q)+"＝"+(a*d*q),(a*d*q)+"÷"+d+"＝"+(a*q)]); }
  var base=x.int(3,9)*d; return num(n+"有 "+base+" 張貼紙，又得到 "+(d*q)+" 張，再平分給 "+d+" 個好朋友。每個好朋友分到幾張？",(base+d*q)/d,"先加，再平分。",[base+"＋"+(d*q)+"＝"+(base+d*q),(base+d*q)+"÷"+d+"＝"+((base+d*q)/d)]); },
m7_cmp:function(x){ var ex=[],seen={}; while(ex.length<4){ var d=x.int(2,9), q=x.int(2,9), r=x.int(0,d-1); var n=d*q+r; var key=n+"÷"+d; if(seen[q]) continue; seen[q]=1; ex.push([n+" ÷ "+d,q]); }
  var big=x.int(0,1), best=ex.slice().sort(function(a,b){return big?b[1]-a[1]:a[1]-b[1];})[0];
  return mc("下面哪一個算式的「商」"+(big?"最大":"最小")+"？",best[0],ex.map(function(e){return e[0];}),"每個都算算看，只比商，不比餘數。",ex.map(function(e){return e[0]+" 的商是 "+e[1];})); },
m7_remrule:function(x){ var d=x.int(5,9), n=d*x.int(2,8)+x.int(1,d-1), wrong=x.shuffle([1,2,3,4,5,6,7,8].filter(function(v){return v<d;})).slice(0,3), ans=x.pick([d,d+1,d+2]);
  return mc("一個數除以 "+d+"，餘數不可能是下面哪一個？",String(ans),x.shuffle([ans].concat(wrong)),"餘數一定要比除數小。",["除數是 "+d+"，餘數只能是 1 到 "+(d-1),ans+" 不小於 "+d+"，所以不可能"]); },
// ---------- 第8單元 公升和毫升 ----------
m8_toml:function(x){ var a=x.int(1,9), b=x.int(1,999), tot=a*1000+b;
  return num(lm(a,b)+" ＝ 幾毫升？",tot,"1 公升＝1000 毫升。",[a+" 公升＝"+(a*1000)+" 毫升",(a*1000)+"＋"+b+"＝"+tot+" 毫升"]); },
m8_tol:function(x){ var a=x.int(1,9), b=x.int(1,99)*10+x.pick([0,5]); if(b>=1000) b=500; var v=a*1000+b, ans=lm(a,b);
  return mc(v+" 毫升 ＝ 幾公升幾毫升？",ans,uniqOpts(x,ans,[lm(b>999?1:b%10?b:b,a),lm(a+1,b),lm(a,Math.floor(b/2)),lm(a-1<1?a+2:a-1,b)]),"每 1000 毫升是 1 公升。",[v+" 毫升 ＝ "+(a*1000)+" ＋ "+b,"＝ "+ans]); },
m8_add:function(x){ var a1=x.int(1,4), b1=x.int(50,950), a2=x.int(1,4), b2=x.int(50,950), n1=x.pick(["水桶","水壺","水缸"]), n2=x.pick(["果汁","牛奶","飲料"]);
  return num("甲"+n1+"裝了 "+lm(a1,b1)+" 的水，乙"+n1+"裝了 "+lm(a2,b2)+" 的水，兩個"+n1+"一共有幾毫升的水？",a1*1000+b1+a2*1000+b2,"先都換成毫升，再相加。",[lm(a1,b1)+"＝"+(a1*1000+b1)+" 毫升",lm(a2,b2)+"＝"+(a2*1000+b2)+" 毫升",(a1*1000+b1)+"＋"+(a2*1000+b2)+"＝"+(a1*1000+b1+a2*1000+b2)]); },
m8_sub:function(x){ var T=x.int(2500,9500), ua=x.int(1,Math.floor(T/1000)-1), ub=x.int(10,990), u=ua*1000+ub; if(u>=T){ ua=1; u=1000+ub; }
  var nm=x.pick(["牛奶","果汁","豆漿","食用油"]);
  return num("一桶"+nm+"有 "+T+" 毫升，用去 "+lm(ua,ub)+"，還剩下多少毫升？",T-u,"先把用掉的換成毫升，再用減法。",[lm(ua,ub)+"＝"+u+" 毫升",T+"−"+u+"＝"+(T-u)+" 毫升"]); },
m8_cmp:function(x){ var a=x.int(1,6), b=x.int(100,900), c=a*1000+b+x.pick([-150,-50,-10,10,50,150]), ans=(a*1000+b)>c?">":(a*1000+b)<c?"<":"=";
  return mc("比一比："+lm(a,b)+" ○ "+c+" 毫升，○ 裡要填什麼？",ans,[">","<","="],"把公升換成毫升再比。",[lm(a,b)+"＝"+(a*1000+b)+" 毫升",(a*1000+b)+" "+ans+" "+c]); },
m8_pour:function(x){ var a=x.int(2,6), n=x.int(3,8), c=x.pick([150,200,250,300]); while(n*c>=a*1000-100){ n--; }
  return num("水壺裡有 "+a+" 公升的水，倒進 "+n+" 個杯子，每杯倒 "+c+" 毫升，水壺裡還剩下幾毫升？",a*1000-n*c,"先算倒出去的，再用總量減。",[a+" 公升＝"+(a*1000)+" 毫升",n+"×"+c+"＝"+(n*c)+" 毫升",(a*1000)+"−"+(n*c)+"＝"+(a*1000-n*c)]); },
m8_unit:function(x){ var it=x.pick([["一個水桶可以裝 8 （　）的水。","公升"],["一瓶眼藥水有 10 （　）。","毫升"],["一瓶礦泉水有 600 （　）。","毫升"],["一個浴缸可以裝 150 （　）的水。","公升"],["一湯匙糖漿大約是 15 （　）。","毫升"],["一個大水壺可以裝 3 （　）的茶。","公升"],["一杯牛奶有 240 （　）。","毫升"],["一個魚缸可以裝 50 （　）的水。","公升"]]);
  return mc("在（　）裡填入適當的單位："+it[0],it[1],["公升","毫升","公分","公斤"],"想想這個容器是大的還是小的。",["比較大的容量用公升，比較小的容量用毫升","答案是 "+it[1]]); },
m8_share:function(x){ var T=x.int(1,9), n=x.pick([2,4,5,8]), nm=x.pick(["果汁","豆漿","牛奶","綠茶"]);
  return num(T+" 公升的"+nm+"，平均倒入 "+n+" 個杯子，每個杯子有幾毫升？",T*1000/n,"先換成毫升，再用除法平分。",[T+" 公升＝"+(T*1000)+" 毫升",(T*1000)+"÷"+n+"＝"+(T*1000/n)+" 毫升"]); },
m8_bottle:function(x){ var c=x.pick([250,300,350,400,450,500,600,750]), n=x.int(3,9);
  return num("每瓶飲料有 "+c+" 毫升，買 "+n+" 瓶，一共有幾毫升？",c*n,"每瓶一樣多，用乘法。",[c+"×"+n+"＝"+(c*n)+" 毫升"]); },
m8_more:function(x){ var a=x.int(1500,4500), d=x.int(200,1900);
  return num("甲桶有 "+a+" 毫升的水，乙桶比甲桶多 "+d+" 毫升，兩桶一共有幾毫升？",2*a+d,"先算乙桶有多少，再合起來。",["乙桶："+a+"＋"+d+"＝"+(a+d)+" 毫升","一共："+a+"＋"+(a+d)+"＝"+(2*a+d)+" 毫升"]); },
// ---------- 第9單元 分數 ----------
m9_read:function(x){ var n=x.int(4,12), k=x.int(1,n-1), t=x.pick([["一盒","個","餅乾"],["一盒","個","雞蛋"],["一袋","顆","糖果"]]), who=x.pick(NAMES), ans=fr(k,n)+" "+t[0].charAt(1);
  var a=fr(k,n)+" "+t[0].charAt(1);
  return mc(t[0]+"有 "+n+" "+t[1]+t[2]+"，"+who+"吃了 "+k+" "+t[1]+"，"+who+"吃了幾"+t[0].charAt(1)+"？",a,uniqOpts(x,a,[fr(n,k)+" "+t[0].charAt(1),fr(n-k,n)+" "+t[0].charAt(1),fr(k,n+1)+" "+t[0].charAt(1),fr(k+1,n)+" "+t[0].charAt(1)]),"把全部平分成 "+n+" 份，吃了其中 "+k+" 份。",["全部 "+n+" 份，吃了 "+k+" 份","分母是 "+n+"，分子是 "+k+"，所以是 "+a]); },
m9_count:function(x){ var n=x.pick([6,8,9,10,12]), k=x.int(2,n-1), t=x.pick([["一盒","雞蛋"],["一盒","餅乾"],["一盒","色筆"]]);
  return num(t[0]+t[1]+"有 "+n+" 個，"+fr(k,n)+" "+t[0].charAt(1)+"是幾個？",k,"分母是全部平分成幾份，分子是取其中幾份。",["全部 "+n+" 個，平分成 "+n+" 份，每份 1 個",fr(k,n)+" 就是 "+k+" 份，也就是 "+k+" 個"]); },
m9_unit:function(x){ var n=x.int(3,12), k=x.int(2,n-1), a=fr(k,n);
  return mc(k+" 個 "+fr(1,n)+" 合起來是多少？",a,uniqOpts(x,a,[fr(1,n*k>99?n:n*k),fr(n,k),fr(k,k+1),fr(k+1,n)]),"1/"+n+" 是一份，"+k+" 份合起來。",[fr(1,n)+" 的分母是 "+n+"，分子是 1","合起來有 "+k+" 份，所以是 "+a]); },
m9_cmp:function(x){ var n=x.int(5,12), a=x.int(1,n), b=x.int(1,n), ans=a>b?">":a<b?"<":"=";
  return mc("比一比："+fr(a,n)+" ○ "+fr(b,n)+"，○ 裡要填什麼？",ans,[">","<","="],"分母一樣時，分子越大，分數越大。",["分母都是 "+n+"，比分子：",a+" "+ans+" "+b+"，所以 "+fr(a,n)+" "+ans+" "+fr(b,n)]); },
m9_order:function(x){ var n=x.int(6,12), s=x.shuffle([1,2,3,4,5,6,7,8,9,10,11].filter(function(v){return v<n;})).slice(0,4), big=x.int(0,1), v=big?Math.max.apply(null,s):Math.min.apply(null,s), ans=fr(v,n);
  return mc("下面哪一個分數"+(big?"最大":"最小")+"？",ans,s.map(function(k){return fr(k,n);}),"分母一樣，比分子。",["分母都是 "+n,"分子最"+(big?"大":"小")+"的是 "+v+"，所以是 "+ans]); },
m9_diff:function(x){ var n=x.pick([6,8,9,10,12]), a=x.int(1,n-3), b=x.int(a+1,n-1), p=x.pick(NAMES), q=x.pick(["哥哥","姊姊","媽媽","爸爸"]), t=x.pick(["雞蛋","餅乾","巧克力"]);
  return num("一盒"+t+"有 "+n+" 個。"+p+"吃了 "+fr(a,n)+" 盒，"+q+"吃了 "+fr(b,n)+" 盒，"+q+"比"+p+"多吃了幾個？",b-a,"先把分數換成幾個。",[fr(a,n)+" 盒是 "+a+" 個，"+fr(b,n)+" 盒是 "+b+" 個",b+"−"+a+"＝"+(b-a)+" 個"]); },
m9_left:function(x){ var n=x.int(4,12), k=x.int(1,n-1), a=fr(n-k,n), t=x.pick(["蛋糕","披薩","巧克力片"]);
  return mc("一個"+t+"平分成 "+n+" 份，吃掉 "+k+" 份，還剩下幾分之幾？",a,uniqOpts(x,a,[fr(k,n),fr(n,n-k),fr(n-k,n+1),fr(n-k+1<n?n-k+1:n-k-1<1?1:n-k-1,n)]),"全部是 "+n+" 份，先算剩下幾份。",[n+"−"+k+"＝"+(n-k)+" 份","剩下 "+a]); },
m9_numline:function(x){ var n=x.int(4,10), k=x.int(1,n-1), a=fr(k,n);
  return mc("數線上從 0 到 1 平分成 "+n+" 等份，從 0 數起第 "+k+" 個點，要標成多少？",a,uniqOpts(x,a,[fr(k+1<n?k+1:k-1,n),fr(n,k),fr(k,n+1),fr(k-1<1?k+2:k-1,n)]),"每一小段是 "+fr(1,n)+"。",["每一小段是 "+fr(1,n),"第 "+k+" 個點是 "+k+" 個 "+fr(1,n)+"＝"+a]); },
m9_meter:function(x){ var n=x.pick([2,4,5,10]), k=x.int(1,n-1), cm=k*100/n;
  return num(fr(k,n)+" 公尺是幾公分？（1 公尺＝100 公分）",cm,"1 公尺平分成 "+n+" 份，每份是幾公分？",["100 ÷ "+n+" ＝ "+(100/n)+" 公分（一份）",(100/n)+"×"+k+"＝"+cm+" 公分"]); },
m9_between:function(x){ var n=x.int(6,12), a=x.int(1,n-4), c=a+3, ans=fr(a+1,n);
  return mc("按照順序填填看："+fr(a,n)+" → （　）→ （　）→ "+fr(c,n)+"，第一個（　）要填什麼？",ans,uniqOpts(x,ans,[fr(a+2,n),fr(a,n+1),fr(a+3,n),fr(a-1<1?a+4:a-1,n)]),"分母一樣，分子一個一個加 1。",[fr(a,n)+"、"+fr(a+1,n)+"、"+fr(a+2,n)+"、"+fr(c,n),"第一個空格是 "+ans]); },
m9_two:function(x){ var n=x.pick([8,10,12]), a=x.int(1,3), b=x.int(1,3), p=x.pick(NAMES), t=x.pick(["披薩","蛋糕","派"]);
  return num("一個"+t+"平分成 "+n+" 片，"+p+"吃了 "+a+" 片，弟弟吃了 "+b+" 片，還剩下幾片？",n-a-b,"先算吃了幾片，再用全部減。",[a+"＋"+b+"＝"+(a+b)+" 片",n+"−"+(a+b)+"＝"+(n-a-b)+" 片"]); },
m9_whole:function(x){ var n=x.int(3,12);
  return mc("一個蛋糕平分成 "+n+" 份，把 "+n+" 份全部合起來，是多少個蛋糕？",fr(n,n)+"＝1 個",[fr(n,n)+"＝1 個",fr(n,n)+"＝"+n+" 個","0 個","2 個"],"全部合起來就是原來的一整個。",[fr(n,n)+" 表示 "+n+" 份中的 "+n+" 份，就是一整個"]); },
// ---------- 期末衝刺：多步驟應用題 ----------
f_trip:function(x){ var d=x.pick([4,5,6,8]), q=x.int(5,8), r=x.int(1,d-1), n=d*q+r, rent=x.pick([200,300,400,500,600]), cars=q+1, cls=x.pick(["三年級","三年二班","校外教學的同學"]);
  return num(cls+"共 "+n+" 人要搭小巴士，每輛最多坐 "+d+" 人，每輛租金 "+rent+" 元。要租幾輛才夠？一共要付多少元？（請輸入總共要付的錢）",cars*rent,"先算要幾輛（有剩下要多一輛），再乘租金。",[n+" ÷ "+d+" ＝ "+q+" … "+r+"，要 "+cars+" 輛",cars+"×"+rent+"＝"+(cars*rent)+" 元"]); },
f_shop:function(x){ var p=x.int(12,48), n=x.int(3,9), q=x.int(2,5), p2=x.int(15,60), pay=Math.ceil((p*n+p2*q)/100)*100+x.pick([0,100,200]), nm=x.pick(NAMES);
  return num(nm+"買了 "+n+" 本筆記本，每本 "+p+" 元，又買了 "+q+" 枝筆，每枝 "+p2+" 元，付了 "+pay+" 元，應該找回多少元？",pay-(p*n+p2*q),"先算兩種東西各花多少，再算找錢。",[p+"×"+n+"＝"+(p*n)+"，"+p2+"×"+q+"＝"+(p2*q),"共 "+(p*n+p2*q)+" 元",pay+"−"+(p*n+p2*q)+"＝"+(pay-(p*n+p2*q))]); },
f_tile:function(x){ var a=x.pick([2,3,4,5]), m=x.int(3,8), k=x.int(2,6), L=a*m, W=a*k;
  return num("一塊長 "+L+" 公分、寬 "+W+" 公分的長方形布，要用邊長 "+a+" 公分的正方形小布塊鋪滿，需要幾塊？（先算每排幾塊、共幾排）",m*k,"長邊可以排幾塊？寬邊可以排幾塊？",["長："+L+"÷"+a+"＝"+m+" 塊","寬："+W+"÷"+a+"＝"+k+" 排",m+"×"+k+"＝"+(m*k)+" 塊"]); },
f_juice:function(x){ var a=x.int(2,6), n=x.pick([4,5,8,10]), extra=x.int(1,4)*100, T=a*1000+extra, per; while(T%n){ extra+=50; T=a*1000+extra; if(extra>900){ extra=0; T=a*1000; } }
  per=T/n; return num("一桶果汁有 "+lm(a,extra)+"，平均分裝到 "+n+" 個瓶子，每個瓶子裝幾毫升？",per,"先把公升換成毫升，再平分。",[lm(a,extra)+"＝"+T+" 毫升",T+"÷"+n+"＝"+per+" 毫升"]); },
f_cake:function(x){ var d=x.int(4,8), q=x.int(3,8), r=x.int(1,d-1), n=d*q+r, p=x.pick([30,40,50,60]), nm=x.pick(["小蛋糕","泡芙","餅乾","布丁"]);
  return num("學校有 "+n+" 個"+nm+"，每 "+d+" 個裝成一盒，剩下的也要裝一盒。每盒要 "+p+" 元，一共要花多少元？",(q+1)*p,"先算要幾盒，再乘單價。",[n+"÷"+d+"＝"+q+" … "+r+"，要 "+(q+1)+" 盒",(q+1)+"×"+p+"＝"+((q+1)*p)+" 元"]); },
f_three:function(x){ var c=x.int(15,60), k=x.int(2,5), d=x.int(10,80), a=x.pick(NAMES);
  return num("弟弟有 "+c+" 張卡片，哥哥的卡片是弟弟的 "+k+" 倍，姊姊比哥哥多 "+d+" 張。三個人一共有幾張卡片？",c+c*k+c*k+d,"先算哥哥，再算姊姊，最後三個人加起來。",["哥哥："+c+"×"+k+"＝"+(c*k),"姊姊："+(c*k)+"＋"+d+"＝"+(c*k+d),c+"＋"+(c*k)+"＋"+(c*k+d)+"＝"+(c+c*k+c*k+d)]); },
f_store:function(x){ var a=x.int(3000,6500), d=x.int(5,9), q=x.int(10,40), b=x.int(200,900);
  return num("倉庫原有 "+a+" 瓶水，賣出 "+d+" 箱，每箱 "+q+" 瓶，後來又進貨 "+b+" 瓶。現在倉庫有幾瓶水？",a-d*q+b,"先算賣出多少瓶，再減再加。",[d+"×"+q+"＝"+(d*q)+" 瓶",a+"−"+(d*q)+"＝"+(a-d*q),(a-d*q)+"＋"+b+"＝"+(a-d*q+b)+" 瓶"]); },
f_ribbon:function(x){ var c=x.int(2,9), m=x.int(0,9), n=x.int(3,8), cut=x.int(2,4), len=c*10+m;
  return num("一條緞帶長 "+(len*n)+" 毫米，剪成 "+n+" 段一樣長，每段長多少毫米？",len,"平分用除法。",[(len*n)+" ÷ "+n+" ＝ "+len+" 毫米"]); },
f_area_cost:function(x){ var a=x.int(4,12), b=x.int(3,9), p=x.int(2,9), who=x.pick(["小花園","菜圃","花圃"]);
  return num("一個長 "+a+" 公尺、寬 "+b+" 公尺的長方形"+who+"，每 1 平方公尺要鋪 "+p+" 塊草皮，一共要鋪幾塊草皮？",a*b*p,"先算面積，再乘每平方公尺的塊數。",[a+"×"+b+"＝"+(a*b)+" 平方公尺",(a*b)+"×"+p+"＝"+(a*b*p)+" 塊"]); },
f_money:function(x){ var w=x.int(50,200), k=x.int(4,9), spend=x.int(1,3)*100, who=x.pick(NAMES);
  var tot=w*k; if(spend>=tot) spend=50;
  return num(who+"每週存 "+w+" 元，存了 "+k+" 週，買了一本 "+spend+" 元的故事書，還剩多少元？",tot-spend,"先算存了多少，再減掉花掉的。",[w+"×"+k+"＝"+tot+" 元",tot+"−"+spend+"＝"+(tot-spend)+" 元"]); }
};
Object.keys(g).forEach(function(k){ G[k]=g[k]; });
U.m5=U.m5.concat(["m5_clockright","m5_cmp","m5_cut","m5_poly"]);
U.m6=["m6_unit","m6_rect","m6_square","m6_findside","m6_cmp","m6_L","m6_wall","m6_remain"];
U.m7=["m7_share","m7_group","m7_rem","m7_pack","m7_need","m7_check","m7_fact","m7_twostep","m7_cmp","m7_remrule"];
U.m8=["m8_toml","m8_tol","m8_add","m8_sub","m8_cmp","m8_pour","m8_unit","m8_share","m8_bottle","m8_more"];
U.m9=["m9_read","m9_count","m9_unit","m9_cmp","m9_order","m9_diff","m9_left","m9_numline","m9_meter","m9_between","m9_two","m9_whole"];
// 期末衝刺
U.fm1=["m5_clock","m5_right","m5_cmp","m6_rect","m6_square","m6_findside","m6_L","m6_cmp","m7_share","m7_rem","m7_need","m7_twostep","m7_check","m8_toml","m8_sub","m8_pour","m8_share","m9_read","m9_cmp","m9_diff","m9_meter","m9_two"];
U.fm2=["f_trip","f_shop","f_tile","f_juice","f_cake","f_three","f_store","f_ribbon","f_area_cost","f_money","m2_twostep","m4_save","m4_compare_mul","m6_wall","m6_remain","m7_twostep","m8_more","m8_pour","m9_two"];
U.fm3=["m1_compose","m1_money","m2_twostep","m2_compare","m3_join","m3_cut","m4_word","m4_change","m4_threestep","m5_clock","m6_rect","m6_L","m7_share","m7_need","m7_rem","m8_toml","m8_sub","m9_read","m9_cmp","m9_diff","f_shop","f_store"];
})();
