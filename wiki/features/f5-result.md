# F5 — Result screen

## Behaviour
- Big verdict card with colour + icon: Likely scam (red), Suspicious (amber), Low risk (green).
  Low risk copy: "No common scam signs found" — never "safe".
- Risk meter 0–100. One-sentence summary. Scam type tag (e.g. "Delivery fee phishing").
- "Why" list: red flags with the quoted evidence.
- "What to do now" list (from AI, or default per verdict when offline).
- Footer disclaimer: "ScamCheck can be wrong. When in doubt, contact the organisation using a number
  you already trust."
- Buttons: Share result (text summary, no original message), Check another.

## Done when
- [ ] Each verdict renders its colour/label; low risk never says "safe".
- [ ] Red flags show evidence text.
- [ ] Offline result shows default next steps and the offline label.
- [ ] Share uses navigator.share / Capacitor Share; fires `result_shared`.
