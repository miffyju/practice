#!/usr/bin/env python3
"""Compose-image tests + sample PNG for 奧數計算紙 auto-save."""
import json, os, socket, subprocess, sys, time, pathlib, base64
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
SHOT = pathlib.Path("/workspace/zhirou-style-shots")
SHOT.mkdir(parents=True, exist_ok=True)
SAMPLE = SHOT / "oly-scratch-composed.png"
SAMPLE_FIG = SHOT / "oly-scratch-composed-with-fig.png"

Q2023_12 = "現在有 10 元、20 元和 50 元的硬幣各 4 枚。用其中的一些硬幣支付 230 元，一共有多少種不同的方法？"
COIN_FIG = """
<svg width="280" height="80" viewBox="0 0 280 80" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="40" r="28" fill="#fbe9a6" stroke="#c08940" stroke-width="3"/>
  <text x="40" y="46" text-anchor="middle" font-size="16" font-family="sans-serif" fill="#5a4a62">10</text>
  <circle cx="110" cy="40" r="28" fill="#f9d6dc" stroke="#d08090" stroke-width="3"/>
  <text x="110" y="46" text-anchor="middle" font-size="16" font-family="sans-serif" fill="#5a4a62">20</text>
  <circle cx="180" cy="40" r="28" fill="#dceaf8" stroke="#7aa0c4" stroke-width="3"/>
  <text x="180" y="46" text-anchor="middle" font-size="16" font-family="sans-serif" fill="#5a4a62">50</text>
  <text x="230" y="46" font-size="16" font-family="sans-serif" fill="#8a7a8a">×4</text>
</svg>
"""

def as_utf8(s):
    if not s:
        return s
    try:
        return s.encode("cp1252").decode("utf-8")
    except Exception:
        try:
            return s.encode("latin-1").decode("utf-8")
        except Exception:
            return s


def tap_key(page, k):
    page.evaluate("""(k) => {
      const b = document.querySelector('.fillpad button[data-fk="'+k+'"]');
      const ev = {bubbles:true, cancelable:true, button:0, isPrimary:true, pointerId:1, pointerType:"touch"};
      b.dispatchEvent(new PointerEvent("pointerdown", ev));
      b.dispatchEvent(new PointerEvent("pointerup", ev));
      b.dispatchEvent(new MouseEvent("click", {bubbles:true, cancelable:true, button:0}));
    }""", k)

def submit_fill(page):
    page.evaluate("""() => {
      const f = document.getElementById("tform");
      if (!f) throw new Error("no form");
      const ev = new Event("submit", {bubbles:true, cancelable:true});
      if (typeof f.onsubmit === "function") f.onsubmit(ev);
      else f.dispatchEvent(ev);
    }""")

