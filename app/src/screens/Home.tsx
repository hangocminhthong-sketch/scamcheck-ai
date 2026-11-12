import { useRef } from 'react';
import type { Route } from '../App';
import { track } from '../analytics';
import { EXAMPLES, ExampleId } from '../examples';
import type { Lang, T } from '../i18n';
import { prepareImage, PreparedImage } from '../image';
import { readClipboard } from '../native';
import { store } from '../storage';

interface Props {
  t: T;
  lang: Lang;
  text: string;
  setText: (v: string) => void;
  onExample: (v: string) => void;
  image: PreparedImage | null;
  setImage: (i: PreparedImage | null) => void;
  busy: boolean;
  error: string | null;
  onCheck: () => void;
  go: (r: Route) => void;
}

const EX: { id: ExampleId; key: 'ex_delivery' | 'ex_otp' | 'ex_job' | 'ex_normal' }[] = [
  { id: 'delivery', key: 'ex_delivery' },
  { id: 'otp', key: 'ex_otp' },
  { id: 'job', key: 'ex_job' },
  { id: 'normal', key: 'ex_normal' },
];

export function Home({ t, lang, text, setText, onExample, image, setImage, busy, error, onCheck, go }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canCheck = !busy && (text.replace(/\s/g, '').length >= 3 || !!image);

  if (busy) {
    return (
      <main className="screen center" data-testid="checking">
        <div className="spinner" aria-hidden />
        <h2>{t.t('checking')}</h2>
        <p className="muted">{t.t('checking_sub')}</p>
      </main>
    );
  }

  return (
    <main className="screen home" data-testid="home">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>🛡️</span> {t.t('app_name')}
        </div>
        <div className="actions">
          <button className="icon-btn" aria-label={t.t('history')} onClick={() => { track('history_opened'); go({ name: 'history' }); }} data-testid="nav-history">🕘</button>
          <button className="icon-btn" aria-label={t.t('settings')} onClick={() => go({ name: 'settings' })} data-testid="nav-settings">⚙️</button>
        </div>
      </header>

      <h1 data-testid="home-title">{t.t('home_title')}</h1>
      <p className="muted">{t.t('home_sub')}</p>

      <div className="input-card">
        <textarea
          data-testid="input"
          rows={6}
          value={text}
          maxLength={8000}
          placeholder={t.t('home_placeholder')}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="input-tools">
          <button
            className="chip"
            onClick={async () => {
              const v = await readClipboard();
              if (v) setText(v);
            }}
          >
            📋 {t.t('paste')}
          </button>
          <button className="chip" onClick={() => fileRef.current?.click()} data-testid="upload-btn">
            🖼️ {t.t('upload')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            data-testid="file-input"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setImage(await prepareImage(f));
            }}
          />
        </div>
        {image && (
          <div className="preview" data-testid="image-preview">
            <img src={image.previewUrl} alt="" />
            <button className="icon-btn small" aria-label={t.t('remove_image')} onClick={() => setImage(null)}>✕</button>
          </div>
        )}
      </div>

      {error && <div className="notice warn" role="alert" data-testid="error">{error}</div>}

      <button className="btn primary block big" disabled={!canCheck} onClick={onCheck} data-testid="check-btn">
        {t.t('check_now')}
      </button>

      <p className="label">{t.t('examples')}</p>
      <div className="chips">
        {EX.map((ex) => (
          <button
            key={ex.id}
            className="chip outline"
            data-testid={`example-${ex.id}`}
            onClick={() => {
              track('example_tapped', { example_id: ex.id });
              onExample(EXAMPLES[lang][ex.id]);
            }}
          >
            {t.t(ex.key)}
          </button>
        ))}
      </div>

      <p className="muted small footer-note" data-testid="ai-left">{t.t('ai_left', { n: store.aiLeftToday() })}</p>
    </main>
  );
}
