"""
E2E harness ("hands and eyes"): drives the built app in headless Chrome like a user,
with the AI API mocked, and saves screenshots as evidence.

Usage: python3 tests/e2e/e2e.py <base_url> <screenshot_dir>
The app must be built with VITE_API_URL=https://api.mock.test
"""
import io
import json
import sys
import traceback

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
SHOTS = sys.argv[2] if len(sys.argv) > 2 else "screenshots"
API = "https://api.mock.test/v1/analyze"

AI_SCAM = {
    "verdict": "likely_scam", "risk_score": 94, "scam_type": "phishing",
    "summary": "This is a fake delivery notice that tries to get you to pay a small fee on a look-alike link.",
    "red_flags": [
        {"flag": "Asks for a small unexpected fee", "evidence": "unpaid $1.99 redelivery fee"},
        {"flag": "Pressure to act fast", "evidence": "Pay within 24 hours"},
    ],
    "next_steps": ["Don't tap the link or pay anything.", "Track parcels only in the official USPS app or website.", "Delete the message and report it as spam."],
    "extracted_text": "",
}
AI_LOW = {"verdict": "low_risk", "risk_score": 5, "scam_type": "none", "summary": "A normal personal message with no requests for money, codes or links.",
          "red_flags": [], "next_steps": ["No action needed."], "extracted_text": ""}
AI_IMG = dict(AI_SCAM, extracted_text="USPS: Your package is on hold. Pay $1.99 at usps-redeliver.top")

SCAM_TEXT = "USPS: Your package is on hold due to an unpaid $1.99 redelivery fee. Pay within 24 hours to avoid return: https://bit.ly/usps-redeliver"

results = []


def png_bytes():
    img = Image.new("RGB", (720, 400), "white")
    d = ImageDraw.Draw(img)
    d.text((20, 40), "USPS: Your package is on hold. Pay $1.99 at usps-redeliver.top", fill="black")
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def mock(page, body=None, status=200, abort=False):
    page.unroute("**/v1/analyze")
    if abort:
        page.route("**/v1/analyze", lambda r: r.abort())
    else:
        page.route("**/v1/analyze", lambda r: r.fulfill(status=status, content_type="application/json", body=json.dumps(body)))


def events(page):
    return page.evaluate("window.__scamcheckEvents || []")


def fresh(browser, onboarded=True, storage=None):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="en-US")
    init = "localStorage.setItem('sc.onboarded','1');" if onboarded else ""
    for k, v in (storage or {}).items():
        init += f"localStorage.setItem({json.dumps(k)}, {json.dumps(v)});"
    if init:
        ctx.add_init_script(f"if (!sessionStorage.getItem('seeded')) {{ {init} sessionStorage.setItem('seeded','1'); }}")
    page = ctx.new_page()
    page.goto(BASE)
    return ctx, page


def case(name):
    def deco(fn):
        def run(browser):
            try:
                fn(browser)
                results.append((name, True, ""))
                print(f"PASS  {name}")
            except Exception as e:  # noqa: BLE001
                results.append((name, False, str(e)))
                print(f"FAIL  {name}\n{traceback.format_exc()}")
        run.__name__ = name
        return run
    return deco


@case("F8 onboarding shows once")
def t_onboarding(browser):
    ctx, page = fresh(browser, onboarded=False)
    expect(page.get_by_test_id("onboarding")).to_be_visible()
    page.screenshot(path=f"{SHOTS}/01-onboarding.png")
    page.get_by_test_id("onb-start").click()
    expect(page.get_by_test_id("home")).to_be_visible()
    assert any(e["name"] == "onboarding_completed" for e in events(page))
    page.reload()
    expect(page.get_by_test_id("home")).to_be_visible()
    ctx.close()


