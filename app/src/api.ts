/** F2 + orchestration: run the on-device engine, call the AI when possible, merge (ADR 002). */
import { analyzeLocally } from './engine/heuristics';
import { AiResponse, mergeResults } from './engine/merge';
import type { CheckResult } from './engine/types';
import { store } from './storage';

export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
export const AI_TIMEOUT_MS = 20000;

export interface CheckInput {
  text: string;
  image?: { data: string; mediaType: string };
  lang: 'en' | 'vi';
}

export class ImageNeedsInternetError extends Error {
  constructor() {
    super('image_needs_internet');
  }
}

export async function requestAi(input: CheckInput, fetchImpl: typeof fetch = fetch): Promise<AiResponse> {
  if (!API_URL) throw new Error('no_api_url');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${API_URL}/v1/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-id': store.deviceId() },
      body: JSON.stringify({ text: input.text || undefined, image: input.image, lang: input.lang }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const data = (await res.json()) as AiResponse;
    if (!data || typeof data.risk_score !== 'number') throw new Error('bad_response');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export interface CheckOutcome {
  result: CheckResult;
  aiError?: string;
}

export async function checkMessage(input: CheckInput, fetchImpl: typeof fetch = fetch): Promise<CheckOutcome> {
  const local = analyzeLocally(input.text);
  const limitReached = store.aiLeftToday() <= 0;
  if (limitReached) {
    if (!input.text.trim()) throw new ImageNeedsInternetError();
    return { result: { ...local, limitReached: true } };
  }
  try {
    const ai = await requestAi(input, fetchImpl);
    store.incAiUsed();
    return { result: mergeResults(ai, local) };
  } catch (e) {
    const reason = e instanceof Error ? (e.name === 'AbortError' ? 'timeout' : e.message) : 'unknown';
    if (!input.text.trim()) throw new ImageNeedsInternetError();
    return { result: local, aiError: reason };
  }
}
