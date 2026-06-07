import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCurrency } from '../context/CurrencyContext';

const CATEGORIES = ['Phones', 'Laptops', 'Headphones', 'Gaming', 'Wearables', 'TVs', 'Cameras'];
const QUICK_SEARCHES = ['iPhone 17 Pro Max', 'MacBook Pro M5', 'Sony XM6', 'Samsung S26', 'PS5 Slim', 'AirPods'];

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const { format } = useCurrency();

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setActiveIdx(-1); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setActiveIdx(-1); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const data = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json());
      setResults(data);
      setActiveIdx(-1);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function handleKeyDown(e) {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0) {
      window.location.href = `/products/${results[activeIdx].id}`;
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">

        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <svg className="h-5 w-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search phones, laptops, headphones..."
            className="flex-1 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none text-base bg-transparent"
          />
          {loading ? (
            <div className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin flex-shrink-0" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
          <kbd onClick={onClose} className="hidden sm:inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 py-1">
            {results.map((p, i) => {
              const img = p.images?.[0] || '';
              const discount = p.comparePrice && p.comparePrice > p.price
                ? Math.round((1 - p.price / p.comparePrice) * 100)
                : null;
              return (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.id}`}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-5 py-3 no-underline transition-colors ${
                      i === activeIdx ? 'bg-sky-50 dark:bg-sky-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{p.brand || p.category}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{p.category}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{format(p.price)}</p>
                      {discount && <p className="text-[10px] font-bold text-red-500">-{discount}%</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* No results */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-5 py-12 text-center">
            <div className="text-3xl mb-3">🔍</div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No results for "<span className="text-sky-600">{query}</span>"</p>
            <p className="text-sm text-slate-400 mt-1">Try a different term or browse categories</p>
          </div>
        )}

        {/* Empty state: categories + quick searches */}
        {query.length === 0 && (
          <div className="px-5 py-5 space-y-5">
            {/* Category pills */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Browse by Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={`/products?category=${cat}`}
                    onClick={onClose}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 no-underline hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick searches */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:border-sky-300 hover:text-sky-700 transition-colors"
                  >
                    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div className="border-t border-slate-50 dark:border-slate-800 px-5 py-2.5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5">↑</kbd><kbd className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5">↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5">↵</kbd> open</span>
          </div>
          {results.length > 0 && (
            <Link
              href={`/products?q=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="text-xs font-medium text-sky-600 no-underline hover:text-sky-800"
            >
              See all {results.length} results →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
