// 題庫：type "mc" 選擇題（answer 必須是 options 之一），"num" 數字題（用數字鍵盤作答），"text" 打字題
// check：驗證用算式（node validate.js 會重新計算）；passage：題目上方顯示的短文（可放在題目或單元）
// 題目依五上考卷的題型與考點改寫，不是出版社原題。科目顏色同紫嫈網站。
// 2026-11-10：移除期中考單元選單，改依期末範圍（115 上二次段考：約 2027/1/12–13）分科、分課／單元。
// 舊期中／舊單元題庫見 archive.js，只給錯題本舊資料查題。
(function(){
var C={chinese:"#7ec8a9", math:"#ff9f68", science:"#6cc070", social:"#f2b84b", english:"#b48ee0"};
function U(id,name,color,qs,extra){
  var o={id:id,name:name,color:color,questions:qs||[]};
  if(extra) for(var k in extra) o[k]=extra[k];
  return o;
}

// ===== 英文：數字 0–100 拼寫（程式產生，validate.js 會另外核對拼字）=====
var ONES=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
var TENS=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
function numWord(n){ if(n===100) return "one hundred"; if(n<20) return ONES[n]; return TENS[Math.floor(n/10)]+(n%10?"-"+ONES[n%10]:""); }
var HARD=[12,13,15,18,20,40,50,80,90,100];
var TIPS={12:"twelve 不是 twoteen 喔！",13:"thirteen：thir 開頭，不是 threeteen。",15:"fifteen：fif 開頭，不是 fiveteen。",18:"eighteen：eigh + teen，只有一個 t。",20:"twenty：tw + enty。",40:"forty 沒有 u！four 有 u，forty 沒有。",50:"fifty：fif 開頭，不是 fivety。",80:"eighty：eigh + ty，只有一個 t。",90:"ninety：nine 的 e 要留著。",100:"one hundred（也可以說 a hundred）。"};
var en_num=[];
for(var n=0;n<=100;n++){ (function(n){ var w=numWord(n), t=Math.floor(n/10), o=n%10;
  var ex = n<20 ? [n+" = "+w] : n===100 ? ["100 = one hundred（或 a hundred）"] : o===0 ? [n+" = "+w,"整十的字尾是 -ty"] : [n+" = "+TENS[t]+"（"+t*10+"）+ "+ONES[o]+"（"+o+"）","中間用連字號：「"+w+"」"];
  if(TIPS[n]) ex.push("⚠ "+TIPS[n]);
  en_num.push({type:"text", n:n, q:"把數字寫成英文："+n, answer:w, accept:n===100?["a hundred"]:[], say:w, sayAfter:true, weight:HARD.indexOf(n)>=0?6:(n>20&&o!==0?1:2),
   hint: n>20&&n<100&&o!==0 ? "先寫 "+t*10+" 的英文，再用「-」接上 "+o+" 的英文。" : (TIPS[n]||"想想 "+n+" 怎麼念。"), explain:ex});
})(n); }
en_num.push(
 {type:"mc", q:"forty-five 是多少？", say:"forty-five", options:["45","54","40","15"], answer:"45", weight:3, hint:"forty 是 40，five 是 5。", explain:["forty-five = 40 + 5 = 45"]},
 {type:"mc", q:"eighty-three 是多少？", say:"eighty-three", options:["83","38","18","80"], answer:"83", weight:3, hint:"eighty 是 80。", explain:["eighty-three = 80 + 3 = 83"]},
 {type:"mc", q:"fifteen 和 fifty，哪一個是 50？", say:"fifteen, fifty", options:["fifty","fifteen"], answer:"fifty", weight:3, hint:"-teen 是十幾，-ty 是幾十。", explain:["fifteen = 15（-teen）","fifty = 50（-ty）"]},
 {type:"mc", q:"thirteen 是多少？", say:"thirteen", options:["13","30","3","31"], answer:"13", weight:3, hint:"-teen 是十幾。", explain:["thirteen = 13，thirty = 30"]},
 {type:"mc", q:"選出拼法正確的「40」：", options:["forty","fourty","fourteen","forti"], answer:"forty", weight:3, hint:"four 有 u，但 40 沒有。", explain:["40 = forty（沒有 u）","fourteen 是 14"]},
 {type:"mc", q:"選出拼法正確的「12」：", options:["twelve","twelf","twoteen","tweleve"], answer:"twelve", weight:3, hint:"tw-e-l-v-e。", explain:["12 = twelve"]},
 {type:"mc", q:"選出拼法正確的「90」：", options:["ninety","ninty","ninity","nineteen"], answer:"ninety", weight:3, hint:"nine 的 e 要留著。", explain:["90 = ninety","nineteen 是 19"]},
 {type:"mc", q:"選出拼法正確的「18」：", options:["eighteen","eightteen","eighten","aiteen"], answer:"eighteen", weight:3, hint:"eight 的 t 和 teen 的 t 合成一個。", explain:["18 = eighteen（只有一個 t）"]}
);

window.PRACTICE_DATA = { subjects: [
  { id:"exam", name:"期末衝刺", icon:"📝", color:"#ff6b81", featured:true, units:[
    U("zf_mix","🎯 跨科綜合（國語・數學・英文・自然・社會）","#ff6b81",[],{round:10}),
    U("zf_ch","📖 國語期末綜合（第7～12課）",C.chinese),
    U("zf_en","🔤 英文期末綜合（Unit 3～4・新年）",C.english),
    U("zf_en12","🔤 Unit 1–2 單字複習（期中基礎，期末可能會再用到）",C.english),
    U("zf_sc","🔬 自然期末綜合（水溶液・力與運動）",C.science),
    U("zf_so","🏫 社會期末綜合（第三・四單元）",C.social),
    U("zf_gift","⭐ 資優跨科挑戰","#c45c7a",[],{round:8})
  ]},
  { id:"chinese", name:"國語", icon:"📖", color:C.chinese, units:[
    U("c7","第七課 為生命找出口",C.chinese),
    U("c8","第八課 最勇敢的女孩",C.chinese),
    U("c9","第九課 在挫折中成長",C.chinese),
    U("c10","第十課 山中寄情",C.chinese),
    U("c11","第十一課 與達駭黑熊走入山林",C.chinese),
    U("c12","第十二課 荒島上的國王",C.chinese),
    U("cR","閱讀階梯二 分享的金牌（主題閱讀練習）",C.chinese),
    U("cM","學習地圖三・四 語文綜合",C.chinese)
  ]},
  { id:"math", name:"數學", icon:"🔢", color:C.math, units:[] },
  { id:"english", name:"英文", icon:"🔤", color:C.english, units:[
    U("eU3","Unit 3 A Fun Day（星期）",C.english),
    U("eU4","Unit 4 My Favorite Subject（科目）",C.english),
    U("eCul","Culture & Festivals：Chinese New Year",C.english),
    {id:"e2", name:"🔢 數字 0–100 拼寫", color:C.english, round:16, questions:en_num}
  ]},
  { id:"science", name:"自然", icon:"🔬", color:C.science, units:[
    U("n31","單元3-1 溶解現象",C.science),
    U("n32","單元3-2 水溶液的酸鹼性",C.science),
    U("n33","單元3-3 水溶液的導電性",C.science),
    U("n41","單元4-1 力的測量",C.science),
    U("n42","單元4-2 摩擦力",C.science),
    U("n43","單元4-3 運動狀態的快慢",C.science)
  ]},
  { id:"social", name:"社會", icon:"🏫", color:C.social, units:[
    U("s31","三、1 早期移民如何在臺灣建立家園？",C.social),
    U("s32","三、2 開港通商為什麼改變了臺灣的發展？",C.social),
    U("s41","四、1 人們如何適應不同地形創造所需？",C.social),
    U("s42","四、2 沿海的利用為什麼呈現多元發展？",C.social),
    U("s43","四、3 土地開發與環境保護該如何抉擇？",C.social)
  ]}
]};
})();
