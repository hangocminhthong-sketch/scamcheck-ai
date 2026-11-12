# F9 — Event tracking

Single entry point `track(name, params)` in `app/src/analytics.ts`.
Providers: Firebase Analytics on Android (native SDK through `@capacitor-firebase/analytics`),
debug provider everywhere (console + `window.__scamcheckEvents` for tests).
Full list and rationale: `/TRACKING_PLAN.md`.

## Rules
- Event and param names: snake_case, ≤ 40 chars; params are enums, buckets or counts only.
- Never send message text, URLs, phone numbers, images (ADR 004).

## Done when
- [ ] Every event in TRACKING_PLAN.md is fired somewhere in code (verified by a test that greps).
- [ ] A test asserts no event param value contains the input text.
- [ ] Firebase provider is a no-op on web and when not configured (no crash).
