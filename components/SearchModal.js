import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const data = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json());
      setResults(data);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <svg className="h-5 w-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phones, laptops, headphones..."
            className="flex-1 text-slate-900 placeholder-slate-400 outline-none text-base bg-transparent"
          />
          {loading && (
            <div className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin flex-shrink-0" />
          )}
          <kbd onClick={onClose} className="hidden sm:inline-block cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-100">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 no-underline"
                >
                  {p.images[0] && <img src={p.images[0]} alt={p.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.brand} · {p.category}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">${(p.price / 100).toFixed(2)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-5 py-10 text-center text-slate-400">
            <p>No results for "<strong className="text-slate-600">{query}</strong>"</p>
            <p className="text-sm mt-1">Try a different term</p>
          </div>
        )}

        {query.length === 0 && (
          <div className="px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['iPhone', 'MacBook', 'Sony Headphones', 'Samsung Galaxy', 'iPad', 'Gaming Laptop'].map((s) => (
                <button key={s} onClick={() => setQuery(s)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-300 hover:text-sky-700">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
