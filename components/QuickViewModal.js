import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export default function QuickViewModal({ product, onClose }) {
  const { addItem } = useCart();
  const { format } = useCurrency();
  const [color, setColor] = useState('');
  const [storage, setStorage] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  function parseField(val) {
    const normalize = arr => arr.map(s => (typeof s === 'object' && s !== null ? s.value || '' : s)).filter(Boolean);
    if (Array.isArray(val)) return normalize(val);
    try { const p = JSON.parse(val || '[]'); return Array.isArray(p) ? normalize(p) : []; } catch { return []; }
  }
  const images = parseField(product?.images);
  const colors = parseField(product?.colors);
  const storageOptions = parseField(product?.storageOptions);

  useEffect(() => {
    if (product) {
      setColor(colors[0] || '');
      setStorage(storageOptions[0] || '');
      setQty(1);
      setAdded(false);
      setImgIndex(0);
    }
  }, [product?.id]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!product) return null;

  function handleAdd() {
    addItem({ id: product.id, name: product.name, price: product.price, image: images[0], color, storage, quantity: qty });
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 dark:bg-slate-700 p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid sm:grid-cols-2">
          {/* Images */}
          <div className="bg-[radial-gradient(ellipse_at_center,#f8fafc_0%,#f1f5f9_100%)] dark:bg-[radial-gradient(ellipse_at_center,#1e293b_0%,#0f172a_100%)] p-5 flex flex-col">
            <div className="overflow-hidden rounded-2xl aspect-square flex items-center justify-center">
              {images[imgIndex] ? (
                <img
                  src={images[imgIndex]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-16 w-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-white dark:bg-slate-800 transition-all ${
                      imgIndex === i ? 'border-sky-500 ring-1 ring-sky-200 dark:ring-sky-800' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[80vh]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">{product.category}</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{product.name}</h2>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{format(product.price)}</p>
            </div>

            {/* Color */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Color: <span className="font-semibold text-slate-700 dark:text-slate-300">{color}</span></p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        color === c ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage */}
            {storageOptions.length > 1 && (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Storage</p>
                <div className="flex flex-wrap gap-2">
                  {storageOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStorage(s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        storage === s ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">−</button>
                <span className="min-w-[2rem] text-center text-sm font-semibold dark:text-slate-200">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">+</button>
              </div>
              <p className="text-xs text-slate-400">{product.stock} in stock</p>
            </div>

            <button
              onClick={handleAdd}
              className={`w-full rounded-full py-3.5 font-semibold text-white transition-all ${
                added ? 'bg-emerald-500' : 'bg-sky-600 hover:bg-sky-700 active:scale-[0.98]'
              }`}
            >
              {added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>

            <Link
              href={`/products/${product.id}`}
              onClick={onClose}
              className="text-center text-sm text-sky-600 hover:text-sky-800"
            >
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
