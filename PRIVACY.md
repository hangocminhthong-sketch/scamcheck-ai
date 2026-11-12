# ScamCheck AI — Privacy Policy

_Last updated: 12 November 2026_

ScamCheck AI ("the app") helps you check whether a message, link or screenshot is likely a scam.
This policy explains what data the app processes. The same text is shown in the app
(Settings → Privacy policy). Host this file (e.g. GitHub Pages) and use its URL in Google Play Console.

## 1. Content you choose to check
When you tap **Check now**, the text and/or screenshot you selected is sent over HTTPS to our
server (a Cloudflare Worker) and to our AI provider, Anthropic, to produce the result.
- We do not store the content after the result is returned.
- Under Anthropic's commercial API terms, the content is not used to train AI models.
- On-device checks run on your phone and do not send anything.

## 2. Data stored on your device
- Check history: verdict, risk score and the first 140 characters of the text. Images are never stored.
- Settings (language, onboarding done, daily check counter, Pro waitlist choice) and a random install ID
  used only for rate limiting.
You can delete history in the app at any time. Uninstalling the app removes all local data.

## 3. Analytics
We use Google Analytics for Firebase to count app events, for example "a check was completed with
verdict X in 1–3 seconds". Events **never** contain your messages, links, phone numbers or images.
Firebase collects device information and an app instance ID as described in
[Google's privacy policy](https://policies.google.com/privacy).

## 4. Advertising
The app shows a banner ad on the result screen through Google AdMob. AdMob may use your device's
advertising ID according to your settings and consent (a consent form is shown where the law requires it).
You can reset the ID or opt out of personalised ads in Android Settings → Google → Ads.

## 5. Data shared with third parties
| Recipient | Data | Purpose |
|---|---|---|
| Anthropic (AI provider) | Content you chose to check | Generate the verdict |
| Cloudflare (hosting) | Request metadata (IP address, install ID) | Deliver and rate-limit requests |
| Google Firebase | App usage events (no content) | Product analytics |
| Google AdMob | Advertising ID, device info | Show ads |

We do not sell personal data.

## 6. Children
The app is not directed at children under 13.

## 7. Contact
Questions or requests: the developer contact email shown on the app's Google Play page.

## Google Play Data safety summary
- **Collected:** App activity (app interactions), App info & performance, Device or other IDs
  (for analytics and ads). Messages/photos that users choose to check are *processed ephemerally*
  for app functionality and are not stored.
- **Shared:** Device IDs with AdMob for advertising.
- **Security:** Data is encrypted in transit. Users can delete local data in the app.
