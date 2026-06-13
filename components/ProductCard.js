import { useState } from 'react';
import { useImageFallback } from '../hooks/useImageFallback';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useSession } from 'next-auth/react';

function parseField(val) {
  const norm = arr => arr.map(s => (typeof s === 'object' && s !== null ? s.value || '' : s)).filter(Boolean);
  if (Array.isArray(val)) return norm(val);
  try { const p = JSON.parse(val || '[]'); return Array.isArray(p) ? norm(p) : []; } catch { return []; }
}

export default function ProductCard({ product, onQuickView }) {
  const { addItem } = useCart();
  const { format } = useCurrency();
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [added, setAdded] = useState(false);

  const images = parseField(product.images).filter(i => typeof i === 'string' && i.trim().length > 5);
  const { src: imgSrc, onError: onImgError } = useImageFallback(images);

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
  const isNew = !hasDiscount && product.featured;
  const outOfStock = product.stock === 0;
  const isWished = wishlistIds.has(product.id);

  function handleAddToCart(e) {
    e.preventDefault();
    if (outOfStock) return;
    addItem({ id: product.id, name: product.name, price: product.price, image: images[0] || '', color: '', storage: '', quantity: 1 });
    setAdded(true);
    toast({ type: 'cart', title: 'Added to cart', message: product.name });
    setTimeout(() => setAdded(false), 1500);
  }

  async function handleWishlist(e) {
    e.preventDefault();
    if (!session) { window.location.href = '/signin'; return; }
    const saved = await toggleWishlist(product.id);
    toast({ type: 'heart', title: saved ? 'Saved to wishlist' : 'Removed from wishlist', message: product.name });
  }

  return (
    <article className="product-card group relative flex flex-col bg-ex-gray rounded overflow-hidden">

      {/* Image area */}
      <Link href={`/products/${product.id}`} className="relative block overflow-hidden" style={{ aspectRatio: '1/1', background: '#F5F5F5' }}>

        {/* Badges */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 z-10 bg-primary text-white text-xs font-medium px-3 py-1 rounded">
            -{discount}%
          </span>
        )}
        {isNew && !hasDiscount && (
          <span className="absolute top-3 left-3 z-10 text-white text-xs font-medium px-3 py-1 rounded" style={{ background: '#00FF66', color: '#000' }}>
            NEW
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 left-3 z-10 bg-gray-500 text-white text-xs font-medium px-3 py-1 rounded">
            Sold Out
          </span>
        )}

        {/* Wishlist + Quick view icons (right side) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleWishlist}
            aria-label="Wishlist"
            className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-primary hover:text-white transition-colors"
            style={{ color: isWished ? '#DB4444' : '#1D2026' }}
          >
            <svg className="h-4 w-4" fill={isWished ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {onQuickView && (
            <button
              onClick={e => { e.preventDefault(); onQuickView(product); }}
              aria-label="Quick View"
              className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-primary hover:text-white transition-colors text-ex-text"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Product image */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {imgSrc ? (
            imgSrc.startsWith('data:') ? (
              <img src={imgSrc} alt={product.name} onError={onImgError}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <Image src={imgSrc} alt={product.name} fill sizes="(max-width:640px) 50vw, 25vw"
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300" onError={onImgError} />
            )
          ) : (
            <div className="text-5xl opacity-20">📦</div>
          )}
        </div>

        {/* Add to Cart — slides up on hover */}
        <div className="product-card-atc absolute bottom-0 inset-x-0">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full py-2.5 text-sm font-medium text-white transition-colors ${
              outOfStock ? 'bg-gray-400 cursor-not-allowed' :
              added ? 'bg-green-500' : 'bg-ex-text hover:bg-primary'
            }`}
          >
            {outOfStock ? 'Out of Stock' : added ? '✓ Added' : 'Add To Cart'}
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 bg-white">
        <Link href={`/products/${product.id}`} className="block text-sm font-medium text-ex-text hover:text-primary transition-colors line-clamp-1 mb-2">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-primary font-semibold text-sm whitespace-nowrap">{format(product.price)}</span>
          {hasDiscount && (
            <span className="text-ex-muted text-sm line-through whitespace-nowrap">{format(product.comparePrice)}</span>
          )}
        </div>
        {/* Stars placeholder */}
        <div className="flex items-center gap-1 mt-1.5">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className="h-3 w-3" fill={i<=4?'#FFAD33':'none'} viewBox="0 0 24 24" stroke="#FFAD33" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ))}
          <span className="text-ex-muted text-xs ml-1">(88)</span>
        </div>
      </div>
    </article>
  );
}
