import { useLang } from '../context/LanguageContext';

const LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'rw', label: 'RW', name: 'Kinyarwanda' },
];

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useLang();

  if (compact) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
          <span className="text-sm">🌐</span>
          <span>{lang.toUpperCase()}</span>
          <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute right-0 top-full mt-1 w-36 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-sky-50 ${
                lang === l.code ? 'font-semibold text-sky-700' : 'text-slate-700'
              }`}
            >
              <span className="w-6 text-xs font-bold">{l.label}</span>
              <span>{l.name}</span>
              {lang === l.code && <span className="ml-auto text-sky-500">✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex rounded-xl border border-slate-200 overflow-hidden">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-4 py-2 text-sm font-semibold transition ${
            lang === l.code
              ? 'bg-sky-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