@case("F3+F5+F9 text check with AI → likely scam, events without content")
def t_text_check(browser):
    ctx, page = fresh(browser)
    expect(page.get_by_test_id("check-btn")).to_be_disabled()
    page.screenshot(path=f"{SHOTS}/02-home-empty.png")
    mock(page, AI_SCAM)
    page.get_by_test_id("input").fill(SCAM_TEXT)
    expect(page.get_by_test_id("check-btn")).to_be_enabled()
    page.screenshot(path=f"{SHOTS}/03-home-filled.png")
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("result")).to_be_visible()
    expect(page.get_by_test_id("verdict")).to_have_attribute("data-verdict", "likely_scam")
    expect(page.get_by_test_id("summary")).to_contain_text("fake delivery notice")
    expect(page.get_by_test_id("flags")).to_contain_text("unpaid $1.99 redelivery fee")
    expect(page.get_by_test_id("steps")).to_contain_text("official USPS app")
    page.screenshot(path=f"{SHOTS}/04-result-likely-scam.png", full_page=True)
    ev = events(page)
    names = [e["name"] for e in ev]
    for n in ["check_started", "check_completed", "result_viewed"]:
        assert n in names, f"missing {n}: {names}"
    done = next(e for e in ev if e["name"] == "check_completed")
    assert done["params"]["verdict"] == "likely_scam" and done["params"]["input_type"] == "text", done
    blob = json.dumps([e["params"] for e in ev])
    for fragment in ["USPS", "bit.ly", "1.99", "redelivery"]:
        assert fragment not in blob, f"content leaked into analytics: {fragment}"
    ctx.close()


@case("F2 merge: AI says low risk but rules say scam → shows likely scam")
def t_merge(browser):
    ctx, page = fresh(browser)
    mock(page, AI_LOW)
    page.get_by_test_id("input").fill(SCAM_TEXT)
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("verdict")).to_have_attribute("data-verdict", "likely_scam")
    ctx.close()


@case("F2+F5 API unreachable → on-device result with offline label")
def t_offline(browser):
    ctx, page = fresh(browser)
    mock(page, abort=True)
    page.get_by_test_id("input").fill(SCAM_TEXT)
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("result")).to_be_visible()
    expect(page.get_by_test_id("source")).to_contain_text("offline")
    expect(page.get_by_test_id("offline-notice")).to_be_visible()
    expect(page.get_by_test_id("steps").locator("li")).to_have_count(4)
    page.screenshot(path=f"{SHOTS}/05-result-offline.png", full_page=True)
    assert any(e["name"] == "check_failed" for e in events(page))
    ctx.close()


@case("F3+F5 example chip → low risk never says 'safe'")
def t_example_low(browser):
    ctx, page = fresh(browser)
    mock(page, AI_LOW)
    page.get_by_test_id("example-normal").click()
    assert any(e["name"] == "example_tapped" for e in events(page))
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("verdict")).to_have_attribute("data-verdict", "low_risk")
    verdict_text = page.get_by_test_id("verdict").inner_text().lower()
    assert "safe" not in verdict_text, verdict_text
    page.screenshot(path=f"{SHOTS}/06-result-low-risk.png", full_page=True)
    started = next(e for e in events(page) if e["name"] == "check_started")
    assert started["params"]["input_type"] == "example", started
    ctx.close()


@case("F4 screenshot check (AI) and image-only offline error")
def t_image(browser):
    ctx, page = fresh(browser)
    mock(page, AI_IMG)
    page.get_by_test_id("file-input").set_input_files({"name": "sms.png", "mimeType": "image/png", "buffer": png_bytes()})
    expect(page.get_by_test_id("image-preview")).to_be_visible()
    expect(page.get_by_test_id("check-btn")).to_be_enabled()
    page.screenshot(path=f"{SHOTS}/07-home-screenshot.png")
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("verdict")).to_have_attribute("data-verdict", "likely_scam")
    expect(page.get_by_test_id("extracted")).to_contain_text("Text we read")
    started = next(e for e in events(page) if e["name"] == "check_started")
    assert started["params"]["input_type"] == "image", started
    # image only + API down
    page.get_by_test_id("check-another").click()
    mock(page, abort=True)
    page.get_by_test_id("file-input").set_input_files({"name": "sms.png", "mimeType": "image/png", "buffer": png_bytes()})
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("error")).to_contain_text("internet")
    expect(page.get_by_test_id("home")).to_be_visible()
    ctx.close()


