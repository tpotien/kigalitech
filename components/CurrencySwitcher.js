import { useCurrency, NAMES, SYMBOLS } from '../context/CurrencyContext';

const CURRENCIES = ['USD', 'RWF', 'EUR', 'GBP', 'KES', 'UGX'];

export default function CurrencySwitcher({ compact = false }) {
  const { currency, setCurrency, symbol } = useCurrency();

  if (compact) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
          <span>{symbol.trim()}</span>
          <span>{currency}</span>
          <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-sky-50 ${
                currency === c ? 'font-semibold text-sky-700' : 'text-slate-700'
              }`}
            >
              <span className="w-8 font-mono text-xs">{SYMBOLS[c]}</span>
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
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      {CURRENCIES.map(c => (
        <option key={c} value={c}>{SYMBOLS[c].trim()} {c} — {NAMES[c]}</option>
      ))}
    </select>
  );
}
