# Log

- 2026-11-12 — Idea A (ScamCheck AI) chosen from 4 researched ideas (see raw/market-research.md).
- 2026-11-12 — Wiki written: overview, F1–F11 with Done-when, 5 screens, ADR 001–005.
- 2026-11-12 — Switched to Capacitor (ADR 001): Android SDK downloads blocked in the build environment.
- 2026-11-12 — F1 engine + tests (11 green first run). Worker + 8 contract tests green.
- 2026-11-12 — UI (5 screens, EN/VI), analytics, AdMob, share-intent plugin, CI APK workflow.
- 2026-11-12 — E2E harness: 10 flows green, screenshots in docs/screenshots.
- 2026-11-12 — Screenshot review found VN bank-staff scam under-flagged → test red → patterns fixed → green (learned.md).
- 2026-11-12 — verify.sh green. F1–F10 passing, F11 claimed (needs a device).
- 2026-11-12 — Repo pushed to GitHub (private). CI built the APK successfully, so the Android code compiles.
- 2026-11-12 — Worker live at https://scamcheck-api.hangocminhthong.workers.dev (deployed from the Cloudflare dashboard).
  Removed `temperature` (rejected by the model). Live smoke test: 5/5 correct verdicts (EN delivery phishing, VN bank-OTP,
  VN family message, real Chase OTP notice, prompt-injection + USDT) in ~1.7–2.7 s.

## Open questions
- Which Firebase project / AdMob account will Apero use at publishing? (Using placeholders + test IDs.)
- Worker URL for production (team deploys to their Cloudflare account for the demo).
