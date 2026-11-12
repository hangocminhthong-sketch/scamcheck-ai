import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { checkMessage, ImageNeedsInternetError } from './api';
import { lengthBucket, latencyBucket, scoreBucket, setUserProperty, track } from './analytics';
import { detectLang, Lang, makeT } from './i18n';
import type { PreparedImage } from './image';
import { consumeSharedText, hideBanner, onAppResume } from './native';
import { HistoryItem, store } from './storage';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { ResultScreen } from './screens/Result';
import { HistoryScreen } from './screens/History';
import { SettingsScreen } from './screens/Settings';
import { PrivacyScreen } from './screens/Privacy';

export type Route =
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'result'; item: HistoryItem; fresh: boolean; notice?: 'limit' | 'offline' }
  | { name: 'history' }
  | { name: 'settings' }
  | { name: 'privacy' };

export type InputType = 'text' | 'image' | 'text_image' | 'shared' | 'example';

export default function App() {
  const [lang, setLangState] = useState<Lang>(() => detectLang(store.lang()));
  const tt = useMemo(() => makeT(lang), [lang]);
  const [route, setRoute] = useState<Route>(() => (store.onboarded() ? { name: 'home' } : { name: 'onboarding' }));
  const [text, setText] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exampleUsed = useRef(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    setUserProperty('app_language', lang);
  }, [lang]);

  // Leaving the Result screen removes the ad banner.
  useEffect(() => {
    if (route.name !== 'result') void hideBanner();
  }, [route.name]);

  const runCheck = useCallback(
    async (inputType: InputType, overrideText?: string) => {
      const msg = overrideText ?? text;
      if (busy || (!msg.trim() && !image)) return;
      setBusy(true);
      setError(null);
      const params = { input_type: inputType, text_length: lengthBucket(msg.trim().length), has_image: !!image };
      track('check_started', params);
      const t0 = performance.now();
      try {
        const { result, aiError } = await checkMessage({ text: msg, image: image ?? undefined, lang });
        const latency = performance.now() - t0;
        if (result.limitReached) track('daily_limit_reached', { checks_today: store.aiUsedToday() });
        track('check_completed', {
          ...params,
          verdict: result.verdict,
          risk_bucket: scoreBucket(result.riskScore),
          source: result.source,
          scam_type: result.scamType ?? 'none',
          flag_count: result.redFlags.length,
          latency: latencyBucket(latency),
        });
        if (aiError) track('check_failed', { stage: 'ai', reason: aiError.slice(0, 40), fallback: 'offline' });
        const item = store.addHistory({ preview: msg.trim() || '', hadImage: !!image, result });
        setRoute({ name: 'result', item, fresh: true, notice: result.limitReached ? 'limit' : aiError ? 'offline' : undefined });
        setText('');
        setImage(null);
      } catch (e) {
        const reason = e instanceof ImageNeedsInternetError ? 'image_needs_internet' : 'unknown';
        track('check_failed', { stage: 'check', reason, fallback: 'none' });
        setError(reason === 'image_needs_internet' ? tt.t('err_image_offline') : tt.t('offline_notice'));
      } finally {
        setBusy(false);
      }
    },
    [busy, image, lang, text, tt],
  );

  // F11: text shared from another app → pre-fill and auto-check.
  const pullShared = useCallback(async () => {
    const shared = await consumeSharedText();
    if (shared) {
      if (!store.onboarded()) store.setOnboarded();
      setText(shared);
      setRoute({ name: 'home' });
      void runCheck('shared', shared);
    }
  }, [runCheck]);

  useEffect(() => {
    void pullShared();
    void onAppResume(() => void pullShared());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (l: Lang) => {
    if (l === lang) return;
    store.setLang(l);
    setLangState(l);
    track('language_changed', { language: l });
  };

  const inputTypeFor = (): InputType => {
    if (exampleUsed.current) return 'example';
    if (image && text.trim()) return 'text_image';
    return image ? 'image' : 'text';
  };

  return (
    <div className="app">
      {route.name === 'onboarding' && (
        <Onboarding
          t={tt}
          onDone={() => {
            store.setOnboarded();
            track('onboarding_completed');
            setRoute({ name: 'home' });
          }}
        />
      )}
      {route.name === 'home' && (
        <Home
          t={tt}
          lang={lang}
          text={text}
          setText={(v) => {
            exampleUsed.current = false;
            setText(v);
          }}
          onExample={(v) => {
            exampleUsed.current = true;
            setText(v);
          }}
          image={image}
          setImage={setImage}
          busy={busy}
          error={error}
          onCheck={() => void runCheck(inputTypeFor()).then(() => (exampleUsed.current = false))}
          go={setRoute}
        />
      )}
      {route.name === 'result' && <ResultScreen t={tt} route={route} go={setRoute} />}
      {route.name === 'history' && <HistoryScreen t={tt} go={setRoute} />}
      {route.name === 'settings' && <SettingsScreen t={tt} lang={lang} setLang={setLang} go={setRoute} />}
      {route.name === 'privacy' && <PrivacyScreen t={tt} lang={lang} go={setRoute} />}
    </div>
  );
}
