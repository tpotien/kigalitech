import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

function getBadge(product) {
  if (product.stock === 0) return { label: 'Sold Out', color: 'bg-slate-500' };
  if (product.stock <= (product.lowStockThreshold || 5)) return { label: `Only ${product.stock} left`, color: 'bg-amber-500' };
  if (product.id <= 3) return { label: 'New', color: 'bg-emerald-500' };
  return null;
}

export default function ProductCard({ product, onQuickView }) {
  const { addItem } = useCart();
  const { format } = useCurrency();
  const [added, setAdded] = useState(false);
  const badge = getBadge(product);
  const images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
  const colors = Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors || '[]');
  const storageOptions = Array.isArray(product.storageOptions) ? product.storageOptions : JSON.parse(product.storageOptions || '[]');

  function handleAddToCart(e) {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      color: colors[0] || '',
      storage: storageOptions[0] || '',
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* Badge */}
      {badge && (
        <span className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold text-white ${badge.color}`}>
          {badge.label}
        </span>
      )}

      {/* Genuine badge */}
      {product.genuine !== false && (
        <span className="absolute right-4 bottom-[72px] z-10 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Original
        </span>
      )}

      {/* Quick View button */}
      <button
        onClick={(e) => { e.preventDefault(); onQuickView && onQuickView(product); }}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-white"
      >
        Quick View
      </button>

      {/* Image */}
      <Link href={`/products/${product.id}`} className="block overflow-hidden">
        <div className="relative h-56 w-full overflow-hidden bg-slate-100">
          <img
            src={images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">{product.category}</p>
        <Link href={`/products/${product.id}`} className="mt-1.5 no-underline">
          <h2 className="font-semibold text-slate-900 leading-snug hover:text-sky-700 transition-colors">
            {product.name}
          </h2>
        </Link>
        <p className="mt-2 text-sm text-slate-500 line-clamp-2">{product.description}</p>

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {colors.slice(0, 4).map((c) => (
              <span
                key={c}
                title={c}
                className="h-4 w-4 rounded-full border border-slate-200 bg-slate-300 text-[0px]"
                style={{ backgroundColor: colorToHex(c) }}
              >
                {c}
              </span>
            ))}
            {colors.length > 4 && (
              <span className="text-xs text-slate-400">+{colors.length - 4}</span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div>
            <p className="text-xl font-extrabold text-slate-900">{format(product.price)}</p>
            {product.stock <= (product.lowStockThreshold || 5) && product.stock > 0 && (
              <p className="text-xs text-amber-500 font-medium">Low stock</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-all ${
              product.stock === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : added
                ? 'bg-emerald-500'
                : 'bg-sky-600 hover:bg-sky-700 active:scale-95'
            }`}
          >
            {product.stock === 0 ? 'Sold Out' : added ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

function colorToHex(name) {
  const map = {
    black: '#1e293b',
    white: '#f8fafc',
    silver: '#cbd5e1',
    blue: '#3b82f6',
    red: '#ef4444',
    gold: '#f59e0b',
    'rose gold': '#fb7185',
    'space gray': '#475569',
    green: '#22c55e',
    purple: '#a855f7',
    yellow: '#eab308',
    pink: '#ec4899',
  };
  return map[name.toLowerCase()] || '#94a3b8';
}
