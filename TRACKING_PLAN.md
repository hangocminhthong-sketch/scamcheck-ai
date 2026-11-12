# Tracking plan — ScamCheck AI v1.0

**Tool:** Google Analytics for Firebase (native Android SDK via `@capacitor-firebase/analytics`).
Firebase also logs `first_open`, `session_start`, `screen_view`, `app_remove` and (when linked to
AdMob) `ad_impression` automatically.
**Code:** every event goes through `track()` in `app/src/analytics.ts`. In debug and web builds,
events are also kept in `window.__scamcheckEvents`, which the E2E tests read.
**Privacy rule (ADR 004):** parameters are enums, buckets or counts. Message text, links, phone
numbers and images are **never** sent. A test fails the build if checked text appears in any event.
`tools/check_static.py` fails if an event in this table is missing from the code, or the code fires
an event that is not in this table.

## 1. What we want to learn (scorecard, max 5 metrics)

| # | Question | Metric | Built from | Target (first 30 days) |
|---|---|---|---|---|
| 1 | Do new users reach value? (activation) | % of new users with ≥1 `check_completed` on day 0 | `first_open` → `check_completed` | ≥ 60% |
| 2 | Is the verdict useful? (quality) | 👍 share = yes ÷ (yes + no) | `result_feedback` | ≥ 80% |
| 3 | Do they come back when the next suspicious message arrives? (retention) | D7 retention; checks per weekly active user | `check_completed` per user/week | D7 ≥ 15%; ≥ 2 checks/WAU |
| 4 | Is AI reliable and fast? (health) | AI fallback rate; p50 latency bucket | `check_failed{stage=ai}` ÷ `check_started`; `check_completed.latency` | fallback < 3%; p50 < 3 s |
| 5 | Will anyone pay? (monetization) | Waitlist conversion; limit hits | `pro_waitlist_joined` ÷ `pro_cta_viewed`; `daily_limit_reached` users | ≥ 5% |

**North-star metric:** weekly completed checks. Each check is one moment where we may have
stopped a scam.

**Funnel:** `first_open` → `onboarding_completed` → `check_started` → `check_completed` →
`result_viewed` → (`result_shared` | `result_feedback`) → second `check_started` on a later day.

## 2. Events

| Event | When it fires | Parameters | Why it matters |
|---|---|---|---|
| `onboarding_completed` | User taps "Get started" on first launch | — | Onboarding drop-off; step 2 of the funnel |
| `check_started` | User taps Check, or a shared text auto-starts a check | `input_type` (text, image, text_image, shared, example), `text_length` (0, 1-49, 50-199, 200-999, 1000+), `has_image` | Demand per input method. Shows whether share-sheet and screenshot features are used |
| `check_completed` | A verdict is ready | the `check_started` params + `verdict`, `risk_bucket` (00-09…90-99), `source` (ai, hybrid, offline), `scam_type`, `flag_count`, `latency` (<1s, 1-3s, 3-6s, 6-10s, 10s+) | Core value event. Verdict mix, scam types users meet, speed |
| `check_failed` | AI call failed (fell back to on-device), or a check could not run at all | `stage` (ai, check), `reason` (timeout, http_5xx, image_needs_internet…), `fallback` (offline, none) | Reliability and Worker cost; prompt or infra problems |
| `example_tapped` | An example chip is tapped | `example_id` (delivery, otp, job, normal) | Whether new users explore before pasting real messages |
| `result_viewed` | Result screen shown | `verdict`, `source`, `from` (check, history) | Result impressions; denominator for ads, shares and feedback |
| `result_feedback` | 👍 or 👎 tapped | `helpful` (yes, no), `verdict`, `source` | Perceived accuracy by verdict and source. Main quality KPI |
| `result_reported` | Report sheet sent (Google Play AI-content policy) | `reason` (wrong_verdict, offensive, other), `verdict`, `source` | Safety and accuracy issues. Input for prompt tuning |
| `result_shared` | Share succeeded | `verdict` | Viral loop: people warn family and friends |
| `history_opened` | History icon tapped | — | Whether history is worth keeping |
| `history_item_opened` | A past check opened | `verdict` | Re-use of past results |
| `history_cleared` | Delete-all confirmed | `count` | Privacy sensitivity |
| `daily_limit_reached` | A check ran offline because the 20 daily AI checks were used | `checks_today` | Heavy users = Pro candidates; cost exposure |
| `pro_cta_viewed` | Pro card shown | `placement` (settings, limit) | Fake-door exposure (ADR 005) |
| `pro_waitlist_joined` | "Notify me" tapped | `placement` | Willingness to pay before we build billing |
| `language_changed` | Language switched in Settings | `language` (en, vi) | Market and localisation demand |
| `ad_loaded` | AdMob banner shown on the result screen | `placement` | Ad fill rate (revenue = impressions × eCPM) |
| `ad_failed` | Banner failed to load | `placement` | Fill problems, consent issues |

## 3. User properties
| Property | Values | Use |
|---|---|---|
| `app_language` | en, vi | Segment every metric by market |

## 4. Round 2 analysis plan (with Apero's live data)
1. **Funnel and activation** by `input_type` and `app_language`. If `example` users activate more,
   show examples more prominently.
2. **Quality:** 👍 rate and report rate by `verdict` × `source`. If `offline` results get many 👎,
   raise the engine's weights or fix the AI fallback.
3. **Cohort retention** D1/D7/D30 for users whose first verdict was `likely_scam` versus `low_risk`.
   Hypothesis: catching a real scam drives retention.
4. **Monetization:** ad ARPDAU (AdMob) versus Worker cost per check (Claude tokens). Waitlist
   conversion decides whether to build Pro billing.
5. **A/B candidates:** onboarding with and without a live example; banner versus no banner on
   `likely_scam` results (trust); 20 versus 10 daily AI checks.
