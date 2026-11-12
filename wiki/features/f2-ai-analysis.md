# F2 — AI analysis (Claude via Cloudflare Worker)

## Behaviour
- App POSTs to `${VITE_API_URL}/v1/analyze` with `{ text?, image?: {data, mediaType}, lang }`.
- Worker calls Claude (`claude-haiku-5-5` by default, env `MODEL`) with a fixed system prompt and
  returns strict JSON:
  `{ verdict, risk_score (0–100), scam_type, summary, red_flags: [{flag, evidence}], next_steps: [], extracted_text }`.
- Worker validates and clamps the JSON. Invalid model output → 502 `bad_model_output`.
- Input limits: text ≤ 8,000 chars; image ≤ 4 MB base64; types png/jpeg/webp. Otherwise 400.
- CORS allowed for the app origins. Only POST /v1/analyze and GET /health.
- App timeout 20 s. On error/timeout/offline → fall back to F1 only and label the result
  "On-device check (offline)".
- Merge rule (ADR 002): final verdict = the higher risk of AI and F1. Red flags = AI flags + F1 flags
  not already covered (de-duplicated by category).

## Done when
- [ ] Worker returns 400 for empty input, too-long text, wrong image type.
- [ ] Worker returns normalized JSON when Claude returns valid JSON (also when wrapped in ```json fences).
- [ ] Worker returns 502 when Claude returns non-JSON.
- [ ] Worker never returns the API key or raw upstream errors.
- [ ] App merge: AI `low_risk` + F1 `likely_scam` → final `likely_scam`.
- [ ] App falls back to F1 when the API is unreachable, and the result shows the offline label.
