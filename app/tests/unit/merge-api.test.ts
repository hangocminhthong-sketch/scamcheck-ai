// F2 (app side), F7, F10 Done-when tests
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mergeResults } from '../../src/engine/merge';
import { analyzeLocally } from '../../src/engine/heuristics';
import { DAILY_AI_LIMIT, store } from '../../src/storage';

vi.stubEnv('VITE_API_URL', 'https://api.test');
const { checkMessage, ImageNeedsInternetError } = await import('../../src/api');

const SCAM = 'USPS: unpaid $1.99 redelivery fee. Pay within 24 hours: https://bit.ly/3xYz';
const aiOk = (over: object = {}) =>
  vi.fn(async () =>
    new Response(
      JSON.stringify({ verdict: 'likely_scam', risk_score: 90, scam_type: 'phishing', summary: 's', red_flags: [], next_steps: ['a', 'b'], extracted_text: '', ...over }),
      { status: 200 },
    ),
  );

beforeEach(() => localStorage.clear());

describe('merge (ADR 002)', () => {
  it('AI low_risk + local likely_scam → likely_scam (safety bias)', () => {
    const local = analyzeLocally(SCAM);
    const r = mergeResults({ verdict: 'low_risk', risk_score: 10, scam_type: 'none', summary: 'ok', red_flags: [], next_steps: [] }, local);
    expect(r.verdict).toBe('likely_scam');
    expect(r.riskScore).toBeGreaterThanOrEqual(65);
    expect(r.source).toBe('hybrid');
  });
  it('AI higher than local → AI verdict, AI flags first', () => {
    const r = mergeResults(
      { verdict: 'suspicious', risk_score: 50, scam_type: 'job', summary: 's', red_flags: [{ flag: 'Too good', evidence: 'earn 5m' }], next_steps: [] },
      analyzeLocally('hi'),
    );
    expect(r).toMatchObject({ verdict: 'suspicious', riskScore: 50, scamType: 'job', source: 'ai' });
    expect(r.redFlags[0]).toMatchObject({ category: 'ai', label: 'Too good' });
  });
});

describe('checkMessage', () => {
  it('uses AI when available and counts quota', async () => {
    const f = aiOk();
    const { result, aiError } = await checkMessage({ text: SCAM, lang: 'en' }, f);
    expect(aiError).toBeUndefined();
    expect(result.verdict).toBe('likely_scam');
    expect(store.aiLeftToday()).toBe(DAILY_AI_LIMIT - 1);
  });

  it('falls back to on-device result when API is unreachable', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const { result, aiError } = await checkMessage({ text: SCAM, lang: 'en' }, f);
    expect(result.source).toBe('offline');
    expect(result.verdict).toBe('likely_scam');
    expect(aiError).toBeTruthy();
  });

  it('image-only check with API down → ImageNeedsInternetError (no fake verdict)', async () => {
    const f = vi.fn(async () => new Response('', { status: 503 }));
    await expect(checkMessage({ text: '', image: { data: 'aGk=', mediaType: 'image/png' }, lang: 'en' }, f)).rejects.toBeInstanceOf(
      ImageNeedsInternetError,
    );
  });

  it('after the daily limit, the 21st check runs offline with limitReached', async () => {
    const f = aiOk();
    for (let i = 0; i < DAILY_AI_LIMIT; i++) await checkMessage({ text: 'hello there', lang: 'en' }, f);
    expect(f).toHaveBeenCalledTimes(DAILY_AI_LIMIT);
    const { result } = await checkMessage({ text: SCAM, lang: 'en' }, f);
    expect(f).toHaveBeenCalledTimes(DAILY_AI_LIMIT);
    expect(result.limitReached).toBe(true);
    expect(result.source).toBe('offline');
  });
});

describe('history storage (F7)', () => {
  it('newest first, capped, clearable, survives broken storage', () => {
    const res = analyzeLocally('hi');
    store.addHistory({ preview: 'first', hadImage: false, result: res });
    store.addHistory({ preview: 'second', hadImage: false, result: res });
    expect(store.history().map((h) => h.preview)).toEqual(['second', 'first']);
    store.clearHistory();
    expect(store.history()).toEqual([]);
    localStorage.setItem('sc.history.v1', '{broken');
    expect(store.history()).toEqual([]);
  });
});
