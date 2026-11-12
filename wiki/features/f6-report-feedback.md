# F6 — Feedback & report (Google Play AI-Generated Content policy)

## Behaviour
- Under the result: "Was this helpful?" 👍 / 👎 → `result_feedback`.
- "Report this result" link opens a sheet: Wrong verdict · Offensive or harmful text · Other.
  Sending stores the report locally and fires `result_reported {reason}` (no content). User sees "Thanks".
- Reports are reviewed via analytics counts per reason to tune prompts (Round 2).

## Done when
- [ ] Feedback buttons fire `result_feedback` once and then show "Thanks for the feedback".
- [ ] Report sheet opens without leaving the app and fires `result_reported`.
