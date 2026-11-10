#!/usr/bin/env python3
"""Headless keypad + phone-feedback tests for 芷媃 fill-in questions."""
import sys, subprocess, time, socket, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
SHOT = pathlib.Path("/workspace/zhirou-style-shots")
SHOT.mkdir(parents=True, exist_ok=True)

def start_server(root):
    s = socket.socket(); s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]; s.close()
    proc = subprocess.Popen(
        ["python3", "-m", "http.server", str(port), "-d", str(root)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    time.sleep(0.5)
    return proc, port

def open_fill_q(page, src="APMOPS2027-#1"):
    page.evaluate("""(src) => {
      const s = PRACTICE_DATA.subjects.find(x => x.id === "olympiad");
      const u = s.units.find(x => x.id === "oy_2027");
      const q = u.questions.find(x => x.src === src) || u.questions[0];
      u.questions = [q];
      u.round = 1;
    }""", src)
    page.locator('[data-s="olympiad"]').click()
    page.locator('[data-u="oy_2027"]').click()
    page.wait_for_selector("#filldisp", timeout=8000)

def disp_val(page):
    return page.locator("#filldisp").get_attribute("data-val") or ""

def tap_key(page, k):
    found = page.locator(f'.fillpad button[data-fk="{k}"]').count()
    assert found == 1, f"missing key {k}"
    # Dispatch the same pointerdown/up + click the tablet would send, so we
    # also assert the handler does not double-fire from the ghost click.
    page.evaluate("""(k) => {
      const b = document.querySelector('.fillpad button[data-fk="'+k+'"]');
      const ev = {bubbles:true, cancelable:true, button:0, isPrimary:true, pointerId:1, pointerType:"touch"};
      b.dispatchEvent(new PointerEvent("pointerdown", ev));
      b.dispatchEvent(new PointerEvent("pointerup", ev));
      b.dispatchEvent(new MouseEvent("click", {bubbles:true, cancelable:true, button:0}));
    }""", k)

def in_view(page, sel):
    return page.evaluate("""(sel) => {
      const el = document.querySelector(sel);
      if (!el) return {ok:false, reason:"missing"};
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight, vw = window.innerWidth;
      const visible = r.bottom > 0 && r.top < vh && r.left < vw && r.right > 0 && r.height > 0;
      const fully = r.top >= 0 && r.bottom <= vh;
      return {ok:visible, fully, top:r.top, bottom:r.bottom, vh, vw};
    }""", sel)

def main():
    errs = []
    proc, port = start_server(ROOT)
    failed = 0
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path="/usr/bin/google-chrome",
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            # ---- keypad accuracy (tablet-ish 1024x768 + has_touch) ----
            ctx = browser.new_context(viewport={"width":1024,"height":768}, has_touch=True, device_scale_factor=1)
            ctx.route("**/formResponse*", lambda r: r.abort())
            page = ctx.new_page()
            page.on("pageerror", lambda e: errs.append(str(e)))
            page.goto(f"http://127.0.0.1:{port}/", wait_until="load")
            page.wait_for_selector('[data-s="olympiad"]', timeout=15000)
            open_fill_q(page)

            # No native text input — keypad-only display
            n_inputs = page.locator("input, textarea").count()
            assert n_inputs == 0, f"expected no text inputs, found {n_inputs}"
            # layout: answer + side ✔ on one row; no full-width 送出 bar
            assert page.locator(".dispwrap #filldisp").count() == 1
            assert page.locator(".dispwrap #tok").count() == 1
            assert page.locator("#tok").inner_text().strip() == "✔"
            assert page.locator("button.big.primary#tok").count() == 0
            # 3-column number pad + compact extras
            assert page.locator(".fillpad:not(.fill-extra) button").count() == 12
            assert page.locator(".fill-extra button").count() == 9

            assert page.locator("#filldisp").count() == 1
            assert disp_val(page) == ""

            # Sequential taps: 7, 2, 9 — value must equal taps exactly (no duplicates)
            expected = ""
            for k in ["7", "2", "9"]:
                tap_key(page, k)
                expected += k
                got = disp_val(page)
                assert got == expected, f"after tapping {k}: got {got!r}, want {expected!r}"
            print("PASS sequential 729, no duplicates")

            # Ghost click: dispatch pointerdown + click on the same button, must add only once
            before = disp_val(page)
            page.evaluate("""() => {
              const b = document.querySelector('.fillpad button[data-fk="1"]');
              const ev = {bubbles:true, cancelable:true, button:0, isPrimary:true, pointerId:1, pointerType:"touch"};
              b.dispatchEvent(new PointerEvent("pointerdown", ev));
              b.dispatchEvent(new PointerEvent("pointerup", ev));
              b.dispatchEvent(new MouseEvent("click", {bubbles:true, cancelable:true, button:0}));
            }""")
            after = disp_val(page)
            assert after == before + "1", f"ghost click doubled? {before!r} -> {after!r}"
            print("PASS pointerdown+click fires once (7291)")

            # Backspace once
            tap_key(page, "⌫")
            assert disp_val(page) == "729", f"backspace failed: {disp_val(page)!r}"
            print("PASS backspace")

            # 清除
            tap_key(page, "5")
            assert disp_val(page) == "7295"
            tap_key(page, "清除")
            assert disp_val(page) == "", f"clear failed: {disp_val(page)!r}"
            print("PASS 清除")

            # Physical keyboard: digits + Enter
            page.keyboard.type("729")
            assert disp_val(page) == "729", f"physical keys: {disp_val(page)!r}"
            page.keyboard.press("Enter")
            page.wait_for_selector(".feedback.good", timeout=5000)
            assert "說明" in page.inner_text("#fb")
            # keypad hidden after submit
            assert page.locator(".fillkeys").is_hidden() or page.locator(".fillkeys").get_attribute("hidden") is not None
            print("PASS physical keyboard + submit 729, keypad hidden, 答對 feedback")
            ctx.close()

            # ---- 375px 答對 / 答錯 screenshots and visibility ----
            def phone():
                c = browser.new_context(viewport={"width":375,"height":667}, has_touch=True, device_scale_factor=1)
                c.route("**/formResponse*", lambda r: r.abort())
                pg = c.new_page()
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(f"http://127.0.0.1:{port}/", wait_until="load")
                pg.wait_for_selector('[data-s="olympiad"]', timeout=15000)
                open_fill_q(pg)
                return c, pg

            # 答對
            c, pg = phone()
            for k in ["7","2","9"]:
                tap_key(pg, k)
            pg.locator("#tok").click()
            pg.wait_for_selector(".feedback.good", timeout=5000)
            pg.wait_for_timeout(500)
            vis = in_view(pg, ".feedback.good")
            print("答對 in view:", vis)
            assert vis["ok"], f"答對 feedback not in view: {vis}"
            # keypad must not cover it
            assert "說明" in pg.inner_text("#fb")
            pg.screenshot(path=str(SHOT/"oly-phone-correct-375.png"), full_page=False)
            c.close()
            print("PASS 375 答對 screenshot")

            # 答錯 (two wrong tries so 說明 appears)
            c, pg = phone()
            tap_key(pg, "1")
            pg.locator("#tok").click()
            pg.wait_for_selector(".feedback.hint", timeout=5000)
            pg.wait_for_timeout(300)
            vis_h = in_view(pg, ".feedback.hint")
            print("提示 in view:", vis_h)
            assert vis_h["ok"], f"hint not in view: {vis_h}"
            # second wrong
            tap_key(pg, "2")
            pg.locator("#tok").click()
            pg.wait_for_selector(".feedback.explain", timeout=5000)
            pg.wait_for_timeout(600)
            vis_w = in_view(pg, ".feedback.explain")
            print("答錯 說明 in view:", vis_w)
            assert vis_w["ok"], f"答錯 feedback not in view: {vis_w}"
            text = pg.inner_text("#fb")
            assert "答錯了" in text and "正確答案是" in text and "說明" in text and "729" in text
            # keypad hidden so it cannot cover 說明
            hidden = pg.locator(".fillkeys").is_hidden()
            assert hidden, "keypad still visible after final 答錯"
            # no red banner / shake classes we didn't add
            assert pg.locator(".shake, .toast-bad, .banner-red").count() == 0
            pg.screenshot(path=str(SHOT/"oly-phone-wrong-375.png"), full_page=False)
            c.close()
            print("PASS 375 答錯 screenshot, 說明 visible, keypad hidden")

            browser.close()
    finally:
        proc.terminate()

    if errs:
        print("JS errors:", errs)
        return 1
    print("ALL KEYPAD / PHONE FEEDBACK TESTS PASSED")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as e:
        print("FAIL:", e)
        sys.exit(1)
