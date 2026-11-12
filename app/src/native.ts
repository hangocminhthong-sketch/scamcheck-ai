/** Thin wrappers over Capacitor plugins. Every function is safe to call on the web. */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { track } from './analytics';

export const isNative = Capacitor.isNativePlatform();

/* ---------- F11: text shared from the Android share sheet ---------- */
interface ShareIntentPlugin {
  getSharedText(): Promise<{ text?: string }>;
}
const ShareIntent = registerPlugin<ShareIntentPlugin>('ShareIntent');

export async function consumeSharedText(): Promise<string | null> {
  if (!isNative) return null;
  try {
    const { text } = await ShareIntent.getSharedText();
    return text && text.trim() ? text : null;
  } catch {
    return null;
  }
}

export async function onAppResume(cb: () => void): Promise<void> {
  if (!isNative) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) cb();
  });
}

/* ---------- Clipboard ---------- */
export async function readClipboard(): Promise<string> {
  try {
    if (isNative) {
      const { Clipboard } = await import('@capacitor/clipboard');
      const { value } = await Clipboard.read();
      return value ?? '';
    }
    return (await navigator.clipboard?.readText?.()) ?? '';
  } catch {
    return '';
  }
}

/* ---------- Share ---------- */
export async function shareText(text: string): Promise<boolean> {
  try {
    if (isNative) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text, dialogTitle: 'ScamCheck AI' });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ text });
      return true;
    }
    await navigator.clipboard?.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ---------- F10: AdMob banner (Android only) ---------- */
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const BANNER_ID = (import.meta.env.VITE_ADMOB_BANNER_ID as string | undefined) || TEST_BANNER;
let adsReady: Promise<boolean> | null = null;

async function initAds(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
    await AdMob.initialize({ initializeForTesting: BANNER_ID === TEST_BANNER });
    const consent = await AdMob.requestConsentInfo();
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
    return true;
  } catch {
    return false;
  }
}

export async function showBanner(): Promise<void> {
  if (!isNative) return;
  adsReady ??= initAds();
  if (!(await adsReady)) return;
  try {
    const { AdMob, BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: BANNER_ID === TEST_BANNER,
    });
    track('ad_loaded', { placement: 'result_banner' });
  } catch {
    track('ad_failed', { placement: 'result_banner' });
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNative) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.removeBanner();
  } catch {
    /* not shown */
  }
}
