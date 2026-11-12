# Overview — ScamCheck AI

**One line:** Paste a message, share a link or upload a screenshot. In about 5 seconds, ScamCheck AI says
how risky it is, why, and what to do next.

## Target users (persona)
**"Chị Lan", 38, office worker, Hà Nội / "Maria", 45, Manila / "Dave", 62, Ohio**
- Gets 5–20 unsolicited messages a week: delivery notices, bank alerts, job offers, prize claims,
  marketplace buyers, "police" calls followed by Zalo/WhatsApp messages.
- Job to be done: *"When I get a message that asks me to click, pay or share a code, help me decide
  quickly whether it is safe, so I don't lose money or look foolish asking someone."*
- Current alternatives: ask a child/friend, Google the number, ignore everything (and miss real
  messages), or guess. 73% feel confident they can spot scams; 23% still lose money (GASA 2025).
- Secondary: adult children protecting parents (share the app / result with them).

## Value proposition
- Gain: instant, plain-language verdict with evidence (red flags quoted from the message).
- Pain reliever: clear next steps ("Don't click. Call your bank on the number on your card.").
- Works offline with on-device checks; AI adds depth when online. EN + VI.

## Business model
- Free with ads (banner on the result screen, AdMob).
- Free daily AI checks (20/day); beyond that, on-device checks only.
- ScamCheck Pro (planned, Round 2): unlimited AI checks, deep link scan, family alerts, no ads.
  v1 ships a **fake-door waitlist** to measure demand before building billing (MVP "fake button").
- Cost control: Claude Haiku via a Worker, ~1 call per check, capped output tokens.

## Launch channel
Google Play (published by Apero). The same build runs on the open web as a PWA for demos.

## Non-goals (v1)
- No call blocking, no SMS reading permissions (policy-heavy), no accounts, no cloud history.
