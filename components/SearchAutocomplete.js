import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';

const RECENT_KEY = 'kt_recent_searches';
const MAX_RECENT = 5;

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(q) {
  try {
    const prev = getRecent().filter(s => s !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}
function clearRecent() {
  try { localStorage.removeItem(RECENT_KEY); } catch {}
}

export default function SearchAutocomplete({
  placeholder = 'Search phones, laptops, earbuds…',
  autoFocus = false,
  onNavigate,    // called when user navigates to a result (so parent can close drawer etc.)
  className = '',
  inputClassName = '',
}) {
  const router = useRouter();
  const { format } = useCurrency();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 50);
  }, [autoFocus]);

  // Load recent on open
  useEffect(() => {
    if (open && query.length < 2) setRecentSearches(getRecent());
  }, [open, query]);

  // Fetch suggestions
  useEffect(() => {
    if (query.length < 2) { setResults([]); setActiveIdx(-1); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`).then(r => r.json());
        setResults(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
      setActiveIdx(-1);
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on route change
  useEffect(() => {
    const h = () => setOpen(false);
    router.events?.on('routeChangeStart', h);
    return () => router.events?.off('routeChangeStart', h);
  }, [router.events]);

  function navigate(href) {
    setOpen(false);
    setQuery('');
    onNavigate?.();
    router.push(href);
  }

  function submit(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    saveRecent(q);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  }

  function pickResult(r) {
    saveRecent(r.name);
    navigate(`/products/${r.id}`);
  }

  function handleKeyDown(e) {
    if (!open) return;
    const list = results;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && list[activeIdx]) {
        e.preventDefault();
        pickResult(list[activeIdx]);
      } else {
        submit(e);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && (query.length >= 2 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={submit} className="flex w-full rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-sky-500 focus-within:bg-white dark:focus-within:bg-slate-700 transition-all overflow-hidden shadow-sm">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`flex-1 bg-transparent px-5 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none ${inputClassName}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setActiveIdx(-1); inputRef.current?.focus(); }}
            className="flex items-center px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            tabIndex={-1}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {loading && (
          <div className="flex items-center px-3">
            <div className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          </div>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 px-5 text-white text-sm font-bold transition-colors flex-shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden xl:inline">Search</span>
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[60] rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">

          {/* Recent searches (shown when query < 2) */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent</p>
                <button
                  onClick={() => { clearRecent(); setRecentSearches([]); }}
                  className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); setOpen(true); }}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-sky-300 hover:text-sky-700 transition-colors"
                  >
                    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60 py-1">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseDown={() => pickResult(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIdx
                        ? 'bg-sky-50 dark:bg-sky-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-11 w-11 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      {r.image
                        ? <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center text-lg">📦</span>
                      }
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{r.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {r.brand && <span className="text-xs text-slate-400 truncate">{r.brand}</span>}
                        {r.brand && <span className="text-slate-300 dark:text-slate-600">·</span>}
                        <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{r.category}</span>
                        {!r.inStock && (
                          <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold text-red-500">Out of stock</span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{format(r.price)}</p>
                      {r.discount > 0 && (
                        <p className="text-[10px] font-bold text-red-500">-{r.discount}%</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No results for &ldquo;<span className="text-sky-600">{query}</span>&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try a different term</p>
            </div>
          )}

          {/* Footer */}
          {results.length > 0 && (
            <div className="border-t border-slate-50 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
              <p className="text-xs text-slate-400">{results.length} suggestion{results.length !== 1 ? 's' : ''}</p>
              <button
                type="button"
                onMouseDown={submit}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
              >
                See all results for &ldquo;{query}&rdquo; →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
