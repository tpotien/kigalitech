import { useLang } from '../context/LanguageContext';

const LANGS = [
  { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'RW', name: 'Ikinyarwanda', flag: '🇷🇼' },
];

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3 text-sky-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, translating } = useLang();

  if (compact) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <span className="text-sm">🌐</span>
          {translating ? <Spinner /> : <span>{lang.toUpperCase()}</span>}
          <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute right-0 top-full mt-1 w-40 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              disabled={translating}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-sky-50 dark:hover:bg-sky-900/20 disabled:opacity-50 ${
                lang === l.code ? 'font-semibold text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.name}</span>
              {lang === l.code && !translating && <span className="ml-auto text-sky-500">✓</span>}
              {lang === l.code && translating && <span className="ml-auto"><Spinner /></span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          disabled={translating && lang !== l.code}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
            lang === l.code
              ? 'bg-sky-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <span className="text-base leading-none">{l.flag}</span>
          {lang === l.code && translating ? <Spinner /> : <span>{l.label}</span>}
        </button>
      ))}
    </div>
  );
}
