// 奧數計算紙自動存到 Google Drive（經 Apps Script 網頁應用程式）。
// 離線先排進 p5zr_scratch_outbox，連線後自動補送，不阻擋畫面。
// PRACTICE_SCRATCH.URL 已填入佩如部署的 Apps Script 網頁應用程式（/exec）。
(function(root){
  var api = {};
  api.TOKEN = "zr-oly-sp-p5-2026";
  api.URL = "https://script.google.com/macros/s/AKfycbzsvJ9ZDpkulvsidDgYfB6fhvm_eZgLA_zi6FMeNetuR6FcW67ddzUxMsmanKqPXck/exec";
  api.KEY = "p5zr_scratch_outbox";
  api.MAX = 8;
  api.FOLDER_ID = "1cFs0MXk2o8SyKOMzqlFjV32i5bDxIi_K";

  var GID_LABEL = {
    oly_digit: "隨機-數謎",
    oly_chicken: "隨機-雞兔同籠",
    oly_tree: "隨機-植樹",
    oly_age: "隨機-年齡",
    oly_seq: "隨機-規律",
    oly_divisors: "隨機-因數"
  };

  function pad(n){ return String(n).padStart(2, "0"); }

  api.taiwanStamp = function(d){
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "_" + pad(d.getHours()) + pad(d.getMinutes());
  };

  api.srcLabel = function(q, unitName){
    var src = q && q.src ? String(q.src) : "";
    var m = src.match(/(\d{4})\s*[-_]?#?\s*(\d+[A-Za-z]?)/);
    if(m) return m[1] + "-第" + m[2] + "題";
    if(src) return api.safeSegment(src);
    var gid = q && q.gid;
    if(gid && GID_LABEL[gid]) return GID_LABEL[gid];
    if(q && q.topic) return "隨機-" + api.safeSegment(q.topic);
    if(unitName) return "隨機-" + api.safeSegment(String(unitName).replace(/[🎲🎯🔢📐📝🎶]/g, "").trim()).slice(0, 16);
    return "隨機-練習";
  };

  api.safeSegment = function(s){
    return String(s == null ? "" : s)
      .replace(/[\\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "題";
  };

  api.filename = function(q, unitName, d){
    return api.taiwanStamp(d) + "_奧數_" + api.srcLabel(q, unitName) + ".png";
  };

  api.sanitizeName = function(name){
    var n = String(name == null ? "" : name).replace(/[\\\/:*?"<>|]+/g, "_").trim();
    if(!n) n = "scratch.png";
    if(!/\.png$/i.test(n)) n += ".png";
    return n;
  };

  api.isOlympiad = function(g, round){
    if(g && g.s && (g.s.id === "olympiad" || /奧林匹克/.test(g.s.name || ""))) return true;
    if(round && /奧林匹克/.test(round.sname || "")) return true;
    return false;
  };

  api.isBlankImageData = function(data, step){
    if(!data || !data.length) return true;
    step = step || 16;
    var i, stride = step * 4;
    for(i = 3; i < data.length; i += stride){
      if(data[i] > 8) return false;
    }
    // also scan a few extra offsets so a thin stroke is not missed
    for(i = 7; i < data.length; i += stride){
      if(data[i] > 8) return false;
    }
    return true;
  };

  api.pixelsHaveInk = function(ctx, w, h){
    if(!ctx || !w || !h) return false;
    try{
      var img = ctx.getImageData(0, 0, w, h);
      return !api.isBlankImageData(img.data, 12);
    }catch(e){
      return true;
    }
  };

  api.wrapLines = function(ctx, text, maxWidth){
    text = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if(!text) return [];
    var lines = [], line = "", i, ch, test;
    for(i = 0; i < text.length; i++){
      ch = text.charAt(i);
      test = line + ch;
      if(line && ctx.measureText(test).width > maxWidth){
        lines.push(line);
        line = ch;
      } else line = test;
    }
    if(line) lines.push(line);
    return lines;
  };

  function loadFig(figHtml){
    return new Promise(function(resolve){
      if(!figHtml || typeof Image === "undefined") return resolve(null);
      var html = String(figHtml).trim();
      if(!html) return resolve(null);
      var img = new Image();
      var done = false;
      function finish(v){ if(done) return; done = true; try{ if(url && url.indexOf("blob:") === 0) URL.revokeObjectURL(url); }catch(_){} resolve(v); }
      img.onload = function(){ finish(img); };
      img.onerror = function(){ finish(null); };
      var url = "";
      var srcM = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if(srcM){ img.src = srcM[1]; return; }
      if(/<svg/i.test(html)){
        if(!/\sxmlns=/.test(html)) html = html.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
        try{
          url = URL.createObjectURL(new Blob([html], { type: "image/svg+xml;charset=utf-8" }));
          img.src = url;
          return;
        }catch(e){ finish(null); return; }
      }
      finish(null);
    });
  }

  api.composeSync = function(opts){
    opts = opts || {};
    var W = Math.max(720, Math.min(1100, (opts.width || 900) | 0));
    var padX = 28, maxText = W - padX * 2;
    var canvas = (opts.canvas) || (typeof document !== "undefined" ? document.createElement("canvas") : null);
    if(!canvas) throw new Error("no canvas");
    var ctx = canvas.getContext("2d");
    var fontStack = '"Zen Maru Gothic","M PLUS Rounded 1c","Noto Sans CJK TC","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
    ctx.font = "18px " + fontStack;

    var qText = (opts.question || (opts.q && opts.q.q) || "").trim();
    var her = opts.herAnswer == null ? "" : String(opts.herAnswer);
    var ans = opts.answer == null ? "" : String(opts.answer);
    var ok = !!opts.correct;
    var unitName = opts.unitName || "";
    var stamp = opts.stamp || api.taiwanStamp(opts.now);
    var figImg = opts.figImage || null;

    var qLines = [];
    ctx.font = "20px " + fontStack;
    qLines = api.wrapLines(ctx, qText, maxText);
    if(qLines.length > 12) qLines = qLines.slice(0, 12).concat(["……"]);

    var figH = 0, figW = 0;
    if(figImg && figImg.width && figImg.height){
      figW = Math.min(maxText, figImg.width);
      figH = Math.round(figImg.height * (figW / figImg.width));
      if(figH > 280){ figH = 280; figW = Math.round(figImg.width * (figH / figImg.height)); }
    }

    var ink = opts.ink || null;
    var inkW = 0, inkH = 0;
    if(ink && (ink.width || ink.height)){
      inkW = ink.width;
      inkH = ink.height;
      // If the ink canvas is device-pixel sized, prefer CSS size when given
      if(opts.inkCssWidth && opts.inkCssHeight){
        inkW = opts.inkCssWidth;
        inkH = opts.inkCssHeight;
      }
    }
    var drawInkW = ink ? Math.min(maxText, inkW || maxText) : 0;
    var drawInkH = ink && inkW ? Math.round((inkH || 240) * (drawInkW / (inkW || drawInkW))) : 0;
    if(drawInkH > 900){ drawInkH = 900; drawInkW = inkW ? Math.round(inkW * (drawInkH / inkH)) : drawInkW; }
    if(!ink) { drawInkW = maxText; drawInkH = 80; }

    var y = 0;
    y += 28;
    y += 28; // title
    y += 26; // meta
    y += 18; // 題目 heading
    y += qLines.length * 30;
    if(figH) y += 12 + figH;
    y += 18; // gap
    y += 44; // result card
    y += 28; // 她的答案
    if(!ok) y += 28; // 正確答案
    y += 22; // divider + 計算紙 label
    y += 12 + drawInkH;
    y += 24;

    var H = Math.max(420, y);
    canvas.width = W;
    canvas.height = H;

    // background
    ctx.fillStyle = "#fbf6ee";
    ctx.fillRect(0, 0, W, H);
    // header card
    roundRect(ctx, 16, 16, W - 32, H - 32, 20);
    ctx.fillStyle = "#fffef9";
    ctx.fill();
    ctx.strokeStyle = "#f0e0c8";
    ctx.lineWidth = 2;
    ctx.stroke();

    var x = padX + 4;
    y = 40;
    ctx.fillStyle = "#5a4a62";
    ctx.font = "700 22px " + fontStack;
    ctx.fillText("芷媃的奧數計算紙", x, y);
    y += 28;
    ctx.font = "15px " + fontStack;
    ctx.fillStyle = "#8a7a8a";
    var meta = stamp.replace("_", " ") + (unitName ? "  ·  " + String(unitName).replace(/\s+/g, " ") : "");
    ctx.fillText(meta, x, y);
    y += 26;

    ctx.font = "700 15px " + fontStack;
    ctx.fillStyle = "#c08940";
    ctx.fillText("題目", x, y);
    y += 26;
    ctx.font = "20px " + fontStack;
    ctx.fillStyle = "#3a3040";
    qLines.forEach(function(line){ ctx.fillText(line, x, y); y += 30; });

    if(figImg && figH){
      y += 4;
      try{ ctx.drawImage(figImg, x, y, figW, figH); }catch(e){}
      y += figH + 8;
    }

    y += 10;
    var pillW = 88, pillH = 32;
    ctx.save();
    if(ok){ ctx.fillStyle = "#d8f3e4"; ctx.strokeStyle = "#8ec9a8"; }
    else { ctx.fillStyle = "#dceaf8"; ctx.strokeStyle = "#9bb8d4"; }
    roundRect(ctx, x, y, pillW, pillH, 16);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = ok ? "#2d6a4f" : "#3d5a80";
    ctx.font = "700 16px " + fontStack;
    ctx.textAlign = "center";
    ctx.fillText(ok ? "答對" : "答錯", x + pillW / 2, y + 22);
    ctx.restore();
    y += pillH + 24;

    ctx.textAlign = "left";
    ctx.font = "18px " + fontStack;
    ctx.fillStyle = "#3a3040";
    ctx.fillText("她的答案：" + (her || "（未作答）"), x, y);
    y += 28;
    if(!ok){
      ctx.fillText("正確答案：" + (ans || ""), x, y);
      y += 28;
    }

    y += 6;
    ctx.strokeStyle = "#ead9c4";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(W - padX, y); ctx.stroke();
    y += 22;
    ctx.font = "700 15px " + fontStack;
    ctx.fillStyle = "#c08940";
    ctx.fillText("計算紙", x, y);
    y += 12;

    var inkX = x, inkY = y, boxW = maxText, boxH = drawInkH;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#e8d5bc";
    roundRect(ctx, inkX, inkY, boxW, boxH, 12);
    ctx.fill(); ctx.stroke();
    // dotted grid like the on-screen pad
    ctx.beginPath();
    ctx.strokeStyle = "rgba(180,160,140,0.28)";
    ctx.lineWidth = 1;
    var g;
    for(g = 24; g < boxW; g += 24){ ctx.moveTo(inkX + g, inkY); ctx.lineTo(inkX + g, inkY + boxH); }
    for(g = 24; g < boxH; g += 24){ ctx.moveTo(inkX, inkY + g); ctx.lineTo(inkX + boxW, inkY + g); }
    ctx.stroke();
    if(ink){
      var dw = Math.min(boxW, drawInkW), dh = drawInkH;
      var ox = inkX + Math.round((boxW - dw) / 2);
      try{ ctx.drawImage(ink, ox, inkY, dw, dh); }catch(e){}
    }
    ctx.restore();

    return {
      canvas: canvas,
      dataUrl: canvas.toDataURL("image/png"),
      width: W,
      height: H,
      included: {
        question: qLines.length > 0,
        answer: true,
        result: true,
        fig: !!(figImg && figH)
      }
    };
  };

  function roundRect(ctx, x, y, w, h, r){
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  api.compose = function(opts){
    opts = opts || {};
    var figHtml = opts.fig || (opts.q && opts.q.fig) || "";
    if(opts.figImage || !figHtml){
      return Promise.resolve(api.composeSync(opts));
    }
    return loadFig(figHtml).then(function(img){
      opts.figImage = img;
      return api.composeSync(opts);
    });
  };

  // ----- outbox (mirrors p5zr_outbox) -----
  var box = null, flushChain = Promise.resolve();

  function loadBox(){
    if(box) return box;
    try{
      var raw = root.localStorage ? localStorage.getItem(api.KEY) : null;
      var q = raw ? JSON.parse(raw) : [];
      box = Array.isArray(q) ? q : [];
    }catch(e){ box = []; }
    return box;
  }
  function persist(){
    var q = loadBox();
    while(q.length){
      try{
        if(root.localStorage) localStorage.setItem(api.KEY, JSON.stringify(q));
        return true;
      }catch(e){ q.shift(); }
    }
    try{ if(root.localStorage) localStorage.removeItem(api.KEY); }catch(_){}
    return false;
  }

  function postItem(item){
    if(!api.URL) return Promise.resolve(false);
    if(typeof fetch !== "function") return Promise.reject(new Error("no fetch"));
    return fetch(api.URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: api.TOKEN,
        filename: api.sanitizeName(item.filename),
        image: item.image
      })
    });
  }

  function drain(){
    var q = loadBox();
    if(!q.length) return Promise.resolve(true);
    if(!api.URL) return Promise.resolve(false);
    var item = q[0];
    return postItem(item).then(function(){
      var i = -1;
      loadBox().forEach(function(x, idx){ if(x.id === item.id) i = idx; });
      if(i >= 0) loadBox().splice(i, 1);
      persist();
      return drain();
    }, function(){ return false; });
  }

  api.flush = function(){
    var run = flushChain.then(drain, drain);
    flushChain = run.then(function(){}, function(){});
    return run;
  };

  api.enqueue = function(filename, image){
    if(!api.URL) return Promise.resolve(false);
    var item = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2),
      filename: api.sanitizeName(filename),
      image: image
    };
    var q = loadBox();
    q.push(item);
    if(q.length > api.MAX) box = q.slice(q.length - api.MAX);
    persist();
    var id = item.id;
    return api.flush().then(function(){
      return loadBox().every(function(x){ return x.id !== id; });
    });
  };

  api.queueComposed = function(payload){
    var filename = api.filename(payload.q || {}, payload.unitName, payload.now);
    return api.compose(payload).then(function(res){
      if(!res || !res.dataUrl) return false;
      return api.enqueue(filename, res.dataUrl);
    }).catch(function(){ return false; });
  };

  api.boot = function(){
    try{
      if(root.addEventListener){
        root.addEventListener("online", function(){ api.flush(); });
      }
      api.flush();
    }catch(e){}
  };

  root.PRACTICE_SCRATCH = api;
  if(typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this));
