/** ADR 002 — merge AI and on-device results; show the higher risk. */
import { CheckResult, RedFlag, VERDICT_RANK, Verdict, verdictFromScore } from './types';

export interface AiResponse {
  verdict: Verdict;
  risk_score: number;
  scam_type: string;
  summary: string;
  red_flags: { flag: string; evidence?: string }[];
  next_steps: string[];
  extracted_text?: string;
}

export function mergeResults(ai: AiResponse, local: CheckResult): CheckResult {
  const aiVerdict: Verdict = ai.verdict in VERDICT_RANK ? ai.verdict : verdictFromScore(ai.risk_score);
  const useLocal = VERDICT_RANK[local.verdict] > VERDICT_RANK[aiVerdict];
  const verdict = useLocal ? local.verdict : aiVerdict;
  // Keep the score consistent with the displayed verdict.
  let riskScore = Math.max(ai.risk_score, local.riskScore);
  if (verdictFromScore(riskScore) !== verdict) riskScore = useLocal ? local.riskScore : ai.risk_score;

  const aiFlags: RedFlag[] = ai.red_flags.map((f) => ({ category: 'ai', label: f.flag, evidence: f.evidence || undefined }));
  const aiEvidence = aiFlags.map((f) => (f.evidence ?? '').toLowerCase());
  // Add local flags whose evidence the AI did not already quote.
  const extra = local.redFlags.filter((lf) => {
    const ev = (lf.evidence ?? '').toLowerCase();
    return !ev || !aiEvidence.some((a) => a && (a.includes(ev) || ev.includes(a)));
  });

  return {
    verdict,
    riskScore,
    scamType: ai.scam_type && ai.scam_type !== 'none' && ai.scam_type !== 'other' ? ai.scam_type : local.scamType,
    summary: ai.summary,
    redFlags: [...aiFlags, ...extra].slice(0, 8),
    nextSteps: ai.next_steps,
    extractedText: ai.extracted_text || undefined,
    source: extra.length > 0 || useLocal ? 'hybrid' : 'ai',
  };
}
