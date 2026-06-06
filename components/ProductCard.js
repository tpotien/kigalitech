import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useSession } from 'next-auth/react';

function getBadge(product) {
  if (product.stock === 0) return { label: 'Sold Out', color: 'bg-slate-500' };
  if (product.comparePrice && product.comparePrice > product.price) {
    const pct = Math.round((1 - product.price / product.comparePrice) * 100);
    return { label: `-${pct}%`, color: 'bg-red-500' };
  }
  if (product.stock <= (product.lowStockThreshold || 5)) return { label: `Only ${product.stock} left`, color: 'bg-amber-500' };
  if (product.featured) return { label: 'Featured', color: 'bg-violet-500' };
  return null;
}

function colorToHex(name) {
  const map = { black: '#1e293b', white: '#f8fafc', silver: '#cbd5e1', blue: '#3b82f6', red: '#ef4444', gold: '#f59e0b', 'rose gold': '#fb7185', 'space gray': '#475569', green: '#22c55e', purple: '#a855f7', yellow: '#eab308', pink: '#ec4899', midnight: '#1e293b', starlight: '#f1f5f9', titanium: '#78716c', natural: '#d6cfc4' };
  return map[name?.toLowerCase()] || '#94a3b8';
}

export default function ProductCard({ product, onQuickView }) {
  const { addItem } = useCart();
  const { format } = useCurrency();
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const { add: addCompare, remove: removeCompare, has: inCompare } = useCompare();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [added, setAdded] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const badge = getBadge(product);
  const images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
  const colors = Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors || '[]');
  const storageOptions = Array.isArray(product.storageOptions) ? product.storageOptions : JSON.parse(product.storageOptions || '[]');
  const isWished = wishlistIds.has(product.id);
  const isCompared = inCompare(product.id);

  function handleAddToCart(e) {
    e.preventDefault();
    addItem({ id: product.id, name: product.name, price: product.price, image: images[0], color: colors[0] || '', storage: storageOptions[0] || '', quantity: 1 });
    setAdded(true);
    toast({ type: 'cart', title: 'Added to cart', message: product.name });
    setTimeout(() => setAdded(false), 1500);
  }

  async function handleWishlist(e) {
    e.preventDefault();
    if (!session) { window.location.href = '/signin'; return; }
    setHeartAnim(true);
    const saved = await toggleWishlist(product.id);
    toast({ type: 'heart', title: saved ? 'Saved to wishlist' : 'Removed from wishlist', message: product.name });
    setTimeout(() => setHeartAnim(false), 600);
  }

  function handleCompare(e) {
    e.preventDefault();
    if (isCompared) {
      removeCompare(product.id);
    } else {
      addCompare(product);
      toast({ type: 'info', title: 'Added to compare', message: product.name });
    }
  }

  return (
    <article className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Badge */}
      {badge && (
        <span className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${badge.color}`}>
          {badge.label}
        </span>
      )}

      {/* Wishlist heart */}
      <button
        onClick={handleWishlist}
        aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
          isWished
            ? 'bg-red-50 border border-red-200 text-red-500 scale-110'
            : 'bg-white/90 border border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-200 backdrop-blur-sm'
        } ${heartAnim ? 'scale-125' : ''}`}
      >
        <svg className="h-4 w-4" fill={isWished ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Quick View + Compare */}
      <div className="absolute left-4 bottom-[72px] z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); onQuickView && onQuickView(product); }}
          className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm hover:bg-sky-50 hover:text-sky-700 border border-slate-100"
        >
          Quick View
        </button>
        <button
          onClick={handleCompare}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm border transition-colors ${
            isCompared
              ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700'
              : 'bg-white/95 text-slate-700 border-slate-100 backdrop-blur-sm hover:bg-violet-50 hover:text-violet-700'
          }`}
        >
          {isCompared ? '✓ Comparing' : 'Compare'}
        </button>
      </div>

      {/* Image */}
      <Link href={`/products/${product.id}`} className="block overflow-hidden">
        <div className="relative h-56 w-full overflow-hidden bg-slate-100">
          <img src={images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {/* Genuine badge */}
          {product.genuine !== false && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Original
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">{product.category}</p>
        <Link href={`/products/${product.id}`} className="mt-1.5 no-underline">
          <h2 className="font-semibold text-slate-900 leading-snug hover:text-sky-700 transition-colors line-clamp-2">
            {product.name}
          </h2>
        </Link>
        <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">{product.description}</p>

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {colors.slice(0, 5).map((c) => (
              <span key={c} title={c} className="h-4 w-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: colorToHex(c) }} />
            ))}
            {colors.length > 5 && <span className="text-xs text-slate-400">+{colors.length - 5}</span>}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xl font-extrabold text-slate-900">{format(product.price)}</p>
            {product.comparePrice && product.comparePrice > product.price && (
              <p className="text-xs text-slate-400 line-through">{format(product.comparePrice)}</p>
            )}
            {product.stock > 0 && product.stock <= (product.lowStockThreshold || 5) && (
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Only {product.stock} left</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-all active:scale-95 ${
              product.stock === 0 ? 'bg-slate-300 cursor-not-allowed'
              : added ? 'bg-emerald-500 scale-95'
              : 'bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-200'
            }`}
          >
            {product.stock === 0 ? 'Sold Out' : added ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
