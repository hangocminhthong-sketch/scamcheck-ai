# ADR 002 — Hybrid engine: on-device rules + AI, show the higher risk

- Context: AI can be wrong, slow, or unavailable (offline, quota). A false "low risk" costs a user money;
  a false "suspicious" costs a few seconds.
- Decision: always run the on-device rule engine (F1). Call AI (F2) when online and under the daily
  limit. Final verdict = max(risk_AI, risk_rules). Red flags merged.
- Consequences: the app always gives an answer; errors lean towards caution; AI cost is capped.
