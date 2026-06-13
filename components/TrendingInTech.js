import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';

function parse(str) {
  try { return JSON.parse(str) || []; } catch { return []; }
}

export default function TrendingInTech() {
  const [products, setProducts] = useState([]);
  const { format } = useCurrency();

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (!products.length) return null;

  return (
    <section className="py-8 sm:py-14 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg sm:text-2xl">🔥</span>
              <span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-orange-500">This Month</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Trending in Tech
            </h2>
          </div>
          <Link href="/products"
            className="text-xs sm:text-sm font-semibold text-primary hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 no-underline whitespace-nowrap">
            View all →
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-3 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-5 scrollbar-hide">
          {products.map((product, idx) => {
            const images = parse(product.images);
            const img = images[0] || null;
            const discount = product.comparePrice && product.comparePrice > product.price
              ? Math.round((1 - product.price / product.comparePrice) * 100)
              : 0;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex-shrink-0 w-40 sm:w-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden no-underline"
              >
                {/* Image */}
                <div className="relative aspect-square bg-slate-50 dark:bg-slate-800 overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">📦</div>
                  )}

                  {/* Rank badge */}
                  <div className={`absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow ${
                    idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-600' : 'bg-primary'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Discount badge */}
                  {discount > 0 && (
                    <div className="absolute top-2 right-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                      -{discount}%
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 sm:p-3">
                  <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 mb-0.5 truncate">{product.brand || product.category}</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1.5">{product.name}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-extrabold text-primary dark:text-sky-400">{format(product.price)}</span>
                    {product.comparePrice > product.price && (
                      <span className="text-[10px] text-slate-400 line-through">{format(product.comparePrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