def start_server(root):
    s = socket.socket(); s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]; s.close()
    proc = subprocess.Popen(
        ["python3", "-m", "http.server", str(port), "-d", str(root)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    time.sleep(0.4)
    return proc, port

def launch(p):
    return p.chromium.launch(
        executable_path="/usr/bin/google-chrome",
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )

def make_ink(page, w=640, h=280):
    page.evaluate(
        """({w,h}) => {
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
          // a worked example: 50×3 + 20×4 = 230, method count doodle
          function line(pts){
            ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.stroke();
          }
          ctx.font = '22px "Noto Sans CJK TC", sans-serif';
          ctx.fillStyle = '#222';
          ctx.fillText('50×3 + 20×4 = 150+80 = 230', 24, 48);
          ctx.fillText('50×1 + 20×4 + 10×4 = 50+80+40 = 170…', 24, 88);
          ctx.fillText('方法：試 50 的枚數 0～4', 24, 132);
          line([[40,170],[200,170]]);
          ctx.fillText('共 5 種', 24, 220);
          window.__ink = c;
        }""",
        {"w": w, "h": h},
    )

def compose(page, opts):
    return page.evaluate(
        """async (opts) => {
          const ink = window.__ink || null;
          const res = await PRACTICE_SCRATCH.compose({
            q: { q: opts.question, src: opts.src, fig: opts.fig || '' },
            question: opts.question,
            fig: opts.fig || '',
            unitName: opts.unitName,
            herAnswer: opts.herAnswer,
            correct: opts.correct,
            answer: opts.answer,
            ink: ink,
            now: new Date(2026, 10, 11, 14, 32, 0),
            stamp: '2026-11-11_1432'
          });
          return { dataUrl: res.dataUrl, width: res.width, height: res.height, included: res.included,
                   filename: PRACTICE_SCRATCH.filename({src: opts.src}, opts.unitName, new Date(2026, 10, 11, 14, 32, 0)) };
        }""",
        opts,
    )

def save_data_url(data_url, path):
    assert data_url.startswith("data:image/png;base64,"), "not a png data url"
    path.write_bytes(base64.b64decode(data_url.split(",", 1)[1]))
    assert path.stat().st_size > 2000, f"tiny file {path} {path.stat().st_size}"

def test_compose(page):
    make_ink(page)
    # with figure + 答錯 so both answers appear
    res = compose(page, {
        "question": Q2023_12,
        "src": "APMOPS2023-#12",
        "unitName": "2023 亞太區小奧臺灣區初賽（111.11.13）",
        "herAnswer": "4",
        "correct": False,
        "answer": "5",
        "fig": COIN_FIG,
    })
    assert res["included"]["question"], "question missing from compose"
    assert res["included"]["answer"], "answer missing"
    assert res["included"]["result"], "result missing"
    assert res["included"]["fig"], "figure was not drawn into the image"
    fn = res.get("filename") or ""
    fnu = as_utf8(fn)
    print("FILENAME", fnu)
    assert fnu == "2026-11-11_1432_奧數_2023-第12題.png", fnu
    assert res["width"] >= 720 and res["height"] >= 500
    save_data_url(res["dataUrl"], SAMPLE_FIG)
    print("ok  compose includes question + fig + 答錯 + both answers")
    print("    ", SAMPLE_FIG, SAMPLE_FIG.stat().st_size, "bytes", res["width"], "x", res["height"])

    # without figure, 答對 (matches the brief example name)
    res2 = compose(page, {
        "question": Q2023_12,
        "src": "APMOPS2023-#12",
        "unitName": "2023 亞太區小奧臺灣區初賽（111.11.13）",
        "herAnswer": "5",
        "correct": True,
        "answer": "5",
        "fig": "",
    })
    assert res2["included"]["question"]
    assert res2["included"]["fig"] is False
    assert as_utf8(res2["filename"]) == "2026-11-11_1432_奧數_2023-第12題.png"
    save_data_url(res2["dataUrl"], SAMPLE)
    print("ok  compose 答對 without fig")
    print("    ", SAMPLE, SAMPLE.stat().st_size, "bytes", res2["width"], "x", res2["height"])

def test_blank_pixels(page):
    blank = page.evaluate("""() => {
      const c = document.createElement('canvas');
      c.width = 200; c.height = 100;
      const ctx = c.getContext('2d');
      return PRACTICE_SCRATCH.pixelsHaveInk(ctx, 200, 100);
    }""")
    assert blank is False, "empty canvas should not count as ink"
    inked = page.evaluate("""() => {
      const c = document.createElement('canvas');
      c.width = 200; c.height = 100;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#222';
      ctx.fillRect(20, 20, 4, 4);
      return PRACTICE_SCRATCH.pixelsHaveInk(ctx, 200, 100);
    }""")
    assert inked is True, "a mark should count as ink"
    print("ok  pixelsHaveInk blank vs marked")

def test_ui_capture_and_skip(page, origin):
    """On the real site: draw + finish + next captures; blank pad is skipped."""
    def boot(src, n=1):
        page.goto(origin + "/index.html", wait_until="domcontentloaded")
        page.wait_for_selector('[data-s="olympiad"]', timeout=8000)
        page.evaluate("""(src) => {
          window.__captured = window.__captured || [];
          if (!PRACTICE_SCRATCH.__hooked) {
            const orig = PRACTICE_SCRATCH.queueComposed;
            PRACTICE_SCRATCH.queueComposed = function(payload){
              window.__captured.push({
                src: payload.q && payload.q.src,
                herAnswer: payload.herAnswer,
                correct: payload.correct,
                answer: payload.answer,
                hasInk: !!(payload.ink && payload.ink.width),
                filename: PRACTICE_SCRATCH.filename(payload.q, payload.unitName, payload.now)
              });
              // Unit UI test only records the payload; a separate e2e script posts to Drive.
              return Promise.resolve(true);
            };
            PRACTICE_SCRATCH.__hooked = true;
          }
          const s = PRACTICE_DATA.subjects.find(x => x.id === 'olympiad');
          const u = s.units.find(x => x.id === 'oy_2023');
          const q = u.questions.find(x => x.src === src);
          u.questions = [q];
          u.round = 1;
          u.minQ = 1;
        }""", src)
        page.locator('[data-s="olympiad"]').click()
        page.locator('[data-u="oy_2023"]').click()
        page.wait_for_selector("#filldisp", timeout=8000)

    def finish_wrong(digit="4"):
        page.keyboard.press(digit)
        submit_fill(page)
        page.wait_for_selector(".feedback.hint", timeout=5000)
        page.wait_for_timeout(80)
        page.keyboard.press(digit)
        val = page.locator("#filldisp").get_attribute("data-val")
        if val != digit:
            tap_key(page, digit)
            val = page.locator("#filldisp").get_attribute("data-val")
        print("second try val:", val)
        assert val == digit, val
        submit_fill(page)
        page.wait_for_selector("#next", timeout=8000)

    boot("APMOPS2023-#12")
    page.locator("#spBtn").click()
    page.wait_for_selector("#spCanvas", state="visible", timeout=5000)
    box = page.locator("#spCanvas").bounding_box()
    assert box and box["width"] > 40
    x, y = box["x"] + 80, box["y"] + 80
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + 90, y + 40, steps=8)
    page.mouse.move(x + 40, y + 90, steps=8)
    page.mouse.up()
    has = page.evaluate("""() => {
      const cv = document.getElementById('spCanvas');
      return !!(cv && PRACTICE_SCRATCH.pixelsHaveInk(cv.getContext('2d'), cv.width, cv.height));
    }""")
    assert has, "drawing should make hasInk true"
    print("ok  SP.hasInk after drawing")
    page.locator("#spClose").click()
    page.wait_for_selector("#spPanel", state="hidden")

    finish_wrong("4")
    page.locator("#next").click()  # 看成績
    page.wait_for_function("() => window.__captured && window.__captured.length >= 1")
    first = page.evaluate("() => window.__captured")
    assert len(first) == 1, first
    assert first[0]["src"] == "APMOPS2023-#12"
    assert first[0]["herAnswer"] == "4"
    assert first[0]["correct"] is False
    assert first[0]["answer"] == "5"
    fn = as_utf8(first[0]["filename"])
    assert fn.endswith("_奧數_2023-第12題.png"), fn
    print("ok  UI capture on 看成績:", fn)

    # second session, blank pad, should not enqueue another capture
    boot("APMOPS2023-#1")
    # restore captured after reload (boot does goto, which clears hook state except we re-hook;
    # __captured is reset by goto). Seed it with a marker via evaluate after boot.
    # boot() already reset __captured to [] then maybe pushed nothing. Re-seed length check:
    # We need captures from this session only: expect 0 after blank finish.
    n0 = page.evaluate("() => window.__captured.length")
    ink2 = page.evaluate("""() => {
      const cv = document.getElementById('spCanvas');
      if(!cv) return false;
      return PRACTICE_SCRATCH.pixelsHaveInk(cv.getContext('2d'), cv.width, cv.height);
    }""")
    assert ink2 is False, "new question should start with a blank pad"
    finish_wrong("1")
    page.locator("#next").click()
    page.wait_for_timeout(400)
    after = page.evaluate("() => window.__captured.length")
    assert after == n0 == 0, f"blank pad should not be saved, got {after} captures (start {n0})"
    print("ok  blank scratchpad skipped on next/end")

    # ink + first-try correct should not be saved
    boot("APMOPS2023-#12")
    page.locator("#spBtn").click()
    page.wait_for_selector("#spCanvas", state="visible", timeout=5000)
    box = page.locator("#spCanvas").bounding_box()
    x, y = box["x"] + 80, box["y"] + 80
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + 90, y + 40, steps=8)
    page.mouse.up()
    page.locator("#spClose").click()
    page.wait_for_selector("#spPanel", state="hidden")
    page.keyboard.press("5")
    submit_fill(page)
    page.wait_for_selector("#next", timeout=8000)
    n_ok = page.evaluate("() => window.__captured.length")
    page.locator("#next").click()
    page.wait_for_timeout(400)
    n_after = page.evaluate("() => window.__captured.length")
    assert n_ok == 0 and n_after == 0, f"correct answer should not save scratch, got {n_after} (before next {n_ok})"
    print("ok  first-try correct with ink skipped")

    # ink + wrong then correct should also not be saved
    boot("APMOPS2023-#12")
    page.locator("#spBtn").click()
    page.wait_for_selector("#spCanvas", state="visible", timeout=5000)
    box = page.locator("#spCanvas").bounding_box()
    x, y = box["x"] + 80, box["y"] + 80
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + 90, y + 40, steps=8)
    page.mouse.up()
    page.locator("#spClose").click()
    page.wait_for_selector("#spPanel", state="hidden")
    page.keyboard.press("4")
    submit_fill(page)
    page.wait_for_selector(".feedback.hint", timeout=5000)
    page.wait_for_timeout(80)
    page.keyboard.press("5")
    val = page.locator("#filldisp").get_attribute("data-val")
    if val != "5":
        tap_key(page, "5")
        val = page.locator("#filldisp").get_attribute("data-val")
    assert val == "5", val
    submit_fill(page)
    page.wait_for_selector("#next", timeout=8000)
    n_ok2 = page.evaluate("() => window.__captured.length")
    page.locator("#next").click()
    page.wait_for_timeout(400)
    n_after2 = page.evaluate("() => window.__captured.length")
    assert n_ok2 == 0 and n_after2 == 0, f"second-try correct should not save scratch, got {n_after2} (before next {n_ok2})"
    print("ok  second-try correct with ink skipped")

