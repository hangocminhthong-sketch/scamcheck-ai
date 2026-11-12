import type { T } from '../i18n';

export function Onboarding({ t, onDone }: { t: T; onDone: () => void }) {
  return (
    <main className="screen onboarding" data-testid="onboarding">
      <div className="hero-shield" aria-hidden>
        <svg viewBox="0 0 64 64" width="88" height="88">
          <path d="M32 4 8 13v17c0 15 10.4 27.4 24 30 13.6-2.6 24-15 24-30V13L32 4Z" fill="currentColor" opacity=".15" />
          <path d="M32 4 8 13v17c0 15 10.4 27.4 24 30 13.6-2.6 24-15 24-30V13L32 4Z" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="m21 32 8 8 15-16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1>{t.t('onb_title')}</h1>
      <ul className="onb-list">
        <li><span>📋</span>{t.t('onb_b1')}</li>
        <li><span>⚡</span>{t.t('onb_b2')}</li>
        <li><span>✅</span>{t.t('onb_b3')}</li>
      </ul>
      <p className="muted small">{t.t('onb_privacy')}</p>
      <button className="btn primary block" onClick={onDone} data-testid="onb-start">
        {t.t('onb_start')}
      </button>
    </main>
  );
}
