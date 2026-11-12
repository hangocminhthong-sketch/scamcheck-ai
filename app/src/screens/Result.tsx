import { useEffect, useState } from 'react';
import type { Route } from '../App';
import { track } from '../analytics';
import type { Key, T } from '../i18n';
import { shareText, showBanner } from '../native';
import { DAILY_AI_LIMIT, store } from '../storage';
import { ProCard } from './Settings';

type ResultRoute = Extract<Route, { name: 'result' }>;

const ICON = { likely_scam: '⛔', suspicious: '⚠️', low_risk: '✅' } as const;

export function ResultScreen({ t, route, go }: { t: T; route: ResultRoute; go: (r: Route) => void }) {
  const { result } = route.item;
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    track('result_viewed', { verdict: result.verdict, source: result.source, from: route.fresh ? 'check' : 'history' });
    void showBanner();
  }, [result.verdict, result.source, route.fresh]);

  const verdictLabel = t.t(`v_${result.verdict}` as Key);
  const steps = result.nextSteps.length ? result.nextSteps : t.list(`steps_${result.verdict}`);
  const typeKey = `t_${result.scamType}`;
  const typeLabel = result.scamType && t.has(typeKey) ? t.t(typeKey) : null;

  const flagLabel = (category: string, label: string) => {
    const k = `flag_${category}`;
    return category !== 'ai' && t.has(k) ? t.t(k) : label;
  };

  return (
    <main className="screen result" data-testid="result">
      <header className="topbar">
        <button className="icon-btn" aria-label={t.t('back')} onClick={() => go({ name: 'home' })} data-testid="back">←</button>
        <div className="brand">{t.t('app_name')}</div>
        <span />
      </header>

      {route.notice === 'limit' && (
        <div className="notice info" data-testid="limit-notice">{t.t('limit_notice', { n: DAILY_AI_LIMIT })}</div>
      )}
      {route.notice === 'offline' && <div className="notice info" data-testid="offline-notice">{t.t('offline_notice')}</div>}

      <section className={`verdict ${result.verdict}`} data-testid="verdict" data-verdict={result.verdict}>
        <div className="verdict-top">
          <span className="verdict-icon" aria-hidden>{ICON[result.verdict]}</span>
          <div>
            <h1>{verdictLabel}</h1>
            {result.verdict === 'low_risk' && <p className="sub">{t.t('v_low_risk_sub')}</p>}
          </div>
        </div>
        <div className="meter" aria-label={`${t.t('risk')} ${result.riskScore}/100`}>
          <div className="meter-fill" style={{ width: `${Math.max(4, result.riskScore)}%` }} />
        </div>
        <div className="verdict-meta">
          <span>{t.t('risk')}: <b data-testid="score">{result.riskScore}</b>/100</span>
          {typeLabel && <span className="tag">{typeLabel}</span>}
        </div>
        <p className="source" data-testid="source">{t.t(`src_${result.source}` as Key)}</p>
      </section>

      {result.summary && <p className="summary" data-testid="summary">{result.summary}</p>}

      <section className="card">
        <h2>{t.t('why')}</h2>
        {result.redFlags.length === 0 ? (
          <p className="muted">{t.t('no_flags')}</p>
        ) : (
          <ul className="flags" data-testid="flags">
            {result.redFlags.map((f, i) => (
              <li key={i}>
                <b>{flagLabel(f.category, f.label)}</b>
                {f.evidence && <q>{f.evidence}</q>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>{t.t('todo')}</h2>
        <ol className="steps" data-testid="steps">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      {result.extractedText && (
        <details className="card" data-testid="extracted">
          <summary>{t.t('text_read')}</summary>
          <p className="pre">{result.extractedText}</p>
        </details>
      )}

      <div className="row gap">
        <button
          className="btn secondary grow"
          data-testid="share-btn"
          onClick={async () => {
            const ok = await shareText(
              t.t('share_text', { verdict: verdictLabel, score: result.riskScore, summary: result.summary || steps[0] }) +
                ' — ScamCheck AI',
            );
            if (ok) track('result_shared', { verdict: result.verdict });
          }}
        >
          ↗ {t.t('share')}
        </button>
        <button className="btn primary grow" onClick={() => go({ name: 'home' })} data-testid="check-another">
          {t.t('check_another')}
        </button>
      </div>

      <div className="feedback" data-testid="feedback">
        {feedback ? (
          <span className="muted">{t.t('thanks_feedback')}</span>
        ) : (
          <>
            <span>{t.t('helpful')}</span>
            {(['yes', 'no'] as const).map((v) => (
              <button
                key={v}
                className="icon-btn"
                data-testid={`fb-${v}`}
                aria-label={v}
                onClick={() => {
                  setFeedback(v);
                  track('result_feedback', { helpful: v, verdict: result.verdict, source: result.source });
                }}
              >
                {v === 'yes' ? '👍' : '👎'}
              </button>
            ))}
          </>
        )}
      </div>

      {reported ? (
        <p className="muted small center-text" data-testid="report-thanks">{t.t('report_thanks')}</p>
      ) : (
        <button className="link-btn" onClick={() => setReportOpen(true)} data-testid="report-btn">
          {t.t('report')}
        </button>
      )}

      {route.notice === 'limit' && !store.joinedWaitlist() && <ProCard t={t} placement="limit" />}

      <p className="disclaimer">{t.t('disclaimer')}</p>
      <div className="ad-spacer" />

      {reportOpen && (
        <ReportSheet
          t={t}
          onClose={() => setReportOpen(false)}
          onSend={(reason) => {
            store.addReport(reason, result.verdict);
            track('result_reported', { reason, verdict: result.verdict, source: result.source });
            setReportOpen(false);
            setReported(true);
          }}
        />
      )}
    </main>
  );
}

function ReportSheet({ t, onClose, onSend }: { t: T; onClose: () => void; onSend: (reason: string) => void }) {
  const [reason, setReason] = useState('wrong_verdict');
  const opts: [string, Key][] = [
    ['wrong_verdict', 'report_wrong'],
    ['offensive', 'report_offensive'],
    ['other', 'report_other'],
  ];
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} data-testid="report-sheet">
        <h2>{t.t('report_title')}</h2>
        {opts.map(([v, k]) => (
          <label key={v} className="radio">
            <input type="radio" name="reason" checked={reason === v} onChange={() => setReason(v)} /> {t.t(k)}
          </label>
        ))}
        <div className="row gap">
          <button className="btn secondary grow" onClick={onClose}>{t.t('cancel')}</button>
          <button className="btn primary grow" onClick={() => onSend(reason)} data-testid="report-send">{t.t('report_send')}</button>
        </div>
      </div>
    </div>
  );
}
