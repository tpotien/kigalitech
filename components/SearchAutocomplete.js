import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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
  onNavigate,
  className = '',
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

  useEffect(() => {
    if (open && query.length < 2) setRecentSearches(getRecent());
  }, [open, query]);

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

  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const h = () => { setOpen(false); setQuery(''); };
    router.events?.on('routeChangeStart', h);
    return () => router.events?.off('routeChangeStart', h);
  }, [router.events]);

  function navigate(href) {
    setOpen(false); setQuery(''); onNavigate?.(); router.push(href);
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
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      if (activeIdx >= 0 && results[activeIdx]) { e.preventDefault(); pickResult(results[activeIdx]); }
      else submit(e);
    } else if (e.key === 'Escape') setOpen(false);
  }

  const showDropdown = open && (query.length >= 2 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>

      {/* Input row */}
      <form onSubmit={submit} className="flex w-full border border-gray-200 bg-white focus-within:border-primary transition-colors overflow-hidden rounded">
        {/* Search icon inside */}
        <div className="flex items-center pl-3.5 text-gray-400 flex-shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

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
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
        />

        {/* Clear button */}
        {query && (
          <button type="button" tabIndex={-1}
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            className="px-2 text-gray-300 hover:text-gray-500 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Spinner */}
        {loading && (
          <div className="flex items-center px-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Submit button */}
        <button type="submit"
          className="bg-primary hover:bg-primary-hover text-white px-5 text-sm font-medium transition-colors flex-shrink-0 flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden xl:inline">Search</span>
        </button>
      </form>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-[60] bg-white border border-gray-100 shadow-xl rounded overflow-hidden">

          {/* Recent searches */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent Searches</p>
                <button onClick={() => { clearRecent(); setRecentSearches([]); }}
                  className="text-[10px] text-gray-400 hover:text-primary transition-colors font-medium">
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(s => (
                  <button key={s} onClick={() => { setQuery(s); setOpen(true); }}
                    className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 hover:border-primary hover:text-primary px-3 py-1.5 rounded text-xs font-medium text-gray-600 transition-colors">
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product results */}
          {results.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Products</p>
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button type="button" onMouseDown={() => pickResult(r)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        i === activeIdx ? 'bg-red-50' : 'hover:bg-gray-50'
                      }`}>
                      {/* Thumbnail */}
                      <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 border border-gray-100">
                        {r.image
                          ? <img src={r.image} alt={r.name} className="h-full w-full object-contain p-1" />
                          : <span className="flex h-full w-full items-center justify-center text-lg">📦</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {r.brand && <span className="text-xs text-gray-400">{r.brand}</span>}
                          {r.brand && <span className="text-gray-200">·</span>}
                          <span className="text-[11px] font-medium text-gray-500">{r.category}</span>
                          {!r.inStock && (
                            <span className="bg-red-50 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold">Out of stock</span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-primary">{format(r.price)}</p>
                        {r.discount > 0 && (
                          <p className="text-[10px] font-semibold text-gray-400">-{r.discount}%</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="border-t border-gray-50 px-4 py-2.5 flex items-center justify-between bg-gray-50">
                <p className="text-xs text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                <button type="button" onMouseDown={submit}
                  className="text-xs font-semibold text-primary hover:underline transition-colors">
                  See all results for &ldquo;{query}&rdquo; →
                </button>
              </div>
            </>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-semibold text-gray-700">No results for &ldquo;<span className="text-primary">{query}</span>&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
            </div>
          )}

          {/* Popular categories hint when empty query */}
          {query.length < 2 && recentSearches.length === 0 && (
            <div className="px-4 py-4 text-center text-xs text-gray-400">
              Start typing to search phones, laptops, TVs and more…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
