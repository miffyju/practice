// Node tests: filename, sanitize, blank-canvas skip, olympiad gate. No browser needed.
var assert = require("assert");
var S = require("./scratch-save.js");

function pass(name){ console.log("ok  " + name); }

// filename format (Taiwan stamp, example in the brief)
var d = new Date(2026, 10, 11, 14, 32, 0); // month is 0-indexed; 11 Nov 2026 14:32
assert.strictEqual(S.taiwanStamp(d), "2026-11-11_1432");
var q = { src: "APMOPS2023-#12", q: "示範題", answer: "42" };
assert.strictEqual(S.filename(q, "2023 亞太區小奧臺灣區初賽", d), "2026-11-11_1432_奧數_2023-第12題.png");
pass("filename matches 2026-11-11_1432_奧數_2023-第12題.png");

assert.strictEqual(S.srcLabel({ src: "APMOPS2020-#1" }), "2020-第1題");
assert.strictEqual(S.srcLabel({ src: "APMOPS2027-#26" }), "2027-第26題");
assert.strictEqual(S.srcLabel({ gid: "oly_chicken" }), "隨機-雞兔同籠");
assert.strictEqual(S.srcLabel({ gid: "oly_digit" }), "隨機-數謎");
assert.strictEqual(S.srcLabel({}), "隨機-練習");
pass("srcLabel for bank years and generators");

assert.strictEqual(S.sanitizeName('2026-11-11_1432_奧數_2023-第12題.png'), "2026-11-11_1432_奧數_2023-第12題.png");
assert.ok(/\.png$/i.test(S.sanitizeName("a/b:c")));
assert.strictEqual(S.sanitizeName("foo/bar.png"), "foo_bar.png");
pass("sanitizeName strips path characters");

// blank canvas skip
var blank = new Uint8ClampedArray(40 * 20 * 4); // all zeros
assert.strictEqual(S.isBlankImageData(blank, 4), true);
var ink = new Uint8ClampedArray(40 * 20 * 4);
ink[3 + 12 * 4] = 200; // some alpha
assert.strictEqual(S.isBlankImageData(ink, 4), false);
pass("isBlankImageData skips empty, keeps ink");

// enqueue skipped when URL empty (must not fill localStorage)
var fakeStore = {};
global.localStorage = {
  getItem: function(k){ return fakeStore[k] == null ? null : fakeStore[k]; },
  setItem: function(k,v){ fakeStore[k]=v; },
  removeItem: function(k){ delete fakeStore[k]; }
};
S.URL = "";
return Promise.resolve(S.enqueue("x.png", "data:image/png;base64,AAA")).then(function(ok){
  assert.strictEqual(ok, false);
  assert.strictEqual(fakeStore[S.KEY], undefined);
  pass("enqueue is a no-op when URL is empty");

  assert.strictEqual(S.isOlympiad({ s: { id: "olympiad", name: "奧林匹克數學" } }), true);
  assert.strictEqual(S.isOlympiad({ s: { id: "math", name: "數學" } }, { sname: "數學" }), false);
  assert.strictEqual(S.isOlympiad({ s: { id: "math" } }, { sname: "奧林匹克數學" }), true);
  pass("isOlympiad only for 奧數 mode / subject");

  console.log("\nAll node scratch-save tests passed.");
}).catch(function(e){
  console.error(e);
  process.exit(1);
});
