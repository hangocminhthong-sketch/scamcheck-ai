// F2 Done-when tests (Worker side) — wiki/features/f2-ai-analysis.md
import { describe, expect, it, vi } from 'vitest';
import { handle, MAX_TEXT, normaliseModelOutput } from '../src/index';

const env = { ANTHROPIC_API_KEY: 'sk-test-SECRET-123' };
const post = (body: unknown) =>
  new Request('https://api.example/v1/analyze', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

const claudeReply = (text: string) =>
  vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status: 200 }));

const GOOD = JSON.stringify({
  verdict: 'likely_scam',
  risk_score: 92,
  scam_type: 'phishing',
  summary: 'Fake delivery fee with a shortened link.',
  red_flags: [{ flag: 'Asks for a fee', evidence: 'unpaid $1.99 redelivery fee' }],
  next_steps: ["Don't click the link", 'Delete the message'],
  extracted_text: '',
});

describe('Worker /v1/analyze', () => {
  it('400 for empty input, too-long text, wrong image type', async () => {
    const f = claudeReply(GOOD);
    expect((await handle(post({ text: '  ' }), env, f)).status).toBe(400);
    expect((await handle(post({ text: 'x'.repeat(MAX_TEXT + 1) }), env, f)).status).toBe(400);
    const r = await handle(post({ image: { data: 'aGVsbG8=', mediaType: 'image/gif' } }), env, f);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'unsupported_image_type' });
    expect(f).not.toHaveBeenCalled();
  });

  it('returns normalised JSON for valid model output', async () => {
    const f = claudeReply(GOOD);
    const r = await handle(post({ text: 'USPS unpaid fee bit.ly/x', lang: 'en' }), env, f);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body).toMatchObject({ verdict: 'likely_scam', risk_score: 92, scam_type: 'phishing' });
    // Key is sent upstream in the header, never echoed back.
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)['x-api-key']).toBe(env.ANTHROPIC_API_KEY);
    expect(JSON.stringify(body)).not.toContain('SECRET');
    // Untrusted message is wrapped in <message> tags.
    expect(String(init.body)).toContain('<message>');
    // claude-haiku-5-5 rejects `temperature` ("deprecated for this model") — never send it.
    expect(JSON.parse(String(init.body))).not.toHaveProperty('temperature');
  });

  it('accepts JSON wrapped in ```json fences', async () => {
    const r = await handle(post({ text: 'hello there friend' }), env, claudeReply('```json\n' + GOOD + '\n```'));
    expect(r.status).toBe(200);
  });

  it('502 bad_model_output for non-JSON', async () => {
    const r = await handle(post({ text: 'hello there friend' }), env, claudeReply('I think this is a scam.'));
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ error: 'bad_model_output' });
  });

  it('never forwards upstream error bodies or the key', async () => {
    const f = vi.fn(async () => new Response('{"error":{"message":"invalid x-api-key sk-test-SECRET-123"}}', { status: 401 }));
    const r = await handle(post({ text: 'hello there friend' }), env, f);
    expect(r.status).toBe(502);
    expect(await r.text()).not.toContain('SECRET');
  });

  it('clamps score and derives verdict when missing', () => {
    expect(normaliseModelOutput('{"risk_score": 150, "red_flags": "nope"}')).toMatchObject({ verdict: 'likely_scam', risk_score: 100, red_flags: [] });
    expect(normaliseModelOutput('{"verdict":"low_risk"}')).toMatchObject({ risk_score: 10, scam_type: 'other' });
    expect(normaliseModelOutput('{"foo":1}')).toBeNull();
  });

  it('image request sends an image block; CORS + health work', async () => {
    const f = claudeReply(GOOD);
    await handle(post({ image: { data: 'aGVsbG8=', mediaType: 'image/png' } }), env, f);
    const sent = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(sent.messages[0].content[0].type).toBe('image');
    const opt = await handle(new Request('https://api.example/v1/analyze', { method: 'OPTIONS' }), env, f);
    expect(opt.headers.get('access-control-allow-origin')).toBe('*');
    expect((await handle(new Request('https://api.example/health'), env, f)).status).toBe(200);
  });

  it('500 not_configured without key', async () => {
    expect((await handle(post({ text: 'hello there' }), { ANTHROPIC_API_KEY: '' }, claudeReply(GOOD))).status).toBe(500);
  });
});
