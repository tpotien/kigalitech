// Lightweight translation utility using Google Translate (unofficial endpoint)
// Results cached in localStorage for 7 days to minimise API calls

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function getCached(text, lang) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`kt_tr_${lang}_${hashStr(text)}`);
    if (!raw) return null;
    const { v, exp } = JSON.parse(raw);
    if (Date.now() > exp) return null;
    return v;
  } catch { return null; }
}

function setCached(text, lang, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `kt_tr_${lang}_${hashStr(text)}`,
      JSON.stringify({ v: value, exp: Date.now() + CACHE_TTL })
    );
  } catch {}
}

// Dedup in-flight promises for the same (text, lang) pair
const inflight = new Map();

export async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text;
  const str = String(text).trim();
  if (!str) return str;

  const cached = getCached(str, targetLang);
  if (cached !== null) return cached;

  const key = `${targetLang}::${str}`;
  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    try {
      const url =
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=` +
        encodeURIComponent(str);
      const res = await fetch(url);
      if (!res.ok) return str;
      const data = await res.json();
      const result = (data[0] || []).map(seg => seg?.[0] || '').join('');
      const clean = result || str;
      setCached(str, targetLang, clean);
      return clean;
    } catch {
      return str;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

export function clearTranslationCache() {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('kt_tr_'))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

// Strip emoji and non-printable chars from product names
export function sanitizeProductName(name) {
  return name
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{2300}-\u{23FF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function hasEmoji(str) {
  return /[\u{1F000}-\u{1FFFF}]/u.test(str) || /[\u{2600}-\u{27BF}]/u.test(str);
}
