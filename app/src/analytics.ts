/**
 * F9 — single tracking entry point. Event list & rationale: /TRACKING_PLAN.md.
 * ADR 004: params must be enums, buckets or counts — never message content.
 */
import { Capacitor } from '@capacitor/core';

export type EventName =
  | 'onboarding_completed'
  | 'check_started'
  | 'check_completed'
  | 'check_failed'
  | 'example_tapped'
  | 'result_viewed'
  | 'result_feedback'
  | 'result_reported'
  | 'result_shared'
  | 'history_opened'
  | 'history_item_opened'
  | 'history_cleared'
  | 'daily_limit_reached'
  | 'pro_cta_viewed'
  | 'pro_waitlist_joined'
  | 'language_changed'
  | 'ad_loaded'
  | 'ad_failed';

export type Params = Record<string, string | number | boolean>;

declare global {
  interface Window {
    __scamcheckEvents?: { name: EventName; params: Params; ts: number }[];
  }
}

let firebase: typeof import('@capacitor-firebase/analytics') | null = null;
const firebaseEnabled = Capacitor.isNativePlatform() && import.meta.env.VITE_FIREBASE_ENABLED === 'true';

async function loadFirebase() {
  if (!firebaseEnabled || firebase) return firebase;
  try {
    firebase = await import('@capacitor-firebase/analytics');
  } catch {
    firebase = null;
  }
  return firebase;
}

export function track(name: EventName, params: Params = {}): void {
  const clean: Params = {};
  for (const [k, v] of Object.entries(params)) {
    clean[k] = typeof v === 'string' ? v.slice(0, 100) : v;
  }
  (window.__scamcheckEvents ??= []).push({ name, params: clean, ts: Date.now() });
  if (import.meta.env.DEV) console.debug('[track]', name, clean);
  if (firebaseEnabled) {
    void loadFirebase().then((fb) => fb?.FirebaseAnalytics.logEvent({ name, params: clean }).catch(() => undefined));
  }
}

export function setUserProperty(key: string, value: string): void {
  if (!firebaseEnabled) return;
  void loadFirebase().then((fb) => fb?.FirebaseAnalytics.setUserProperty({ key, value }).catch(() => undefined));
}

/* ---------- Buckets (keep cardinality low in Firebase) ---------- */
export function lengthBucket(n: number): string {
  if (n === 0) return '0';
  if (n < 50) return '1-49';
  if (n < 200) return '50-199';
  if (n < 1000) return '200-999';
  return '1000+';
}
export function latencyBucket(ms: number): string {
  if (ms < 1000) return '<1s';
  if (ms < 3000) return '1-3s';
  if (ms < 6000) return '3-6s';
  if (ms < 10000) return '6-10s';
  return '10s+';
}
export function scoreBucket(s: number): string {
  return `${Math.min(9, Math.floor(s / 10)) * 10}-${Math.min(9, Math.floor(s / 10)) * 10 + 9}`;
}
