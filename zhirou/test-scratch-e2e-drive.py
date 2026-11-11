#!/usr/bin/env python3
"""Real browser E2E: draw on 奧數計算紙, finish a question, confirm upload is queued and sent."""
import json, socket, subprocess, sys, time, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path("/tmp/zhirou-scratch-e2e.json")
URL = "https://script.google.com/macros/s/AKfycbzsvJ9ZDpkulvsidDgYfB6fhvm_eZgLA_zi6FMeNetuR6FcW67ddzUxMsmanKqPXck/exec"

def start_server(root):
    s = socket.socket(); s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]; s.close()
    proc = subprocess.Popen(
        ["python3", "-m", "http.server", str(port), "-d", str(root)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    time.sleep(0.4)
    return proc, port

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
      const ev = new Event("submit", {bubbles:true, cancelable:true});
      if (typeof f.onsubmit === "function") f.onsubmit(ev);
      else f.dispatchEvent(ev);
    }""")

def finish_wrong(page, digit="4"):
    page.keyboard.press(digit)
    submit_fill(page)
    page.wait_for_selector(".feedback.hint", timeout=5000)
    page.wait_for_timeout(80)
    page.keyboard.press(digit)
    val = page.locator("#filldisp").get_attribute("data-val")
    if val != digit:
        tap_key(page, digit)
        val = page.locator("#filldisp").get_attribute("data-val")
    assert val == digit, val
    submit_fill(page)
    page.wait_for_selector("#next", timeout=8000)

def main():
    proc, port = start_server(ROOT)
    origin = f"http://127.0.0.1:{port}"
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path="/usr/bin/google-chrome",
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            page = browser.new_page(viewport={"width": 1024, "height": 768})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(origin + "/index.html", wait_until="domcontentloaded")
            page.wait_for_selector('[data-s="olympiad"]', timeout=8000)
            cfg = page.evaluate("""() => ({
              url: PRACTICE_SCRATCH && PRACTICE_SCRATCH.URL,
              token: PRACTICE_SCRATCH && PRACTICE_SCRATCH.TOKEN
            })""")
            assert cfg["url"] == URL, cfg
            assert cfg["token"] == "zr-oly-sp-p5-2026", cfg
            print("ok  site has live Apps Script URL")

            page.evaluate("""() => {
              window.__sent = [];
              const orig = PRACTICE_SCRATCH.queueComposed;
              PRACTICE_SCRATCH.queueComposed = function(payload){
                const filename = PRACTICE_SCRATCH.filename(payload.q, payload.unitName, payload.now);
                const p = orig.call(PRACTICE_SCRATCH, payload).then(function(ok){
                  window.__sent.push({filename: filename, ok: ok, src: payload.q && payload.q.src});
                  return ok;
                }, function(err){
                  window.__sent.push({filename: filename, ok: false, error: String(err)});
                  return false;
                });
                window.__pending = p;
                return p;
              };
              const s = PRACTICE_DATA.subjects.find(x => x.id === 'olympiad');
              const u = s.units.find(x => x.id === 'oy_2023');
              const q = u.questions.find(x => x.src === 'APMOPS2023-#12');
              u.questions = [q];
              u.round = 1;
              u.minQ = 1;
            }""")
            page.locator('[data-s="olympiad"]').click()
            page.locator('[data-u="oy_2023"]').click()
            page.wait_for_selector("#filldisp", timeout=8000)

            page.locator("#spBtn").click()
            page.wait_for_selector("#spCanvas", state="visible", timeout=5000)
            box = page.locator("#spCanvas").bounding_box()
            assert box and box["width"] > 40
            x, y = box["x"] + 80, box["y"] + 80
            page.mouse.move(x, y)
            page.mouse.down()
            page.mouse.move(x + 120, y + 30, steps=10)
            page.mouse.move(x + 40, y + 100, steps=10)
            page.mouse.up()
            has = page.evaluate("""() => {
              const cv = document.getElementById('spCanvas');
              return !!(cv && PRACTICE_SCRATCH.pixelsHaveInk(cv.getContext('2d'), cv.width, cv.height));
            }""")
            assert has, "expected ink on the scratchpad"
            print("ok  drew on 計算紙")
            page.locator("#spClose").click()
            page.wait_for_selector("#spPanel", state="hidden")

            finish_wrong(page, "4")
            page.locator("#next").click()  # 看成績, last question
            page.wait_for_function("() => window.__pending", timeout=8000)
            # wait for compose + no-cors POST to finish (Apps Script can take a few seconds)
            page.wait_for_function("() => window.__sent && window.__sent.length >= 1", timeout=45000)
            sent = page.evaluate("() => window.__sent")
            leftover = page.evaluate("() => { try { return JSON.parse(localStorage.getItem('p5zr_scratch_outbox')||'[]').length; } catch(e){ return -1; } }")
            print("sent", sent, "outbox leftover", leftover)
            assert sent and sent[0]["ok"] is True, sent
            assert leftover == 0, leftover
            assert sent[0]["filename"].endswith("_奧數_2023-第12題.png"), sent
            OUT.write_text(json.dumps({
                "filename": sent[0]["filename"],
                "ok": True,
                "src": sent[0].get("src"),
                "pageErrors": errors,
            }, ensure_ascii=False, indent=2))
            print("ok  flush completed, filename:", sent[0]["filename"])
            if errors:
                print("page errors:", errors)
            browser.close()
        print("E2E browser flow passed")
        return 0
    finally:
        proc.terminate()
        proc.wait(timeout=5)

if __name__ == "__main__":
    sys.exit(main())
