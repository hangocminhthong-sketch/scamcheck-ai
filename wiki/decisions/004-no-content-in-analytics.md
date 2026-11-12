# ADR 004 — No message content in analytics

- Context: messages contain names, phone numbers, bank details. Google Play Data safety and user trust.
- Decision: events carry only enums, buckets (length, latency, score) and counts. A unit test fails if
  any event param contains the checked text.
- Consequences: we cannot read what users check from analytics; prompt tuning uses report reasons
  and verdict distributions instead.
