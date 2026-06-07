import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export default function BundleSection({ product }) {
  const { format } = useCurrency();
  const { addItem } = useCart();
  const [bundleProducts, setBundleProducts] = useState([]);
  const [selected, setSelected] = useState({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const bundled = (() => { try { return JSON.parse(product.bundledWith || '[]'); } catch { return []; } })();
    if (!bundled.length) return;

    Promise.all(
      bundled.map(b => {
        const pid = typeof b === 'object' ? b.productId : b;
        const disc = typeof b === 'object' ? (b.discount || 10) : 10;
        return fetch(`/api/products/${pid}`)
          .then(r => r.ok ? r.json() : null)
          .then(p => p ? { ...p, bundleDiscount: disc } : null)
          .catch(() => null);
      })
    ).then(results => {
      const valid = results.filter(Boolean);
      setBundleProducts(valid);
      const sel = {};
      valid.forEach(p => { sel[p.id] = true; });
      setSelected(sel);
    });
  }, [product.id]);

  if (!bundleProducts.length) return null;

  const selectedList = bundleProducts.filter(p => selected[p.id]);
  const bundleSavings = selectedList.reduce((s, p) => s + Math.round(p.price * p.bundleDiscount / 100), 0);
  const bundleTotal = product.price + selectedList.reduce((s, p) => s + p.price, 0) - bundleSavings;

  async function addBundle() {
    setAdding(true);
    const mainImg = (() => { try { return JSON.parse(product.images || '[]')[0] || ''; } catch { return ''; } })();
    addItem({ id: product.id, name: product.name, price: product.price, image: mainImg });
    for (const p of selectedList) {
      const img = (() => { try { return JSON.parse(p.images || '[]')[0] || ''; } catch { return ''; } })();
      const discPrice = p.price - Math.round(p.price * p.bundleDiscount / 100);
      addItem({ id: p.id, name: p.name, price: discPrice, image: img });
    }
    setTimeout(() => setAdding(false), 600);
  }

  return (
    <div className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 flex items-center gap-3">
        <span className="text-2xl">🎁</span>
        <div>
          <h3 className="font-bold text-sky-900 dark:text-sky-100 text-sm">Frequently Bought Together</h3>
          <p className="text-xs text-sky-600 dark:text-sky-400">
            Bundle &amp; save up to {Math.max(...bundleProducts.map(p => p.bundleDiscount))}% on accessories
          </p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* Main product (always selected) */}
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-sky-500">
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <img src={(() => { try { return JSON.parse(product.images||'[]')[0] || '/logo.png'; } catch { return '/logo.png'; } })()} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
            <p className="text-xs text-slate-500">This item</p>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">{format(product.price)}</p>
        </div>

        {bundleProducts.map(p => {
          const img = (() => { try { return JSON.parse(p.images||'[]')[0] || '/logo.png'; } catch { return '/logo.png'; } })();
          const discPrice = p.price - Math.round(p.price * p.bundleDiscount / 100);
          return (
            <div key={p.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!selected[p.id]}
                onChange={e => setSelected(prev => ({ ...prev, [p.id]: e.target.checked }))}
                className="h-5 w-5 rounded text-sky-500 border-slate-300 dark:border-slate-600 flex-shrink-0 cursor-pointer"
              />
              <img src={img} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 font-semibold mt-0.5">
                  {p.bundleDiscount}% off
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{format(discPrice)}</p>
                <p className="text-xs text-slate-400 line-through">{format(p.price)}</p>
              </div>
            </div>
          );
        })}

        <div className="pt-3 border-t border-sky-200 dark:border-sky-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Bundle total ({1 + selectedList.length} items)</p>
              {bundleSavings > 0 && (
                <p className="text-xs font-semibold text-emerald-600">You save {format(bundleSavings)} 🎉</p>
              )}
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{format(bundleTotal)}</p>
          </div>
          <button
            onClick={addBundle}
            disabled={!selectedList.length || adding}
            className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {adding ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            )}
            Add Bundle to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
