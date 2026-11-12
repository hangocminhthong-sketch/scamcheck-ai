# ADR 005 — Pro as a fake-door waitlist in v1

- Context: billing integration needs a Play Console merchant account (Apero's) and time we don't have.
  We also don't know whether people will pay for a scam checker.
- Decision: ship a clearly labelled "Coming soon" Pro card + "Notify me" (MVP fake-button technique,
  course Module 5). Track `pro_cta_viewed` → `pro_waitlist_joined` conversion and `daily_limit_reached`.
- Consequences: no revenue from subscriptions in v1 (ads only), but Round 2 gets real willingness-to-pay
  data before building billing. Copy must never imply a purchase happened.
