import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { toggle } = useWishlist();
  const { addItem } = useCart();
  const { format } = useCurrency();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { setLoading(false); return; }
    fetch('/api/account/wishlist')
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, status]);

  function removeItem(productId) {
    setItems(prev => prev.filter(w => w.productId !== productId));
    toggle(productId);
  }

  function addToCart(product) {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || '', quantity: 1, color: '', storage: '' });
  }

  function moveAllToBag() {
    items.forEach(w => addToCart(w.product));
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!loading && !session) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">♡</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your wishlist is empty</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs">Sign in to save products and access your wishlist from any device.</p>
          <Link href="/signin" className="rounded bg-primary hover:bg-primary-hover text-white font-semibold px-10 py-3 text-sm transition-colors">
            Sign In
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-slate-400 flex gap-2">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300">Wishlist</span>
        </nav>

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Wishlist ({loading ? '…' : items.length})
          </h1>
          {items.length > 0 && (
            <button
              onClick={moveAllToBag}
              className="rounded border border-slate-300 dark:border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-primary transition-colors"
            >
              Move All to Bag
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">♡</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">No products in your wishlist yet</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Browse our store and tap the heart icon to save products here.</p>
            <Link href="/products" className="rounded bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 text-sm transition-colors">
              Browse Products
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map(({ product, productId }) => {
              if (!product) return null;
              const img = product.images?.[0] || '';
              const hasDiscount = product.comparePrice && product.comparePrice > product.price;
              const inStock = product.stock > 0;

              return (
                <div key={productId} className="group relative rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col">
                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(productId)}
                    className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white dark:bg-slate-700 shadow flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove from wishlist"
                  >
                    ✕
                  </button>

                  {/* Out of stock badge */}
                  {!inStock && (
                    <span className="absolute top-2 left-2 z-10 rounded bg-slate-700 px-2 py-0.5 text-xs text-white font-medium">
                      Out of Stock
                    </span>
                  )}

                  {/* Discount badge */}
                  {hasDiscount && inStock && (
                    <span className="absolute top-2 left-2 z-10 rounded bg-primary px-2 py-0.5 text-xs text-white font-medium">
                      -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                    </span>
                  )}

                  {/* Image */}
                  <Link href={`/products/${productId}`} className="block bg-white dark:bg-slate-900 aspect-square overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={product.name}
                        className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl text-slate-200 dark:text-slate-700">📦</div>
                    )}
                  </Link>

                  {/* Info + Add to Cart */}
                  <div className="flex flex-col flex-1 p-3 gap-2">
                    <Link href={`/products/${productId}`} className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="text-primary font-bold text-sm">{format(product.price)}</span>
                      {hasDiscount && (
                        <span className="text-slate-400 line-through text-xs">{format(product.comparePrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!inStock}
                      className="w-full rounded bg-primary hover:bg-primary-hover disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white text-xs font-semibold py-2 transition-colors mt-1"
                    >
                      {inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue shopping */}
        {!loading && items.length > 0 && (
          <div className="mt-12 text-center">
            <Link href="/products" className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors underline underline-offset-2">
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
