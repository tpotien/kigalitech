import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useSession } from 'next-auth/react';
import TranslatedText from './TranslatedText';

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

function ImagePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center">
      <svg className="h-16 w-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
  );
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
  const [imgError, setImgError] = useState(false);

  const badge = getBadge(product);
  const images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
  const colors = Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors || '[]');
  const storageOptions = Array.isArray(product.storageOptions) ? product.storageOptions : JSON.parse(product.storageOptions || '[]');
  const isWished = wishlistIds.has(product.id);
  const isCompared = inCompare(product.id);
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

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
    if (isCompared) { removeCompare(product.id); }
    else { addCompare(product); toast({ type: 'info', title: 'Added to compare', message: product.name }); }
  }

  return (
    <article className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-200 transition-all duration-300 hover:-translate-y-0.5">

      {/* ── Badge ── */}
      {badge && (
        <span className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm ${badge.color}`}>
          {badge.label}
        </span>
      )}

      {/* ── Wishlist heart ── */}
      <button
        onClick={handleWishlist}
        aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
          isWished
            ? 'bg-red-50 border border-red-200 text-red-500 scale-110'
            : 'bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-200 backdrop-blur-sm'
        } ${heartAnim ? 'scale-125' : ''}`}
      >
        <svg className="h-4 w-4" fill={isWished ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* ── Image ── */}
      <Link href={`/products/${product.id}`} className="block overflow-hidden">
        <div className="relative aspect-square w-full overflow-hidden bg-white dark:bg-slate-800">
          {/* Subtle radial bg to make product pop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#f8fafc_0%,_#f1f5f9_100%)] dark:bg-[radial-gradient(ellipse_at_center,_#1e293b_0%,_#0f172a_100%)]" />

          {images[0] && !imgError ? (
            <img
              src={images[0]}
              alt={product.name}
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
              className="relative h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.07] drop-shadow-md"
            />
          ) : (
            <ImagePlaceholder />
          )}

          {/* Multiple images indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 backdrop-blur-sm">
              {images.slice(0, 4).map((_, i) => (
                <div key={i} className={`rounded-full ${i === 0 ? 'h-1.5 w-1.5 bg-white' : 'h-1 w-1 bg-white/50'}`} />
              ))}
            </div>
          )}

          {/* Genuine badge */}
          {product.genuine !== false && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Original
            </span>
          )}

          {/* Hover quick actions overlay */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 pb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            <button
              onClick={(e) => { e.preventDefault(); onQuickView && onQuickView(product); }}
              className="rounded-full bg-white/95 dark:bg-slate-800/95 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-sm hover:bg-sky-50 hover:text-sky-700 border border-slate-100 dark:border-slate-700 transition-colors"
            >
              Quick View
            </button>
            <button
              onClick={handleCompare}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-md border transition-colors ${
                isCompared
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 backdrop-blur-sm hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              {isCompared ? '✓ Compare' : 'Compare'}
            </button>
          </div>
        </div>
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        {/* Category + brand */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <TranslatedText text={product.category} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-sky-600 truncate" />
          {product.brand && <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate max-w-[45%] hidden sm:block">{product.brand}</p>}
        </div>

        <Link href={`/products/${product.id}`} className="no-underline">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug hover:text-sky-700 transition-colors line-clamp-2 text-[12px] sm:text-[15px]">
            <TranslatedText text={product.name} as={null} />
          </h2>
        </Link>

        {/* Color swatches — hide on very small mobile to save space */}
        {colors.length > 0 && (
          <div className="mt-2 hidden sm:flex items-center gap-1.5">
            {colors.slice(0, 6).map((c) => (
              <span key={c} title={c} className="h-3.5 w-3.5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm ring-1 ring-white dark:ring-slate-800" style={{ backgroundColor: colorToHex(c) }} />
            ))}
            {colors.length > 6 && <span className="text-[11px] text-slate-400">+{colors.length - 6}</span>}
            {storageOptions.length > 1 && (
              <span className="ml-auto text-[11px] font-medium text-slate-400">{storageOptions[0]}</span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-[4px]" />

        {/* Price + CTA */}
        <div className="mt-2 flex items-end justify-between gap-1.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 flex-wrap">
              <p className="text-[14px] sm:text-[19px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">{format(product.price)}</p>
              {discount > 0 && (
                <span className="rounded-full bg-red-100 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-red-500">-{discount}%</span>
              )}
            </div>
            {product.comparePrice && product.comparePrice > product.price && (
              <p className="text-[10px] text-slate-400 line-through">{format(product.comparePrice)}</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex-shrink-0 rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all active:scale-95 ${
              product.stock === 0 ? 'bg-slate-300 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
              : added ? 'bg-emerald-500 scale-95'
              : 'bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-200'
            }`}
          >
            {product.stock === 0 ? 'Out' : added ? '✓' : '+ Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
