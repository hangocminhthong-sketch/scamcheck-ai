# Feature status (pending → claimed → passing)

Last verify: 2026-11-12 — `tools/verify.sh` green (20 unit, 8 worker, build, static, 10/10 E2E).

| ID | Feature | Status | Verified by |
|---|---|---|---|
| F1 | On-device engine | passing | tests/unit/heuristics.test.ts (13) |
| F2 | AI analysis | passing (mocked) | worker/test (8), merge-api.test.ts, E2E merge + offline. Live prompt: manual check with real key |
| F3 | Check text | passing | E2E text check, example chip |
| F4 | Check screenshot | passing | E2E screenshot + image-only offline error |
| F5 | Result | passing | E2E (all verdicts, offline steps, no "safe") |
| F6 | Feedback & report | passing | E2E feedback + report sheet |
| F7 | History | passing | unit storage + E2E history |
| F8 | Onboarding & settings | passing | E2E onboarding, language, privacy |
| F9 | Analytics | passing | E2E no-content assertion + tools/check_static.py |
| F10 | Monetization | passing (web) | E2E daily limit + Pro fake door. AdMob banner: manual on device |
| F11 | Share intent | claimed | static manifest/plugin check. Needs manual test on a device (share from Messages/Zalo) |
