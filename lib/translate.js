// Translation utility — uses unofficial Google Translate endpoint (no key needed).
// Includes:
//   translateText(text, lang)  — translate a single string
//   translateDOM(lang)         — walk + translate all visible DOM text nodes
// Results cached in localStorage with 7-day TTL.

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

// ─────────────────────────────────────────────────────────────────────────────
// DOM Translation Engine
// ─────────────────────────────────────────────────────────────────────────────

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'CODE', 'PRE', 'HEAD']);

// Skip pure numbers, prices, symbols, single chars, email addresses, URLs
const SKIP_RE = /^[\s\d.,+\-:/%$€£¥₹ ~•·|–—©®™°]+$|^\s*$|^.{1}$|^https?:\/\/|@/;

// WeakMap: stores each text node's original English content
const origText = new WeakMap();

// Module-level mutable state
let currentLang = 'en';
let isApplying = false;
let domObserver = null;
let pendingNodes = [];
let observerFlushTimer = null;

// ── Collect text nodes ────────────────────────────────────────────────────────

function collectTextNodes(root, out) {
  if (!root) return;
  if (root.nodeType === 3) { // TEXT_NODE
    const src = origText.has(root) ? origText.get(root) : root.textContent;
    const trimmed = src.trim();
    if (trimmed.length >= 2 && !SKIP_RE.test(trimmed)) out.push(root);
    return;
  }
  if (root.nodeType !== 1) return;
  if (SKIP_TAGS.has(root.tagName)) return;
  if (root.getAttribute?.('aria-hidden') === 'true') return;
  if (root.getAttribute?.('data-notranslate') !== null && root.hasAttribute?.('data-notranslate')) return;
  for (const child of root.childNodes) collectTextNodes(child, out);
}

function getAllTextNodes() {
  const out = [];
  if (typeof document !== 'undefined' && document.body) collectTextNodes(document.body, out);
  return out;
}

// ── Apply a {originalText: translatedText} map to nodes ──────────────────────

function applyMap(nodes, map) {
  if (!nodes.length) return;
  isApplying = true;
  for (const node of nodes) {
    const orig = origText.has(node) ? origText.get(node) : node.textContent;
    const trimmed = orig.trim();
    const translated = map[trimmed];
    if (translated && translated !== trimmed) {
      if (!origText.has(node)) origText.set(node, node.textContent);
      // Replace the visible text while preserving surrounding whitespace
      node.textContent = orig.replace(trimmed, translated);
    }
  }
  setTimeout(() => { isApplying = false; }, 0);
}

// ── Restore all nodes back to their stored English originals ─────────────────

function restoreAll() {
  const nodes = getAllTextNodes();
  isApplying = true;
  for (const node of nodes) {
    if (origText.has(node)) node.textContent = origText.get(node);
  }
  setTimeout(() => { isApplying = false; }, 0);
}

// ── MutationObserver — re-applies cached translations when React re-renders ──

function flushPendingNodes() {
  if (!pendingNodes.length || currentLang === 'en') { pendingNodes = []; return; }
  // Only apply what's already cached — no new API calls in observer path
  const cachedResults = {};
  const toCheck = [...new Set(pendingNodes.map(n => (origText.has(n) ? origText.get(n) : n.textContent).trim()).filter(Boolean))];
  for (const text of toCheck) {
    const hit = getCached(text, currentLang);
    if (hit) cachedResults[text] = hit;
  }
  applyMap(pendingNodes, cachedResults);
  pendingNodes = [];
}

function onMutation(mutations) {
  if (isApplying || currentLang === 'en') return;
  for (const m of mutations) {
    if (m.type !== 'childList') continue;
    for (const added of m.addedNodes) collectTextNodes(added, pendingNodes);
  }
  clearTimeout(observerFlushTimer);
  observerFlushTimer = setTimeout(flushPendingNodes, 150);
}

function startObserver() {
  if (typeof MutationObserver === 'undefined' || domObserver) return;
  domObserver = new MutationObserver(onMutation);
  domObserver.observe(document.body, { childList: true, subtree: true });
}

// ── Main translateDOM ─────────────────────────────────────────────────────────

/**
 * Translates all visible text on the page to the given language.
 * - lang: 'en' | 'fr' | 'rw' (or any BCP-47 code supported by Google Translate)
 * - onProgress({ done, total }): optional callback called as strings are fetched
 *
 * Cached strings apply instantly; uncached strings are fetched progressively.
 */
export async function translateDOM(lang, onProgress) {
  if (typeof document === 'undefined') return;
  currentLang = lang;

  if (lang === 'en') {
    restoreAll();
    return;
  }

  startObserver();

  const nodes = getAllTextNodes();

  // Build: trimmedText → [array of text nodes that contain it]
  const textToNodes = new Map();
  for (const node of nodes) {
    const orig = origText.has(node) ? origText.get(node) : node.textContent;
    const trimmed = orig.trim();
    if (!trimmed) continue;
    if (!origText.has(node)) origText.set(node, node.textContent);
    if (!textToNodes.has(trimmed)) textToNodes.set(trimmed, []);
    textToNodes.get(trimmed).push(node);
  }

  // Split into cached (apply now) and uncached (fetch progressively)
  const cachedMap = {};
  const toFetch = [];
  for (const text of textToNodes.keys()) {
    const hit = getCached(text, lang);
    if (hit) cachedMap[text] = hit;
    else toFetch.push(text);
  }

  // Apply all cached translations immediately
  if (Object.keys(cachedMap).length) applyMap(nodes, cachedMap);

  // Fetch remaining strings and apply as each comes back
  if (toFetch.length) {
    if (onProgress) onProgress({ done: 0, total: toFetch.length });
    let done = 0;
    for (const text of toFetch) {
      if (currentLang !== lang) return; // user changed language mid-flight — abort
      const translated = await translateText(text, lang); // uses GT API + cache
      // Apply to matching nodes immediately
      isApplying = true;
      const matched = textToNodes.get(text) || [];
      for (const node of matched) {
        if (!node.parentElement) continue; // node removed from DOM
        const orig = origText.get(node);
        if (orig !== undefined) node.textContent = orig.replace(orig.trim(), translated);
      }
      setTimeout(() => { isApplying = false; }, 0);
      done++;
      if (onProgress) onProgress({ done, total: toFetch.length });
      // Small pause to avoid hammering the API
      await new Promise(r => setTimeout(r, 40));
    }
  }
}

export function getCurrentLang() { return currentLang; }
