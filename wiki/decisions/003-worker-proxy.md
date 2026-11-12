# ADR 003 — Claude is called through a Cloudflare Worker

- Context: an API key inside an APK can be extracted in minutes.
- Decision: a ~150-line Cloudflare Worker (`worker/`) holds `ANTHROPIC_API_KEY` as a secret, validates
  input, calls the Messages API, validates output, and returns normalized JSON. Free tier covers
  100k requests/day. Model is configurable (`MODEL`, default `claude-haiku-5-5`).
- Consequences: the key is safe and the prompt can change without an app update. Apero can redeploy
  the Worker under its own account at publishing time.
