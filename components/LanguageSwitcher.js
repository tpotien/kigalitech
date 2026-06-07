import { useLang } from '../context/LanguageContext';

const LANGS = [
  { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'RW', name: 'Ikinyarwanda', flag: '🇷🇼' },
];

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useLang();

  if (compact) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <span className="text-sm">🌐</span>
          <span>{lang.toUpperCase()}</span>
          <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute right-0 top-full mt-1 w-36 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-sky-50 dark:hover:bg-sky-900/20 ${
                lang === l.code ? 'font-semibold text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.name}</span>
              {lang === l.code && <span className="ml-auto text-sky-500">✓</span>}
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
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition ${
            lang === l.code
              ? 'bg-sky-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <span className="text-base leading-none">{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
