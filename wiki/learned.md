# Learned (red tests → fixes)

Each entry: date — what failed — root cause — rule for next time.

- 2026-11-12 — Vietnamese "nhân viên ngân hàng Vietcombank … tài khoản của anh/chị đang bị tạm khoá"
  was not flagged as impersonation or account-lock urgency (seen in E2E screenshot 11, then pinned by a
  unit test). Cause: patterns only covered "tài khoản của bạn" and "ngân hàng nhà nước".
  Rule: VN patterns must allow any pronoun between noun and verb (`.{0,25}`), and impersonation must cover
  "nhân viên + organisation" and named banks.
- 2026-11-12 — Delivery-fee SMS with a short link was typed "Impersonation". Cause: type priority put
  impersonation before phishing. Rule: link + money request = phishing.
- 2026-11-12 — Static check counted the user-property table as events. Rule: parse only section 2 of
  TRACKING_PLAN.md.
