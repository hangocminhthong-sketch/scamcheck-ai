"""Static checks for verify.sh: tracking plan ↔ code, F11 manifest, no secrets in the app."""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
errors = []

# 1. Every event in TRACKING_PLAN.md is declared and fired in code (F9).
plan = (ROOT / "TRACKING_PLAN.md").read_text()
plan = plan.split("## 2. Events", 1)[-1].split("## 3.", 1)[0]
planned = set(re.findall(r"^\|\s*`([a-z_]+)`", plan, re.M))
src = "\n".join(p.read_text() for p in (ROOT / "app/src").rglob("*.ts*"))
declared = set(re.findall(r"\|\s*'([a-z_]+)'", (ROOT / "app/src/analytics.ts").read_text()))
fired = set(re.findall(r"track\(\s*'([a-z_]+)'", src))
if not planned:
    errors.append("TRACKING_PLAN.md: no events found")
for e in sorted(planned - declared):
    errors.append(f"event `{e}` in TRACKING_PLAN.md but not in EventName")
for e in sorted(planned - fired):
    errors.append(f"event `{e}` in TRACKING_PLAN.md but never fired with track()")
for e in sorted(fired - planned):
    errors.append(f"event `{e}` fired in code but missing from TRACKING_PLAN.md")

# 2. F11: share-sheet intent filter + plugin registered.
manifest = (ROOT / "app/android/app/src/main/AndroidManifest.xml").read_text()
if "android.intent.action.SEND" not in manifest or 'mimeType="text/plain"' not in manifest:
    errors.append("AndroidManifest: SEND text/plain intent-filter missing")
if "com.google.android.gms.ads.APPLICATION_ID" not in manifest:
    errors.append("AndroidManifest: AdMob APPLICATION_ID meta-data missing")
main = (ROOT / "app/android/app/src/main/java/com/scamcheck/ai/MainActivity.java").read_text()
if "registerPlugin(ShareIntentPlugin.class)" not in main:
    errors.append("MainActivity: ShareIntentPlugin not registered")

# 3. No API keys in the app bundle sources (ADR 003).
if re.search(r"sk-ant-[A-Za-z0-9_-]{10,}", src) or "x-api-key" in src:
    errors.append("app/src contains an API key or calls Anthropic directly")

# 4. Never call a verdict "safe" in UI strings (F5).
i18n = (ROOT / "app/src/i18n.ts").read_text()
for line in i18n.splitlines():
    if re.search(r"v_low_risk[^:]*:\s*'[^']*\b(safe|an toàn)\b", line, re.I):
        errors.append(f"low-risk label says 'safe': {line.strip()}")

if errors:
    print("STATIC CHECKS FAILED:\n- " + "\n- ".join(errors))
    sys.exit(1)
print(f"Static checks OK ({len(planned)} tracked events, manifest, no secrets)")
