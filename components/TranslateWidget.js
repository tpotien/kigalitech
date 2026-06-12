import { useState, useEffect, useRef } from 'react';

const LANGUAGES = [
  { code: 'en',    label: 'English',     flag: '🇬🇧' },
  { code: 'fr',    label: 'Français',    flag: '🇫🇷' },
  { code: 'rw',    label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'sw',    label: 'Kiswahili',   flag: '🇰🇪' },
  { code: 'ar',    label: 'العربية',     flag: '🇸🇦' },
  { code: 'zh-CN', label: '中文',        flag: '🇨🇳' },
  { code: 'hi',    label: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'pt',    label: 'Português',   flag: '🇵🇹' },
];

export const LS_KEY = 'kt_translate_lang';

// ── Cookie helpers ─────────────────────────────────────────────────────────
function setGoogCookie(lang) {
  const val = `/en/${lang}`;
  const hostname = window.location.hostname;
  // Set on both root domain and .domain (for subdomain coverage)
  document.cookie = `googtrans=${val}; path=/`;
  document.cookie = `googtrans=${val}; path=/; domain=${hostname}`;
  document.cookie = `googtrans=${val}; path=/; domain=.${hostname}`;
}

function clearGoogCookie() {
  const exp = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';
  const hostname = window.location.hostname;
  document.cookie = `googtrans=; ${exp}; path=/`;
  document.cookie = `googtrans=; ${exp}; path=/; domain=${hostname}`;
  document.cookie = `googtrans=; ${exp}; path=/; domain=.${hostname}`;
}

// ── Google Translate helpers ───────────────────────────────────────────────
function getCombo() {
  return document.querySelector('select.goog-te-combo');
}

function fireCombo(lang) {
  const sel = getCombo();
  if (!sel) return false;
  sel.value = lang;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

// Wait for the combo to exist, then fire — retries for up to 10 s
export function applyLang(lang) {
  if (fireCombo(lang)) return;
  let tries = 0;
  const id = setInterval(() => {
    if (fireCombo(lang) || ++tries > 33) {
      clearInterval(id);
      // Hard fallback: cookie is already set, just reload
      if (tries > 33 && lang !== 'en') window.location.reload();
    }
  }, 300);
}

// ── Fade overlay ───────────────────────────────────────────────────────────
function showFade() {
  let el = document.getElementById('kt-tr-fade');
  if (!el) {
    el = Object.assign(document.createElement('div'), { id: 'kt-tr-fade' });
    Object.assign(el.style, {
      position: 'fixed', inset: '0', background: 'rgba(248,250,252,0.85)',
      backdropFilter: 'blur(3px)', zIndex: '99999',
      opacity: '0', transition: 'opacity 250ms ease',
    });
    document.body.appendChild(el);
  }
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  return el;
}

function hideFade(el) {
  if (!el) return;
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => { el.style.pointerEvents = 'none'; }, 260);
  }, 600); // give GT ~600ms to swap text before fading back in
}

// ── Icons ──────────────────────────────────────────────────────────────────
function GlobeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3.6 9h16.8M3.6 15h16.8M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9M12 3c2 2.5 3 5.5 3 9s-1 6.5-3 9" />
    </svg>
  );
}

function Chevron({ open, className }) {
  return (
    <svg className={`${className} transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Language list ──────────────────────────────────────────────────────────
function LangList({ active, onPick }) {
  return LANGUAGES.map(lang => (
    <button
      key={lang.code}
      onClick={() => onPick(lang)}
      className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 transition-colors
        ${active === lang.code
          ? 'bg-sky-50 text-sky-700 font-semibold'
          : 'text-slate-700 hover:bg-slate-50'}`}
    >
      <span className="text-base leading-none w-6 text-center">{lang.flag}</span>
      <span className="flex-1">{lang.label}</span>
      {active === lang.code && (
        <svg className="h-3.5 w-3.5 text-sky-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  ));
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TranslateWidget({ compact = false, mobile = false }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('en');
  const ref = useRef(null);

  // Restore saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) || 'en';
    setActive(saved);
    if (saved !== 'en') {
      setGoogCookie(saved);
      applyLang(saved);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (mobile) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [mobile]);

  function pick(lang) {
    if (!mobile) setOpen(false);
    if (lang.code === active) return;
    setActive(lang.code);
    localStorage.setItem(LS_KEY, lang.code);

    const fade = showFade();

    if (lang.code === 'en') {
      clearGoogCookie();
      // Reload is the cleanest way to restore original English
      setTimeout(() => window.location.reload(), 300);
    } else {
      setGoogCookie(lang.code);
      setTimeout(() => {
        applyLang(lang.code);
        hideFade(fade);
      }, 300);
    }
  }

  const current = LANGUAGES.find(l => l.code === active) || LANGUAGES[0];
  const label = active === 'en'
    ? 'Translate'
    : `${current.flag} ${active === 'zh-CN' ? 'ZH' : active.toUpperCase()}`;

  // ── Mobile drawer variant ──────────────────────────────────────────────
  if (mobile) {
    return (
      <div className="mb-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-[15px] font-bold text-slate-800 dark:text-slate-100 transition-colors hover:border-sky-400 hover:text-sky-700 dark:hover:border-sky-600 dark:hover:text-sky-400"
        >
          <div className="flex items-center gap-3">
            <GlobeIcon className="h-5 w-5 text-sky-500" />
            <span>{label}</span>
          </div>
          <Chevron open={open} className="h-4 w-4 text-slate-400" />
        </button>
        {open && (
          <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <LangList active={active} onPick={pick} />
          </div>
        )}
      </div>
    );
  }

  // ── Compact announcement-bar variant ──────────────────────────────────
  if (compact) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <GlobeIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-[11px] font-semibold leading-none">{label}</span>
          <Chevron open={open} className="h-2.5 w-2.5 flex-shrink-0" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white border border-slate-100 shadow-2xl z-[200] overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select language</p>
            </div>
            <LangList active={active} onPick={pick} />
          </div>
        )}
      </div>
    );
  }

  // ── Standalone variant ────────────────────────────────────────────────
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
      >
        <GlobeIcon className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-semibold">{label}</span>
        <Chevron open={open} className="h-3 w-3 flex-shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white border border-slate-100 shadow-2xl z-[200] overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select language</p>
          </div>
          <LangList active={active} onPick={pick} />
        </div>
      )}
    </div>
  );
}
