import { useCurrency, NAMES, SYMBOLS } from '../context/CurrencyContext';

const CURRENCIES = ['RWF', 'USD', 'EUR', 'GBP', 'KES', 'UGX'];

export default function CurrencySwitcher({ compact = false }) {
  const { currency, setCurrency, symbol } = useCurrency();

  const label = currency === 'RWF' ? 'RWF' : symbol.trim();

  if (compact) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <span>{label}</span>
          <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute right-0 top-full mt-1 w-48 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-sky-50 dark:hover:bg-sky-900/20 ${
                currency === c ? 'font-semibold text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="w-10 font-mono text-xs">{SYMBOLS[c].trim()}</span>
              <span>{c}</span>
              <span className="ml-auto text-xs text-slate-400">{NAMES[c]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <select
      value={currency}
      onChange={e => setCurrency(e.target.value)}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800"
    >
      {CURRENCIES.map(c => (
        <option key={c} value={c}>{SYMBOLS[c].trim()} {c} — {NAMES[c]}</option>
      ))}
    </select>
  );
}
