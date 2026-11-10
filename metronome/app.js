(function () {
  "use strict";

  var STORAGE = "metro_";
  var MIN_BPM = 30;
  var MAX_BPM = 240;
  var DEFAULT_BPM = 80;
  var DEFAULT_SIG = "4/4";
  var DEFAULT_MINS = 10;
  var DEFAULT_SOUND = "beep";
  var SOUNDS = { beep: 1, wood: 1, tick: 1, chirp: 1 };
  var BEATS = { "2/4": 2, "3/4": 3, "4/4": 4, "6/8": 6 };
  var LOOKAHEAD_MS = 25;
  var SCHEDULE_AHEAD = 0.1;

  var bpm = DEFAULT_BPM;
  var sig = DEFAULT_SIG;
  var mins = DEFAULT_MINS;
  var sound = DEFAULT_SOUND;
  var customOpen = false;

  var ctx = null;
  var metroOn = false;
  var currentBeat = 0;
  var nextNoteTime = 0;
  var schedTimer = 0;
  var visualTimers = [];

  var durationMs = DEFAULT_MINS * 60 * 1000;
  var remainingMs = durationMs;
  var timerOn = false;
  var lastTick = 0;
  var rafId = 0;

  var $ = function (id) { return document.getElementById(id); };
  var bpmInput = $("bpmInput");
  var beatsEl = $("beats");
  var sigHint = $("sigHint");
  var progressEl = $("progress");
  var remainEl = $("remain");
  var startBtn = $("startBtn");
  var metroOnlyBtn = $("metroOnlyBtn");
  var timerPauseBtn = $("timerPauseBtn");
  var customRow = $("customRow");
  var customMin = $("customMin");
  var doneEl = $("done");
  var toastEl = $("toast");
  var toastT = 0;

  function clampBpm(n) {
    n = Math.round(Number(n));
    if (!isFinite(n)) return DEFAULT_BPM;
    if (n < MIN_BPM) return MIN_BPM;
    if (n > MAX_BPM) return MAX_BPM;
    return n;
  }

  function clampMins(n) {
    n = Math.round(Number(n));
    if (!isFinite(n) || n < 1) return 0;
    if (n > 120) return 120;
    return n;
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function fmtTime(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    return pad(m) + ":" + pad(s % 60);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE + "bpm", String(bpm));
      localStorage.setItem(STORAGE + "sig", sig);
      localStorage.setItem(STORAGE + "mins", String(mins));
      localStorage.setItem(STORAGE + "sound", sound);
    } catch (e) { /* ignore */ }
  }

  function load() {
    try {
      var b = parseInt(localStorage.getItem(STORAGE + "bpm"), 10);
      if (b >= MIN_BPM && b <= MAX_BPM) bpm = b;
      var s = localStorage.getItem(STORAGE + "sig");
      if (BEATS[s]) sig = s;
      var m = parseInt(localStorage.getItem(STORAGE + "mins"), 10);
      if (m >= 1 && m <= 120) mins = m;
      var so = localStorage.getItem(STORAGE + "sound");
      if (SOUNDS[so]) sound = so;
    } catch (e) { /* ignore */ }
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  function beatsInBar() { return BEATS[sig] || 4; }

  function renderBeats() {
    var n = beatsInBar();
    var html = "";
    for (var i = 0; i < n; i++) {
      var cls = "beat";
      if (i === 0) cls += " accent";
      else if (sig === "6/8" && i === 3) cls += " sub";
      html += '<span class="' + cls + '" data-i="' + i + '"></span>';
    }
    beatsEl.innerHTML = html;
  }

  function setActiveBeat(i) {
    var dots = beatsEl.querySelectorAll(".beat");
    for (var k = 0; k < dots.length; k++) {
      if (k === i) dots[k].classList.add("on");
      else dots[k].classList.remove("on");
    }
  }

  function clearActiveBeat() {
    var dots = beatsEl.querySelectorAll(".beat");
    for (var k = 0; k < dots.length; k++) dots[k].classList.remove("on");
  }

  function syncBpmUi() {
    bpmInput.value = String(bpm);
  }

  function syncSigUi() {
    var chips = document.querySelectorAll("#sigBtns .chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle("on", chips[i].getAttribute("data-sig") === sig);
    }
    sigHint.hidden = sig !== "6/8";
    renderBeats();
  }

  function syncSoundUi() {
    var chips = document.querySelectorAll("#soundBtns .chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle("on", chips[i].getAttribute("data-sound") === sound);
    }
  }

  function isPresetMin(m) {
    return m === 5 || m === 10 || m === 15 || m === 20 || m === 30;
  }

  function syncMinUi() {
    var chips = document.querySelectorAll("#minBtns .chip");
    for (var i = 0; i < chips.length; i++) {
      var v = chips[i].getAttribute("data-min");
      var on = v === "custom" ? !isPresetMin(mins) : parseInt(v, 10) === mins;
      chips[i].classList.toggle("on", on);
    }
    if (!isPresetMin(mins)) customMin.value = String(mins);
  }

  function setProgress(p) {
    if (p < 0) p = 0;
    if (p > 1) p = 1;
    progressEl.style.setProperty("--p", (p * 100) + "%");
  }

  function syncTimerUi() {
    remainEl.textContent = fmtTime(remainingMs);
    var p = durationMs > 0 ? (durationMs - remainingMs) / durationMs : 0;
    setProgress(p);
    progressEl.classList.toggle("walking", timerOn);
    timerPauseBtn.textContent = timerOn ? "暫停時間" : (remainingMs < durationMs && remainingMs > 0 ? "繼續計時" : "暫停時間");
    timerPauseBtn.disabled = !timerOn && (remainingMs <= 0 || remainingMs >= durationMs);
  }

  function syncStartUi() {
    var practicing = metroOn || timerOn;
    startBtn.textContent = practicing ? "暫停" : "開始練習";
    startBtn.setAttribute("aria-pressed", practicing ? "true" : "false");
    metroOnlyBtn.textContent = metroOn ? "停節拍器" : "只開節拍器";
  }

  /* ---------- Web Audio ---------- */
  function unlockAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function envGain(audioCtx, time, peak, dur) {
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(Math.max(0.0001, peak), time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    gain.connect(audioCtx.destination);
    return gain;
  }

  function playToneOn(audioCtx, time, freq, vol, dur, type) {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    osc.type = type || "triangle";
    osc.frequency.setValueAtTime(freq, time);
    osc.connect(envGain(audioCtx, time, vol, dur));
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  /* 完成音效用既有嗶聲（三角形），不受音效選擇影響 */
  function playTone(time, freq, vol, dur) {
    playToneOn(ctx, time, freq, vol, dur, "triangle");
  }

  function fillNoise(data, seed) {
    var s = seed || 1;
    for (var i = 0; i < data.length; i++) {
      s = (s * 16807) % 2147483647;
      data[i] = (s / 2147483647) * 2 - 1;
    }
  }

  function playNoiseBurst(audioCtx, time, freq, q, vol, dur, seed) {
    var len = Math.max(1, Math.floor(audioCtx.sampleRate * (dur + 0.02)));
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    fillNoise(buf.getChannelData(0), seed);
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var bp = audioCtx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(freq, time);
    bp.Q.setValueAtTime(q, time);
    var gain = envGain(audioCtx, time, vol, dur);
    src.connect(bp);
    bp.connect(gain);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  function playBeep(audioCtx, time, kind) {
    if (kind === "accent") playToneOn(audioCtx, time, 1320, 0.32, 0.09, "triangle");
    else if (kind === "sub") playToneOn(audioCtx, time, 880, 0.22, 0.07, "triangle");
    else playToneOn(audioCtx, time, 587, 0.12, 0.055, "triangle");
  }

  /* 木魚／木塊：帶通濾波噪音 + 短正弦撞擊衰減 */
  function playWood(audioCtx, time, kind) {
    var freq, sineF, nVol, sVol, dur, q, seed;
    if (kind === "accent") { freq = 1750; sineF = 980; nVol = 0.55; sVol = 0.28; dur = 0.085; q = 7.5; seed = 11; }
    else if (kind === "sub") { freq = 1250; sineF = 740; nVol = 0.38; sVol = 0.2; dur = 0.07; q = 7; seed = 23; }
    else { freq = 880; sineF = 520; nVol = 0.28; sVol = 0.15; dur = 0.06; q = 6.5; seed = 37; }
    playNoiseBurst(audioCtx, time, freq, q, nVol, dur, seed);
    playToneOn(audioCtx, time, sineF, sVol, dur * 0.7, "sine");
  }

  /* 機械節拍器：很短的高頻 click；重音略低、較飽滿（tock） */
  function playTick(audioCtx, time, kind) {
    var hi, lo, hiVol, loVol, dur, nVol, nFreq;
    if (kind === "accent") { hi = 2100; lo = 780; hiVol = 0.22; loVol = 0.2; dur = 0.014; nVol = 0.28; nFreq = 1800; }
    else if (kind === "sub") { hi = 2600; lo = 0; hiVol = 0.16; loVol = 0; dur = 0.009; nVol = 0.18; nFreq = 2400; }
    else { hi = 3200; lo = 0; hiVol = 0.16; loVol = 0; dur = 0.007; nVol = 0.18; nFreq = 2800; }
    playToneOn(audioCtx, time, hi, hiVol, dur, "sine");
    if (lo) playToneOn(audioCtx, time, lo, loVol, dur * 1.3, "sine");
    playNoiseBurst(audioCtx, time, nFreq, 4.5, nVol, dur * 1.2, kind === "accent" ? 51 : 67);
  }

  /* 小雞啾啾：快速上滑的短正弦 chirp；重音兩聲、較高 */
  function playChirpOnce(audioCtx, time, f0, f1, vol, dur) {
    var osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f0, time);
    osc.frequency.exponentialRampToValueAtTime(f1, time + dur);
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  function playChirp(audioCtx, time, kind) {
    if (kind === "accent") {
      playChirpOnce(audioCtx, time, 1500, 2600, 0.28, 0.07);
      playChirpOnce(audioCtx, time + 0.085, 1700, 3000, 0.26, 0.07);
    } else if (kind === "sub") {
      playChirpOnce(audioCtx, time, 1300, 2100, 0.2, 0.065);
    } else {
      playChirpOnce(audioCtx, time, 980, 1680, 0.16, 0.06);
    }
  }

  function playOn(audioCtx, time, kind, soundType) {
    if (!audioCtx) return;
    var s = soundType || sound;
    if (s === "wood") playWood(audioCtx, time, kind);
    else if (s === "tick") playTick(audioCtx, time, kind);
    else if (s === "chirp") playChirp(audioCtx, time, kind);
    else playBeep(audioCtx, time, kind);
  }

  function playClick(time, kind) {
    playOn(ctx, time, kind, sound);
  }

  function previewSound(type) {
    if (!unlockAudio()) return;
    var t0 = ctx.currentTime + 0.05;
    playOn(ctx, t0, "accent", type);
    playOn(ctx, t0 + 0.38, "normal", type);
  }

  function playFanfare() {
    if (!unlockAudio()) return;
    var now = ctx.currentTime + 0.02;
    var notes = [523.25, 659.25, 783.99, 1046.5];
    for (var i = 0; i < notes.length; i++) {
      playTone(now + i * 0.15, notes[i], 0.28, 0.22);
    }
  }

  function clearVisuals() {
    for (var i = 0; i < visualTimers.length; i++) clearTimeout(visualTimers[i]);
    visualTimers = [];
  }

  function scheduleVisual(beatIndex, time) {
    var delay = Math.max(0, (time - ctx.currentTime) * 1000);
    var id = setTimeout(function () { setActiveBeat(beatIndex); }, delay);
    visualTimers.push(id);
  }

  function nextNote() {
    nextNoteTime += 60 / bpm;
    currentBeat = (currentBeat + 1) % beatsInBar();
  }

  function scheduler() {
    if (!metroOn || !ctx) return;
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      var kind = "normal";
      if (currentBeat === 0) kind = "accent";
      else if (sig === "6/8" && currentBeat === 3) kind = "sub";
      playClick(nextNoteTime, kind);
      scheduleVisual(currentBeat, nextNoteTime);
      nextNote();
    }
    schedTimer = setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function startMetro() {
    if (metroOn) return;
    if (!unlockAudio()) {
      toast("這個瀏覽器不能發聲");
      return;
    }
    metroOn = true;
    currentBeat = 0;
    clearVisuals();
    nextNoteTime = ctx.currentTime + 0.06;
    scheduler();
    syncStartUi();
  }

  function stopMetro() {
    if (!metroOn) return;
    metroOn = false;
    clearTimeout(schedTimer);
    schedTimer = 0;
    clearVisuals();
    clearActiveBeat();
    syncStartUi();
  }

  /* ---------- Timer ---------- */
  function tickTimer(now) {
    if (!timerOn) return;
    var dt = now - lastTick;
    lastTick = now;
    remainingMs -= dt;
    if (remainingMs <= 0) {
      remainingMs = 0;
      timerOn = false;
      progressEl.classList.remove("walking");
      syncTimerUi();
      syncStartUi();
      onComplete();
      return;
    }
    syncTimerUi();
    rafId = requestAnimationFrame(tickTimer);
  }

  function startTimer() {
    if (timerOn) return;
    if (remainingMs <= 0) {
      remainingMs = durationMs;
    }
    hideDone();
    timerOn = true;
    lastTick = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tickTimer);
    syncTimerUi();
    syncStartUi();
  }

  function pauseTimer() {
    if (!timerOn) return;
    timerOn = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
    syncTimerUi();
    syncStartUi();
  }

  function resetTimer() {
    timerOn = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
    remainingMs = durationMs;
    hideDone();
    syncTimerUi();
    syncStartUi();
  }

  function setDuration(newMins, resetRemain) {
    mins = newMins;
    durationMs = mins * 60 * 1000;
    if (resetRemain || remainingMs > durationMs || (!timerOn && remainingMs === 0)) {
      remainingMs = durationMs;
    }
    if (!timerOn && remainingMs === durationMs) {
      /* already full */
    }
    save();
    syncMinUi();
    syncTimerUi();
  }

  function confetti() {
    var box = $("celebrate");
    box.innerHTML = "";
    var icons = ["🎵", "🎹", "⭐", "🐥", "🌼", "✨"];
    var n = 18;
    for (var i = 0; i < n; i++) {
      var sp = document.createElement("span");
      sp.textContent = icons[i % icons.length];
      sp.style.left = Math.random() * 100 + "%";
      sp.style.animationDelay = (Math.random() * 0.4) + "s";
      sp.style.fontSize = (1.4 + Math.random() * 1.2) + "rem";
      box.appendChild(sp);
    }
    setTimeout(function () { box.innerHTML = ""; }, 2200);
  }

  function onComplete() {
    stopMetro();
    playFanfare();
    doneEl.hidden = false;
    confetti();
  }

  function hideDone() {
    doneEl.hidden = true;
    $("celebrate").innerHTML = "";
  }

  /* ---------- Controls ---------- */
  function setBpm(next) {
    bpm = clampBpm(next);
    save();
    syncBpmUi();
  }

  function bindHold(el, dir) {
    var delayT = 0, repT = 0;
    function clear() {
      clearTimeout(delayT);
      clearInterval(repT);
      delayT = 0;
      repT = 0;
    }
    el.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      setBpm(bpm + dir);
      delayT = setTimeout(function () {
        repT = setInterval(function () { setBpm(bpm + dir); }, 70);
      }, 380);
    });
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointercancel", clear);
    el.addEventListener("lostpointercapture", clear);
    el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  function applyBpmInput() {
    setBpm(bpmInput.value);
  }

  bindHold($("bpmDown"), -1);
  bindHold($("bpmUp"), 1);
  bpmInput.addEventListener("change", applyBpmInput);
  bpmInput.addEventListener("blur", applyBpmInput);
  bpmInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); bpmInput.blur(); }
  });

  $("sigBtns").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-sig]");
    if (!btn) return;
    sig = btn.getAttribute("data-sig");
    currentBeat = 0;
    clearVisuals();
    clearActiveBeat();
    save();
    syncSigUi();
  });

  $("soundBtns").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-sound]");
    if (!btn) return;
    var next = btn.getAttribute("data-sound");
    if (!SOUNDS[next]) return;
    sound = next;
    save();
    syncSoundUi();
    previewSound(sound);
  });

  function pickMins(m) {
    customOpen = false;
    customRow.hidden = true;
    var wasOn = timerOn;
    if (wasOn) pauseTimer();
    setDuration(m, true);
    if (wasOn) startTimer();
  }

  $("minBtns").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-min]");
    if (!btn) return;
    var v = btn.getAttribute("data-min");
    if (v === "custom") {
      customOpen = true;
      customRow.hidden = false;
      if (!isPresetMin(mins)) customMin.value = String(mins);
      customMin.focus();
      customMin.select();
      return;
    }
    pickMins(parseInt(v, 10));
  });

  $("customRow").addEventListener("submit", function (e) {
    e.preventDefault();
    var m = clampMins(customMin.value);
    if (!m) {
      toast("請輸入 1 到 120 分鐘");
      return;
    }
    pickMins(m);
  });

  startBtn.addEventListener("click", function () {
    unlockAudio();
    if (metroOn || timerOn) {
      stopMetro();
      pauseTimer();
      return;
    }
    startMetro();
    startTimer();
  });

  metroOnlyBtn.addEventListener("click", function () {
    unlockAudio();
    if (metroOn) stopMetro();
    else startMetro();
  });

  timerPauseBtn.addEventListener("click", function () {
    if (timerOn) pauseTimer();
    else if (remainingMs > 0) startTimer();
  });

  $("timerResetBtn").addEventListener("click", function () {
    resetTimer();
  });

  $("againBtn").addEventListener("click", function () {
    hideDone();
    resetTimer();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      /* keep counting with performance.now on next frame when visible */
      if (timerOn) lastTick = performance.now();
    } else {
      if (timerOn) lastTick = performance.now();
      if (metroOn && ctx && ctx.state === "suspended") ctx.resume();
    }
  });

  /* First user gesture: try to unlock audio (iOS) */
  function gestureUnlock() {
    unlockAudio();
    document.removeEventListener("pointerdown", gestureUnlock, true);
  }
  document.addEventListener("pointerdown", gestureUnlock, true);

  /* Test hook for screenshots */
  window.__metroTest = {
    getState: function () {
      return {
        bpm: bpm,
        sig: sig,
        mins: mins,
        metroOn: metroOn,
        timerOn: timerOn,
        remainingMs: remainingMs,
        durationMs: durationMs,
        currentBeat: currentBeat,
        sound: sound
      };
    },
    setSound: function (s) {
      if (!SOUNDS[s]) return;
      sound = s;
      save();
      syncSoundUi();
    },
    previewSound: previewSound,
    renderPair: function (soundType) {
      var sr = 44100;
      var seconds = 1.15;
      var off = new OfflineAudioContext(1, Math.ceil(sr * seconds), sr);
      playOn(off, 0.08, "accent", soundType);
      playOn(off, 0.58, "normal", soundType);
      return off.startRendering();
    },
    setRemaining: function (ms) {
      remainingMs = Math.max(0, Math.min(durationMs, ms));
      syncTimerUi();
    },
    setDurationMins: function (m) {
      setDuration(m, true);
    },
    startMetro: startMetro,
    stopMetro: stopMetro,
    startTimer: startTimer,
    pauseTimer: pauseTimer,
    resetTimer: resetTimer,
    complete: function () {
      remainingMs = 0;
      timerOn = false;
      cancelAnimationFrame(rafId);
      syncTimerUi();
      syncStartUi();
      onComplete();
    },
    unlockAudio: unlockAudio
  };

  load();
  durationMs = mins * 60 * 1000;
  remainingMs = durationMs;
  syncBpmUi();
  syncSigUi();
  syncSoundUi();
  syncMinUi();
  if (!isPresetMin(mins)) {
    customMin.value = String(mins);
  }
  syncTimerUi();
  syncStartUi();
})();
