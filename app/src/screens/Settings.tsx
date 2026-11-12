import { useEffect, useState } from 'react';
import type { Route } from '../App';
import { track } from '../analytics';
import type { Lang, T } from '../i18n';
import { store } from '../storage';

export function ProCard({ t, placement }: { t: T; placement: 'settings' | 'limit' }) {
  const [joined, setJoined] = useState(store.joinedWaitlist());
  useEffect(() => {
    track('pro_cta_viewed', { placement });
  }, [placement]);
  return (
    <section className="card pro" data-testid="pro-card">
      <h2>✨ {t.t('pro_title')}</h2>
      <p>{t.t('pro_body')}</p>
      {joined ? (
        <p className="ok" data-testid="pro-joined">{t.t('pro_joined')}</p>
      ) : (
        <button
          className="btn primary"
          data-testid="pro-join"
          onClick={() => {
            store.setJoinedWaitlist();
            setJoined(true);
            track('pro_waitlist_joined', { placement });
          }}
        >
          {t.t('pro_cta')}
        </button>
      )}
    </section>
  );
}

export function SettingsScreen({ t, lang, setLang, go }: { t: T; lang: Lang; setLang: (l: Lang) => void; go: (r: Route) => void }) {
  return (
    <main className="screen" data-testid="settings">
      <header className="topbar">
        <button className="icon-btn" aria-label={t.t('back')} onClick={() => go({ name: 'home' })} data-testid="back">←</button>
        <div className="brand">{t.t('settings')}</div>
        <span />
      </header>

      <section className="card">
        <h2>{t.t('language')}</h2>
        <div className="segmented">
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} data-testid="lang-en">English</button>
          <button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')} data-testid="lang-vi">Tiếng Việt</button>
        </div>
      </section>

      <ProCard t={t} placement="settings" />

      <section className="card list">
        <button className="list-row" onClick={() => go({ name: 'history' })}>🕘 {t.t('history')}</button>
        <button className="list-row" onClick={() => go({ name: 'privacy' })} data-testid="privacy-link">🔒 {t.t('privacy')}</button>
        <div className="list-row muted">{t.t('version')} 1.0.0</div>
      </section>
    </main>
  );
}
