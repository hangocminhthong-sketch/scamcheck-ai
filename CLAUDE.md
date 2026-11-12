# CLAUDE.md — rules for building ScamCheck AI

You are building **ScamCheck AI**, an Android app (Capacitor + TypeScript) that tells
people whether a message, link or screenshot is likely a scam.

## Architecture (Apero wiki + harness)
- `raw/` — source material (assignment brief, research). **Never edit.**
- `wiki/` — the spec. Read `wiki/index.md` first, then the feature page you work on.
  - `features/` one page per feature, each ends with a **Done when** checklist.
  - `screens/` one page per screen. `decisions/` ADRs (why we chose X).
  - `log.md` — append one line per change (date, what, which feature).
- `app/` — the product (Vite + React + TS, Capacitor Android shell in `app/android`).
- `worker/` — Cloudflare Worker that holds the Claude API key and calls Claude.
- `tools/verify.sh` — the judge. A feature is **passing** only when verify is green.

## Rules
1. Spec first: update the wiki page before changing code. Code follows the wiki.
2. Every feature's Done-when items must map to an automated test (unit, worker or E2E).
3. A feature you finished is `claimed`; it becomes `passing` only after `tools/verify.sh` is green.
   Record status in `wiki/features/_status.md`.
4. Never log message content, phone numbers, URLs or images in analytics. Only enums and buckets.
5. Never tell the user a message is "100% safe". Lowest verdict is "Low risk".
6. The API key lives only in the Worker (`wrangler secret put ANTHROPIC_API_KEY`). Never in the app.
7. Safety bias: when AI and on-device checks disagree, show the *higher* risk.
8. All user-facing strings go through `app/src/i18n.ts` (EN + VI).
9. Do not edit files outside the task's scope. If the same test fails 3 times, stop and write the
   question into `wiki/log.md` under "Open questions".
10. Every red test and its fix is noted in `wiki/learned.md` so the same mistake is not repeated.