def main():
    proc, port = start_server(ROOT)
    origin = f"http://127.0.0.1:{port}"
    try:
        with sync_playwright() as p:
            browser = launch(p)
            page = browser.new_page(viewport={"width": 1024, "height": 768})
            # helper page for compose
            page.goto(origin + "/scratch-save.js")  # just to have origin
            page.set_content(
                f"""<!DOCTYPE html><html lang="zh-Hant-TW"><head>
                <meta charset="utf-8">
                <style>
                @font-face {{
                  font-family: "Noto Sans CJK TC";
                  src: url("/fonts/NotoSansCJK-Regular.ttc");
                  font-weight: 400;
                }}
                @font-face {{
                  font-family: "Noto Sans CJK TC";
                  src: url("/fonts/NotoSansCJK-Bold.ttc");
                  font-weight: 700;
                }}
                body {{ font-family: "Noto Sans CJK TC", sans-serif; }}
                </style>
                <script charset="utf-8" src="{origin}/scratch-save.js"></script>
                </head><body><p>compose harness</p></body></html>"""
            )
            page.wait_for_function("() => window.PRACTICE_SCRATCH")
            # file:// fonts may be blocked; inject via FontFace if needed
            page.evaluate("""async () => {
              try {
                const r = new FontFace('Noto Sans CJK TC', 'url(/fonts/NotoSansCJK-Regular.ttc)', {weight:'400'});
                const b = new FontFace('Noto Sans CJK TC', 'url(/fonts/NotoSansCJK-Bold.ttc)', {weight:'700'});
                // may fail if not served; ignore
                await Promise.allSettled([r.load().then(f => document.fonts.add(f)),
                                          b.load().then(f => document.fonts.add(f))]);
              } catch (e) {}
            }""")
            test_blank_pixels(page)
            test_compose(page)
            test_ui_capture_and_skip(page, origin)
            browser.close()
        print("\nAll compose / UI scratch tests passed.")
    finally:
        proc.terminate()
        proc.wait(timeout=5)

if __name__ == "__main__":
    # serve fonts too? copy or symlink into ROOT? don't pollute zhirou/.
    # We'll start server on ROOT only; fonts may fall back to system if chrome can read them.
    main()
