# F1 — On-device scam checks (heuristic engine)

Runs instantly and offline on the phone. It gives a result even with no internet, and acts as a
safety net under the AI (ADR 002).

## Behaviour
- Input: message text (any language; patterns for EN + VI).
- Detects signals, each with a weight (0–1) and a category:
  urgency/threat · request for OTP/code · request for money/gift cards/crypto · prize/too-good ·
  job/easy-money · investment/guaranteed return · impersonation (bank, police, tax, delivery, utility,
  VNeID/social insurance) · credential/login request · secrecy · remote-access/APK install ·
  links: shortener, raw IP, risky TLD, punycode, brand look-alike domain, plain http.
- Score = 1 − Π(1 − wᵢ) (noisy-OR), 0–100.
- Verdict: score ≥ 65 → `likely_scam`; 30–64 → `suspicious`; < 30 → `low_risk`.
- Each signal returns the matched evidence (a short quote) to show as a red flag.

## Done when
- [ ] A classic EN delivery-fee phishing SMS with a shortened link scores `likely_scam`.
- [ ] A VN "công an / chuyển tiền / bí mật" message scores `likely_scam`.
- [ ] A VN fake prize ("trúng thưởng ... phí nhận thưởng") scores at least `suspicious`.
- [ ] A normal personal message ("See you at 7pm at the cafe") scores `low_risk` with 0 flags.
- [ ] A legit bank OTP notice that says "do not share this code" is NOT `likely_scam`.
- [ ] `paypal.com.secure-login.xyz` is flagged as look-alike + risky TLD; `https://www.paypal.com` is not.
- [ ] Empty input returns `low_risk`, score 0, no crash.
- [ ] Runs in < 50 ms for a 5,000-character message.
