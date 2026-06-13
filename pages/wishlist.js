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
    items.forEach(w => w.product && addToCart(w.product));
  }

  if (!loading && !session) {
    return (
      <Layout>
        <div className="max-w-container mx-auto px-4 lg:px-6 py-10">
          <nav className="text-sm text-ex-muted flex items-center gap-2 mb-14">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-ex-text font-medium">Wishlist</span>
          </nav>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-24 w-24 rounded-full bg-ex-gray flex items-center justify-center text-5xl mb-6">♡</div>
            <h2 className="text-2xl font-semibold text-ex-text mb-3">Your wishlist is empty</h2>
            <p className="text-ex-muted text-sm mb-8 max-w-xs">Sign in to save products and access your wishlist from any device.</p>
            <Link href="/signin" className="btn-primary inline-block">Sign In</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-container mx-auto px-4 lg:px-6 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-ex-muted flex items-center gap-2 mb-10">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ex-text font-medium">Wishlist</span>
        </nav>

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-ex-text">
            Wishlist ({loading ? '…' : items.length})
          </h1>
          {items.length > 0 && (
            <button
              onClick={moveAllToBag}
              className="px-8 py-3 rounded border border-ex-border text-sm font-medium text-ex-text hover:border-primary hover:text-primary transition-colors"
            >
              Move All To Bag
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[3/4] rounded" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-ex-gray flex items-center justify-center text-4xl mb-5">♡</div>
            <h2 className="text-lg font-semibold text-ex-text mb-2">No products in your wishlist yet</h2>
            <p className="text-ex-muted text-sm mb-8">Browse our store and tap the heart icon to save products here.</p>
            <Link href="/products" className="btn-primary inline-block">Browse Products</Link>
          </div>
        )}

        {/* Grid */}
        {!loading && items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
              {items.map(({ product, productId }) => {
                if (!product) return null;
                const img = product.images?.[0] || '';
                const hasDiscount = product.comparePrice && product.comparePrice > product.price;
                const inStock = product.stock > 0;

                return (
                  <div key={productId} className="product-card group relative flex flex-col bg-ex-gray rounded overflow-hidden">
                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(productId)}
                      className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white shadow flex items-center justify-center text-ex-muted hover:text-primary hover:bg-primary hover:text-white transition-colors"
                      title="Remove"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Badge */}
                    {!inStock && (
                      <span className="absolute top-2 left-2 z-10 rounded bg-gray-500 px-2 py-0.5 text-[10px] text-white font-medium">Out of Stock</span>
                    )}
                    {hasDiscount && inStock && (
                      <span className="absolute top-2 left-2 z-10 rounded bg-primary px-2 py-0.5 text-[10px] text-white font-medium">
                        -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                      </span>
                    )}

                    {/* Image */}
                    <Link href={`/products/${productId}`} className="block aspect-square bg-ex-gray overflow-hidden">
                      {img ? (
                        <img src={img} alt={product.name}
                          className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-5xl opacity-20">📦</div>
                      )}
                    </Link>

                    {/* Add to Cart — slides up */}
                    <div className="product-card-atc absolute bottom-[72px] inset-x-0">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!inStock}
                        className={`w-full py-2 text-xs font-medium text-white ${!inStock ? 'bg-gray-400 cursor-not-allowed' : 'bg-ex-text hover:bg-primary'} transition-colors`}
                      >
                        {inStock ? 'Add To Cart' : 'Out of Stock'}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-white">
                      <Link href={`/products/${productId}`} className="block text-xs font-medium text-ex-text hover:text-primary line-clamp-1 mb-1.5">
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-semibold text-sm">{format(product.price)}</span>
                        {hasDiscount && (
                          <span className="text-ex-muted text-xs line-through">{format(product.comparePrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Link href="/products" className="text-sm text-ex-muted hover:text-primary transition-colors underline underline-offset-2">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
