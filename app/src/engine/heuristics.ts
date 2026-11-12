/**
 * F1 — On-device scam checks. Pure function, no I/O. See wiki/features/f1-onscreen-engine.md.
 * Patterns are written against a normalised copy of the text: lower-case, Vietnamese diacritics
 * removed (đ → d), so "chuyển khoản" and "chuyen khoan" both match.
 */
import { CheckResult, FlagCategory, RedFlag, verdictFromScore } from './types';

interface Rule {
  category: FlagCategory;
  weight: number;
  patterns: RegExp[];
  /** If true, a match preceded by "do not / don't / never / không" is ignored. */
  negatable?: boolean;
}

const RULES: Rule[] = [
  {
    category: 'urgency',
    weight: 0.25,
    patterns: [
      /\b(urgent(ly)?|immediately|act now|right away|within (24|48|12|2) ?(hours|hrs|h)\b|final (notice|warning)|last chance|expires? (today|soon|tonight)|will be (suspended|locked|blocked|closed|terminated|deactivated|disabled)|(account|card) (is|has been|was) (suspended|locked|blocked|limited|restricted)|arrest warrant|legal action)/,
      /(khan cap|ngay lap tuc|trong vong \d+ ?(gio|h|phut|ngay)|se bi (khoa|dinh chi|vo hieu|phat|truy to|cat)|tai khoan .{0,25}(da |dang )?bi (tam )?(khoa|dinh chi|phong toa|vo hieu)|han chot|lan cuoi|vu an|rua tien|lenh bat|truy to|tam giu|phong toa)/,
    ],
  },
  {
    category: 'otp_request',
    weight: 0.6,
    negatable: true,
    patterns: [
      /(send|share|give|provide|tell|read( out)?|forward|reply with|text)( me| us| it)?( the| your| this| that)? .{0,20}(otp|verification code|security code|one[- ]time (pass)?code|\d[- ]digit code|login code)/,
      /(gui|cung cap|doc|chia se|bao|nhan tin)( lai)?( cho| giup)?( (toi|em|anh|chi|chung toi|ben minh|nhan vien))? .{0,20}(ma otp|otp|ma xac (thuc|nhan)|ma bao mat)/,
    ],
  },
  {
    category: 'money_request',
    weight: 0.35,
    patterns: [
      /((wire|transfer|send) (the |your |us )?(money|funds|payment|\$|usd|deposit)|gift ?cards?|itunes card|google play card|steam card|bitcoin|\bbtc\b|usdt|crypto(currency)? wallet|pay (a |the |your )?(small |one[- ]time )?(fee|deposit|customs|delivery|shipping|tax)|(processing|release|redelivery|delivery|clearance|unlock|activation) fee|unpaid .{0,20}fee)/,
      /(chuyen khoan|chuyen tien|nap tien|dong phi|phi (nhan|giao|van chuyen|xu ly|thu tuc|ho so|bao hiem|kich hoat|mo khoa)|tien coc|dat coc|thanh toan (phi|ngay)|so tai khoan)/,
    ],
  },
  {
    category: 'prize',
    weight: 0.35,
    patterns: [
      /(you('ve| have)? (just )?won|you are (a |our )?winner|congratulations|claim (your )?(prize|reward|gift|refund)|lottery|jackpot|free (iphone|gift|money|vacation)|selected to receive|lucky draw|cash prize)/,
      /(trung thuong|chuc mung (ban|quy khach)|nhan thuong|qua tang|giai thuong|quay so|tri an khach hang|nhan qua|hoan tien)/,
    ],
  },
  {
    category: 'job',
    weight: 0.3,
    patterns: [
      /(work from home.{0,40}(earn|\$|per day)|easy money|earn \$?\d[\d,.]*.{0,15}(per|a|\/) ?(day|hour|week)|(daily|instant) (pay|commission)|like (and|&) (subscribe|follow).{0,30}(earn|pay|\$)|no experience (needed|required).{0,40}(earn|\$|pay)|(join|contact).{0,20}(telegram|whatsapp).{0,30}(job|task|earn))/,
      /(viec nhe luong cao|lam tai nha.{0,25}(thu nhap|luong|kiem)|cong tac vien|hoa hong \d+|thu nhap \d[\d.,]*.{0,10}(\/ ?ngay|mot ngay|moi ngay)|tuyen (dung )?ctv|lam nhiem vu|don hang ao)/,
    ],
  },
  {
    category: 'investment',
    weight: 0.35,
    patterns: [
      /(guaranteed (return|profit|income)|double your (money|investment)|\d+ ?% (daily|weekly|per day|per week|a day)|risk[- ]free (investment|profit|return)|trading (signal|group|mentor)|forex|binary option|crypto (investment|mining) platform)/,
      /(loi nhuan (dam bao|cao|\d+ ?%)|cam ket loi nhuan|dau tu (sinh loi|chac chan|0 rui ro)|san (giao dich|dau tu|ngoai hoi)|nhan doi so tien|x2 tai khoan)/,
    ],
  },
  {
    category: 'impersonation',
    weight: 0.2,
    patterns: [
      /\b(irs|hmrc|tax (office|department|refund|authority)|customs|police|fbi|interpol|court|sheriff|social security|usps|fedex|dhl|royal mail|amazon security|apple id|paypal|netflix|bank security|fraud department|microsoft support)\b/,
      /(nhan vien (ngan hang|tong dai|cham soc khach hang|buu dien|dien luc)|tu ngan hang|ngan hang (vietcombank|techcombank|bidv|vietinbank|agribank|mb|tpbank|vpbank|acb|sacombank)|cong an|vien kiem sat|toa an|co quan dieu tra|cuc thue|chi cuc thue|bao hiem xa hoi|bhxh|vneid|dinh danh dien tu|dien luc|\bevn\b|vnpost|buu dien|giao hang tiet kiem|viettel post|ngan hang nha nuoc)/,
    ],
  },
  {
    category: 'credential',
    weight: 0.35,
    negatable: true,
    patterns: [
      /(verify your (account|identity|information|details)|confirm your (account|identity|password|details|information)|update your (payment|billing|account|bank) ?(info|information|details|method)?|log ?in (here|now|to (verify|confirm|restore|unlock))|enter your (password|pin|card)|reset your password (here|now|immediately)|unusual (sign[- ]in|login|activity))/,
      /(xac minh tai khoan|xac thuc tai khoan|cap nhat thong tin|dang nhap (tai|vao|de|ngay)|nhap (mat khau|ma pin|so the)|kich hoat lai|dong bo (du lieu|thong tin)|chuan hoa (thong tin|sim)|xac thuc (sinh trac|danh tinh))/,
    ],
  },
  {
    category: 'secrecy',
    weight: 0.35,
    patterns: [
      /(don'?t tell (anyone|anybody|your)|keep (this|it) (a )?(secret|confidential|between us)|do not (tell|inform) (anyone|your (family|bank)))/,
      /(khong (duoc )?(noi|tiet lo|chia se|thong bao) (voi |cho )?(ai|nguoi than|gia dinh|ngan hang)|bi mat|giu kin)/,
    ],
  },
  {
    category: 'remote_access',
    weight: 0.55,
    patterns: [
      /(anydesk|teamviewer|rustdesk|quicksupport|screen ?share|install (this|the|our) app|download (the|this|our) app.{0,30}(verify|update|support|refund)|\.apk\b)/,
      /(cai dat (ung dung|app|phan mem)|tai (ung dung|app|phan mem).{0,30}(xac thuc|cap nhat|ho tro|dich vu cong|hoan tien))/,
    ],
  },
];

const NEGATION = /(do not|don't|dont|never|not to|khong (duoc )?|dung |tuyet doi khong|khong bao gio)\s*$/;

const SHORTENERS = new Set([
  'bit.ly', 'bitly.com', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'v.gd', 'cutt.ly', 'rb.gy', 's.id',
  'ow.ly', 'tiny.cc', 'shorturl.at', 'rebrand.ly', 't.ly', 'short.io', 'tinyurl.vn', 'u.to', 'buff.ly',
]);
const RISKY_TLDS = new Set([
  'xyz', 'top', 'click', 'icu', 'buzz', 'cyou', 'sbs', 'vip', 'zip', 'tk', 'ml', 'ga', 'cf', 'gq',
  'live', 'shop', 'online', 'site', 'rest', 'cfd', 'monster', 'lol', 'mov', 'bond', 'quest', 'cc', 'win',
]);
const BRANDS = [
  'paypal', 'apple', 'icloud', 'amazon', 'netflix', 'microsoft', 'google', 'facebook', 'instagram',
  'whatsapp', 'dhl', 'fedex', 'usps', 'vietcombank', 'techcombank', 'bidv', 'vietinbank', 'agribank',
  'mbbank', 'tpbank', 'vpbank', 'sacombank', 'momo', 'zalopay', 'shopee', 'lazada', 'tiki', 'vneid',
  'viettel', 'vnpost', 'chase', 'wellsfargo', 'bankofamerica', 'hsbc', 'citibank', 'grab', 'binance',
];
const SECOND_LEVEL = new Set(['com', 'net', 'org', 'gov', 'edu', 'co', 'ac']);

const URL_RE =
  /\b((?:https?:\/\/|www\.)[^\s<>"'()]+|(?:[a-z0-9-]+\.)+(?:com|net|org|xyz|top|click|link|info|vn|io|co|me|live|shop|online|site|icu|buzz|cyou|sbs|vip|zip|app|ly|gl|gd|cc|tk|ml|ga|cf|gq|id|at|to|win|bond|cfd|rest|lol|monster|quest|mov)(?:\/[^\s<>"']*)?)/gi;

/** Lower-case + strip diacritics, keeping a map from normalised index → original index. */
export function normalise(text: string): { norm: string; map: number[] } {
  let norm = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === 'đ' || c === 'Đ') c = 'd';
    const n = c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    for (const ch of n) {
      norm += ch;
      map.push(i);
    }
  }
  map.push(text.length);
  return { norm, map };
}

function evidenceFrom(text: string, start: number, end: number): string {
  // Expand to word boundaries, cap length.
  let s = start;
  let e = end;
  while (s > 0 && /\S/.test(text[s - 1]) && start - s < 15) s--;
  while (e < text.length && /\S/.test(text[e]) && e - end < 15) e++;
  let q = text.slice(s, e).trim().replace(/\s+/g, ' ');
  if (q.length > 90) q = q.slice(0, 87) + '…';
  return q;
}

export function extractHosts(text: string): { raw: string; host: string; insecure: boolean }[] {
  const out: { raw: string; host: string; insecure: boolean }[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const raw = m[1].replace(/[.,;:!?)\]]+$/, '');
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
    try {
      const host = new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
      if (host.includes('.')) out.push({ raw, host, insecure: /^http:\/\//i.test(raw) });
    } catch {
      /* ignore unparsable */
    }
  }
  return out;
}

function registrable(host: string): string {
  const parts = host.split('.');
  if (parts.length >= 3 && SECOND_LEVEL.has(parts[parts.length - 2]) && parts[parts.length - 1].length === 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function deLeet(s: string): string {
  return s.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/5/g, 's').replace(/4/g, 'a');
}

export function linkFlags(text: string): RedFlag[] {
  const flags: RedFlag[] = [];
  for (const { raw, host, insecure } of extractHosts(text)) {
    const reg = registrable(host);
    const tld = host.split('.').pop() ?? '';
    if (SHORTENERS.has(host)) flags.push({ category: 'link_shortener', label: 'Shortened link hides the real address', evidence: raw });
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) flags.push({ category: 'link_ip', label: 'Link uses a raw IP address', evidence: raw });
    if (RISKY_TLDS.has(tld)) flags.push({ category: 'link_risky_tld', label: `Unusual domain ending ".${tld}"`, evidence: raw });
    if (host.includes('xn--')) flags.push({ category: 'link_punycode', label: 'Link uses look-alike characters', evidence: raw });
    const tokens = host.split(/[.-]/).map(deLeet); // "paypa1" → "paypal"
    const brand = BRANDS.find((b) => tokens.some((tk) => tk === b || (b.length >= 5 && tk.startsWith(b))));
    if (brand && reg.split('.')[0] !== brand) {
      flags.push({ category: 'link_lookalike', label: `Pretends to be ${brand} but the real domain is ${reg}`, evidence: raw });
    }
    if (insecure && !SHORTENERS.has(host)) flags.push({ category: 'link_insecure', label: 'Link is not secure (http)', evidence: raw });
  }
  return flags;
}

const LINK_WEIGHTS: Partial<Record<FlagCategory, number>> = {
  link_shortener: 0.3,
  link_ip: 0.45,
  link_risky_tld: 0.3,
  link_punycode: 0.45,
  link_lookalike: 0.55,
  link_insecure: 0.15,
};

export function analyzeLocally(input: string): CheckResult {
  const text = (input ?? '').slice(0, 20000);
  if (!text.trim()) {
    return { verdict: 'low_risk', riskScore: 0, scamType: null, summary: '', redFlags: [], nextSteps: [], source: 'offline' };
  }
  const { norm, map } = normalise(text);
  const best = new Map<FlagCategory, { weight: number; flag: RedFlag }>();

  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const g = new RegExp(re.source, 'g');
      let m: RegExpExecArray | null;
      let found = false;
      while ((m = g.exec(norm)) !== null) {
        if (m[0].length === 0) {
          g.lastIndex++;
          continue;
        }
        if (rule.negatable && NEGATION.test(norm.slice(Math.max(0, m.index - 30), m.index))) continue;
        const start = map[m.index];
        const end = map[m.index + m[0].length] ?? text.length;
        best.set(rule.category, { weight: rule.weight, flag: { category: rule.category, label: rule.category, evidence: evidenceFrom(text, start, end) } });
        found = true;
        break;
      }
      if (found) break;
    }
  }

  for (const f of linkFlags(text)) {
    const w = LINK_WEIGHTS[f.category] ?? 0.2;
    const prev = best.get(f.category);
    if (!prev || prev.weight < w) best.set(f.category, { weight: w, flag: f });
  }

  let keep = 1;
  for (const { weight } of best.values()) keep *= 1 - weight;
  const riskScore = Math.round((1 - keep) * 100);
  const redFlags = [...best.values()].sort((a, b) => b.weight - a.weight).map((v) => v.flag);

  return {
    verdict: verdictFromScore(riskScore),
    riskScore,
    scamType: guessScamType(new Set(best.keys())),
    summary: '',
    redFlags,
    nextSteps: [],
    source: 'offline',
  };
}

function guessScamType(cats: Set<FlagCategory>): string | null {
  if (cats.has('remote_access')) return 'remote_access';
  if (cats.has('otp_request')) return 'otp_theft';
  if (cats.has('investment')) return 'investment';
  if (cats.has('job')) return 'job';
  if (cats.has('prize')) return 'prize';
  const hasLink = [...cats].some((c) => c.startsWith('link_'));
  if (cats.has('credential') || cats.has('link_lookalike') || (hasLink && cats.has('money_request'))) return 'phishing';
  if (cats.has('impersonation') && (cats.has('money_request') || cats.has('secrecy'))) return 'impersonation';
  if (cats.has('money_request')) return 'payment';
  return null;
}
