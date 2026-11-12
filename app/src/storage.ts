/** Local-only storage (F7, F8, F10). Every access is guarded: storage can be unavailable. */
import type { CheckResult } from './engine/types';

export interface HistoryItem {
  id: string;
  ts: number;
  preview: string;
  hadImage: boolean;
  result: CheckResult;
}

const K = {
  history: 'sc.history.v1',
  onboarded: 'sc.onboarded',
  lang: 'sc.lang',
  quota: 'sc.quota',
  waitlist: 'sc.waitlist',
  reports: 'sc.reports',
  deviceId: 'sc.device',
};
export const HISTORY_MAX = 50;
export const DAILY_AI_LIMIT = 20;

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked — non-fatal */
  }
}
function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const store = {
  history(): HistoryItem[] {
    const h = parse<HistoryItem[]>(get(K.history), []);
    return Array.isArray(h) ? h : [];
  },
  addHistory(item: Omit<HistoryItem, 'id' | 'ts'>): HistoryItem {
    const full: HistoryItem = { ...item, preview: item.preview.slice(0, 140), id: Math.random().toString(36).slice(2), ts: Date.now() };
    set(K.history, JSON.stringify([full, ...store.history()].slice(0, HISTORY_MAX)));
    return full;
  },
  clearHistory(): void {
    set(K.history, '[]');
  },
  onboarded(): boolean {
    return get(K.onboarded) === '1';
  },
  setOnboarded(): void {
    set(K.onboarded, '1');
  },
  lang(): string | null {
    return get(K.lang);
  },
  setLang(l: string): void {
    set(K.lang, l);
  },
  /** AI checks used today (local day). */
  aiUsedToday(now = new Date()): number {
    const q = parse<{ day: string; n: number }>(get(K.quota), { day: '', n: 0 });
    return q.day === now.toDateString() ? q.n : 0;
  },
  incAiUsed(now = new Date()): void {
    set(K.quota, JSON.stringify({ day: now.toDateString(), n: store.aiUsedToday(now) + 1 }));
  },
  aiLeftToday(now = new Date()): number {
    return Math.max(0, DAILY_AI_LIMIT - store.aiUsedToday(now));
  },
  joinedWaitlist(): boolean {
    return get(K.waitlist) === '1';
  },
  setJoinedWaitlist(): void {
    set(K.waitlist, '1');
  },
  addReport(reason: string, verdict: string): void {
    const r = parse<unknown[]>(get(K.reports), []);
    set(K.reports, JSON.stringify([...r, { reason, verdict, ts: Date.now() }].slice(-100)));
  },
  deviceId(): string {
    let id = get(K.deviceId);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      set(K.deviceId, id);
    }
    return id;
  },
};
