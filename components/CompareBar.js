import { useState } from 'react';
import { useCompare } from '../context/CompareContext';
import { useCurrency } from '../context/CurrencyContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

function parse(v) { try { return typeof v === 'string' ? JSON.parse(v) : v ?? {}; } catch { return {}; } }

function CompareModal({ items, onClose }) {
  const { format } = useCurrency();
  if (!items.length) return null;

  // Collect all spec keys across all products
  const allSpecKeys = [...new Set(items.flatMap(p => Object.keys(parse(p.specs))))];
  const allColors = items.map(p => parse(p.colors));
  const allStorage = items.map(p => parse(p.storageOptions));

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Compare Products</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Product headers */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
            <div />
            {items.map(p => {
              const imgs = parse(p.images);
              const img = Array.isArray(imgs) ? imgs[0] : '';
              return (
                <div key={p.id} className="text-center">
                  <div className="mx-auto mb-3 h-32 w-32 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}
                  </div>
                  <p className="text-xs text-sky-600 font-semibold uppercase tracking-widest">{p.category}</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 leading-snug">{p.name}</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{format(p.price)}</p>
                  {p.comparePrice && <p className="text-xs text-slate-400 line-through">{format(p.comparePrice)}</p>}
                  <Link href={`/products/${p.id}`} className="mt-3 inline-block rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white no-underline hover:bg-sky-700">
                    View Product
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Row builder */}
          {[
            { label: 'Brand', render: p => p.brand || '—' },
            { label: 'Category', render: p => p.category },
            { label: 'Stock', render: p => p.stock > 0 ? <span className="text-emerald-600 font-semibold">{p.stock} in stock</span> : <span className="text-red-500 font-semibold">Sold out</span> },
            { label: 'Colors', render: (p, i) => {
              const cols = allColors[i];
              return Array.isArray(cols) && cols.length ? cols.join(', ') : '—';
            }},
            { label: 'Storage', render: (p, i) => {
              const sto = allStorage[i];
              return Array.isArray(sto) && sto.length ? sto.join(' / ') : '—';
            }},
            ...allSpecKeys.map(key => ({
              label: key,
              render: p => parse(p.specs)[key] || '—',
            })),
          ].map(({ label, render }, rowIdx) => (
            <div key={label} className={`grid gap-4 py-3 ${rowIdx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800 rounded-xl px-3' : 'px-3'}`}
              style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 self-center">{label}</span>
              {items.map((p, i) => (
                <span key={p.id} className="text-sm text-slate-700 dark:text-slate-300 text-center">{render(p, i)}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  const { format } = useCurrency();
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const onComparePage = router.pathname === '/compare';

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-20 xl:bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
        <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md shadow-2xl border border-white/10 px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-400 flex-shrink-0">Compare</span>
            <div className="flex items-center gap-2 overflow-hidden">
              {items.map(p => {
                const img = (() => { try { const a = JSON.parse(p.images); return a[0]; } catch { return ''; } })();
                return (
                  <div key={p.id} className="relative flex-shrink-0 group">
                    <div className="h-9 w-9 overflow-hidden rounded-xl bg-slate-700 border border-white/10">
                      {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                    </div>
                    <button onClick={() => remove(p.id)}
                      className="absolute -right-1 -top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">
                      ×
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: 3 - items.length }).map((_, i) => (
                <div key={i} className="h-9 w-9 rounded-xl border border-dashed border-slate-600 flex items-center justify-center">
                  <span className="text-slate-600 text-lg leading-none">+</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-500 hidden sm:block">{items.length}/3</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={clear} className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2">Clear</button>
            {!onComparePage && (
              <Link
                href="/compare"
                className={`rounded-full px-4 py-2 text-xs font-bold text-white no-underline transition-all ${
                  items.length >= 2
                    ? 'bg-sky-500 hover:bg-sky-400'
                    : 'bg-sky-500/40 cursor-not-allowed pointer-events-none'
                }`}
              >
                Compare Now
              </Link>
            )}
            <button
              onClick={() => setModalOpen(true)}
              disabled={items.length < 2}
              className="rounded-full bg-slate-700 border border-white/10 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Quick View
            </button>
          </div>
        </div>
      </div>

      {modalOpen && <CompareModal items={items} onClose={() => setModalOpen(false)} />}
    </>
  );
}
