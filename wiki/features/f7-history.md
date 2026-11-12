# F7 — History (on this device only)

## Behaviour
- Last 50 checks stored in localStorage: verdict, score, scam_type, summary, first 140 chars of text,
  timestamp. Images are never stored.
- History screen lists them newest first; tap → read-only Result.
- "Delete all history" with confirm.

## Done when
- [ ] After two checks, History shows two items newest first.
- [ ] Tapping an item opens its result.
- [ ] Delete all empties the list and fires `history_cleared`.
- [ ] Storage failure (private mode) does not crash the app.
