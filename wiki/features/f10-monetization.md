# F10 — Monetization: ads, daily AI limit, Pro waitlist

## Behaviour
- AdMob adaptive banner at the bottom of the Result screen (Android only). Test ad IDs in debug,
  real IDs via env at release. UMP consent form shown when required (EEA/UK).
  No interstitials in v1 (protect trust in a safety app).
- 20 AI checks per device per day (local counter). After that: on-device checks only, with a notice
  and Pro CTA → `daily_limit_reached`.
- Pro waitlist (fake door, ADR 005): card in Settings and on limit notice. Shows what Pro will include
  and "Notify me". Tap → `pro_waitlist_joined`. Clearly says "Coming soon" (no payment taken).

## Done when
- [ ] After 20 AI checks in a day, the 21st runs offline and shows the limit notice.
- [ ] Pro card says "Coming soon", fires `pro_cta_viewed` on view and `pro_waitlist_joined` on tap.
- [ ] Ads code is skipped on web without errors.
