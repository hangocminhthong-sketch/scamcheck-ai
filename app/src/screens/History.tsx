import { useState } from 'react';
import type { Route } from '../App';
import { track } from '../analytics';
import type { Key, T } from '../i18n';
import { store } from '../storage';

function ago(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return new Date(ts).toLocaleDateString();
}

export function HistoryScreen({ t, go }: { t: T; go: (r: Route) => void }) {
  const [items, setItems] = useState(() => store.history());
  return (
    <main className="screen" data-testid="history">
      <header className="topbar">
        <button className="icon-btn" aria-label={t.t('back')} onClick={() => go({ name: 'home' })}>←</button>
        <div className="brand">{t.t('history')}</div>
        <span />
      </header>
      {items.length === 0 ? (
        <p className="muted center-text" data-testid="history-empty">{t.t('history_empty')}</p>
      ) : (
        <>
          <ul className="history-list">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  className="history-item"
                  data-testid="history-item"
                  onClick={() => {
                    track('history_item_opened', { verdict: it.result.verdict });
                    go({ name: 'result', item: it, fresh: false });
                  }}
                >
                  <span className={`dot ${it.result.verdict}`} />
                  <span className="hi-main">
                    <b>{t.t(`v_${it.result.verdict}` as Key)}</b>
                    <span className="muted small ellipsis">{it.preview || (it.hadImage ? `🖼️ ${t.t('screenshot')}` : t.t('message'))}</span>
                  </span>
                  <span className="muted small">{ago(it.ts)}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            className="btn danger block"
            data-testid="history-clear"
            onClick={() => {
              if (window.confirm(t.t('history_confirm'))) {
                track('history_cleared', { count: items.length });
                store.clearHistory();
                setItems([]);
              }
            }}
          >
            {t.t('history_clear')}
          </button>
        </>
      )}
    </main>
  );
}
