export type Verdict = 'likely_scam' | 'suspicious' | 'low_risk';

export type FlagCategory =
  | 'urgency'
  | 'otp_request'
  | 'money_request'
  | 'prize'
  | 'job'
  | 'investment'
  | 'impersonation'
  | 'credential'
  | 'secrecy'
  | 'remote_access'
  | 'link_shortener'
  | 'link_ip'
  | 'link_risky_tld'
  | 'link_punycode'
  | 'link_lookalike'
  | 'link_insecure'
  | 'ai';

export interface RedFlag {
  category: FlagCategory;
  /** Short human-readable label (already localised for rule flags via i18n key, raw text for AI flags). */
  label: string;
  /** Quote from the message that triggered the flag. */
  evidence?: string;
}

export interface CheckResult {
  verdict: Verdict;
  riskScore: number; // 0..100
  scamType: string | null;
  summary: string;
  redFlags: RedFlag[];
  nextSteps: string[];
  extractedText?: string;
  source: 'ai' | 'hybrid' | 'offline';
  /** Set when the AI was skipped because of the daily limit. */
  limitReached?: boolean;
}

export function verdictFromScore(score: number): Verdict {
  if (score >= 65) return 'likely_scam';
  if (score >= 30) return 'suspicious';
  return 'low_risk';
}

export const VERDICT_RANK: Record<Verdict, number> = { low_risk: 0, suspicious: 1, likely_scam: 2 };
