# F11 — Receive text from the Android share sheet

## Behaviour
- AndroidManifest has an intent-filter for `ACTION_SEND` with `text/plain`.
- `MainActivity` stores the shared text; a tiny Capacitor plugin `ShareIntent.getSharedText()` returns
  it once. The app calls it on start and on `appStateChange` (resume) and pre-fills Home, then
  auto-runs the check → `check_started {input_type: shared}`.

## Done when
- [ ] Manifest contains the SEND intent-filter (static check in verify).
- [ ] On web, the plugin call is skipped without error.
- [ ] (Manual on device) Share a message from Messages/Zalo → ScamCheck opens with the text checked.