@case("F6 feedback + in-app report")
def t_feedback(browser):
    ctx, page = fresh(browser)
    mock(page, AI_SCAM)
    page.get_by_test_id("input").fill(SCAM_TEXT)
    page.get_by_test_id("check-btn").click()
    page.get_by_test_id("fb-yes").click()
    expect(page.get_by_test_id("feedback")).to_contain_text("Thanks")
    page.get_by_test_id("report-btn").click()
    expect(page.get_by_test_id("report-sheet")).to_be_visible()
    page.screenshot(path=f"{SHOTS}/08-report-sheet.png")
    page.get_by_test_id("report-send").click()
    expect(page.get_by_test_id("report-thanks")).to_be_visible()
    names = [e["name"] for e in events(page)]
    assert "result_feedback" in names and "result_reported" in names, names
    ctx.close()


@case("F7 history: newest first, open item, delete all")
def t_history(browser):
    ctx, page = fresh(browser)
    mock(page, AI_LOW)
    page.get_by_test_id("input").fill("first message to check please")
    page.get_by_test_id("check-btn").click()
    page.get_by_test_id("check-another").click()
    mock(page, AI_SCAM)
    page.get_by_test_id("input").fill(SCAM_TEXT)
    page.get_by_test_id("check-btn").click()
    page.get_by_test_id("check-another").click()
    page.get_by_test_id("nav-history").click()
    items = page.get_by_test_id("history-item")
    expect(items).to_have_count(2)
    expect(items.nth(0)).to_contain_text("Likely scam")
    page.screenshot(path=f"{SHOTS}/09-history.png")
    items.nth(1).click()
    expect(page.get_by_test_id("verdict")).to_have_attribute("data-verdict", "low_risk")
    page.get_by_test_id("back").click()
    page.get_by_test_id("nav-history").click()
    page.once("dialog", lambda d: d.accept())
    page.get_by_test_id("history-clear").click()
    expect(page.get_by_test_id("history-empty")).to_be_visible()
    names = [e["name"] for e in events(page)]
    assert "history_cleared" in names and "history_item_opened" in names, names
    ctx.close()


@case("F8 language switch to Vietnamese + privacy page")
def t_lang(browser):
    ctx, page = fresh(browser)
    page.get_by_test_id("nav-settings").click()
    page.get_by_test_id("lang-vi").click()
    page.screenshot(path=f"{SHOTS}/10-settings-vi.png", full_page=True)
    page.get_by_test_id("privacy-link").click()
    expect(page.get_by_test_id("privacy")).to_be_visible()
    page.get_by_label("Quay lại").click()
    page.get_by_test_id("back").click()
    expect(page.get_by_test_id("home-title")).to_have_text("Đây có phải lừa đảo?")
    mock(page, abort=True)
    page.get_by_test_id("example-otp").click()
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("verdict")).to_have_attribute("data-verdict", "likely_scam")
    page.screenshot(path=f"{SHOTS}/11-result-vi-offline.png", full_page=True)
    assert any(e["name"] == "language_changed" and e["params"]["language"] == "vi" for e in events(page))
    ctx.close()


@case("F10 daily limit → offline result + Pro waitlist fake door")
def t_limit(browser):
    ctx, page = fresh(browser)
    page.evaluate("localStorage.setItem('sc.quota', JSON.stringify({day: new Date().toDateString(), n: 20}))")
    page.reload()
    expect(page.get_by_test_id("ai-left")).to_contain_text("0")
    calls = []
    page.route("**/v1/analyze", lambda r: (calls.append(1), r.fulfill(status=200, content_type="application/json", body=json.dumps(AI_LOW))))
    page.get_by_test_id("input").fill(SCAM_TEXT)
    page.get_by_test_id("check-btn").click()
    expect(page.get_by_test_id("limit-notice")).to_be_visible()
    assert not calls, "AI must not be called after the daily limit"
    expect(page.get_by_test_id("pro-card")).to_contain_text("coming soon")
    page.screenshot(path=f"{SHOTS}/12-limit-pro.png", full_page=True)
    page.get_by_test_id("pro-join").click()
    expect(page.get_by_test_id("pro-joined")).to_be_visible()
    names = [e["name"] for e in events(page)]
    for n in ["daily_limit_reached", "pro_cta_viewed", "pro_waitlist_joined"]:
        assert n in names, f"missing {n}"
    ctx.close()


def main():
    import os
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for t in [t_onboarding, t_text_check, t_merge, t_offline, t_example_low, t_image, t_feedback, t_history, t_lang, t_limit]:
            t(browser)
        browser.close()
    failed = [r for r in results if not r[1]]
    print(f"\nE2E: {len(results) - len(failed)}/{len(results)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
