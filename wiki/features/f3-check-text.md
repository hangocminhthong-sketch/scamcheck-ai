# F3 — Check pasted text

## Behaviour
- Home screen has a large text box: "Paste the message, email or link".
- "Paste" button reads the clipboard (if permitted). "Try an example" chips fill a sample.
- "Check now" is disabled until there are ≥ 3 non-space characters.
- On tap: analyzing state (spinner + "Checking…"), then the Result screen.

## Done when
- [ ] Button disabled for empty input, enabled after typing.
- [ ] Typing a scam message and tapping Check shows a Result screen with a verdict.
- [ ] Tapping an example chip fills the box and fires `example_tapped`.
- [ ] `check_started` (input_type=text) and `check_completed` fire with no message content.
