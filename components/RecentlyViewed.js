import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';

const KEY = 'kt_rv';
const MAX = 8;

export function trackView(product) {
  if (typeof window === 'undefined' || !product?.id) return;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    const filtered = stored.filter(p => p.id !== product.id);
    const slim = { id: product.id, name: product.name, price: product.price, comparePrice: product.comparePrice, images: product.images, category: product.category };
    const updated = [slim, ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export default function RecentlyViewed({ currentId }) {
  const { format } = useCurrency();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
      setItems(stored.filter(p => p.id !== currentId).slice(0, 6));
    } catch {}
  }, [currentId]);

  if (items.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recently Viewed</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {items.map(p => {
          const images = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
          const discount = p.comparePrice && p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="no-underline flex-shrink-0 w-36 sm:w-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md hover:border-sky-200 transition-all group"
            >
              <div className="aspect-square bg-slate-50 dark:bg-slate-800 overflow-hidden">
                {images[0] ? (
                  <img src={images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-300">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-0.5">{p.category}</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">{p.name}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{format(p.price)}</span>
                  {discount > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full px-1.5 py-0.5">-{discount}%</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
