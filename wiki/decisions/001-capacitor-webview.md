# ADR 001 — Capacitor (TypeScript UI in an Android shell) instead of native Kotlin

- Context: 3-day deadline, a team of students, and the build machine cannot reach Google's
  Android SDK servers. We need a real Android app for Google Play, plus fast automated UI tests.
- Decision: React + TypeScript UI built with Vite, packaged with Capacitor 8 into a native Android
  project (`app/android`). The APK is built by GitHub Actions (runners have the Android SDK) or
  locally in Android Studio.
- Consequences: one codebase for Android and the web demo; UI is testable headless in Chrome with
  Playwright (our harness "hands and eyes"); native features via Capacitor plugins (Firebase
  Analytics, AdMob, Share). Slightly bigger APK than native.
