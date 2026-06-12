import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCart();
  const { format } = useCurrency();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [added, setAdded] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin?callbackUrl=/account/wishlist');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/account/wishlist')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  async function removeItem(productId) {
    setRemoving(productId);
    await fetch(`/api/account/wishlist/${productId}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.productId !== productId));
    setRemoving(null);
  }

  function handleAddToCart(item) {
    const imgs = (() => { try { return JSON.parse(item.product.images || '[]'); } catch { return []; } })();
    addItem({ id: item.product.id, name: item.product.name, price: item.product.price, image: imgs[0] || '', quantity: 1 });
    setAdded(item.productId);
    setTimeout(() => setAdded(null), 2000);
  }

  if (loading) return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account/loyalty" className="text-slate-400 hover:text-violet-600 no-underline">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Wishlist</h1>
            <p className="text-sm text-slate-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">💝</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Your wishlist is empty</p>
            <p className="text-sm text-slate-400 mb-6">Save items you love and come back to them anytime.</p>
            <Link href="/products" className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white no-underline hover:bg-violet-700">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => {
              const p = item.product;
              if (!p) return null;
              const imgs = (() => { try { return JSON.parse(p.images || '[]'); } catch { return []; } })();
              const discount = p.comparePrice && p.comparePrice > p.price
                ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
              const outOfStock = p.stock === 0;

              return (
                <div key={item.productId} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm group">
                  {/* Image */}
                  <Link href={`/products/${p.id}`} className="block no-underline">
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {imgs[0]
                        ? <img src={imgs[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="flex h-full items-center justify-center text-4xl">📦</div>
                      }
                      {discount > 0 && (
                        <span className="absolute top-3 left-3 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">-{discount}%</span>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={`/products/${p.id}`} className="no-underline">
                      <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-1">{p.category}</p>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug mb-2 line-clamp-2 hover:text-violet-600 transition">{p.name}</h3>
                    </Link>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-extrabold text-slate-900 dark:text-white">{format(p.price)}</span>
                      {discount > 0 && (
                        <span className="text-xs text-slate-400 line-through">{format(p.comparePrice)}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={outOfStock}
                        className="flex-1 rounded-full bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {added === item.productId ? '✓ Added!' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        disabled={removing === item.productId}
                        className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-400 hover:text-red-500 hover:border-red-200 disabled:opacity-40 transition"
                        title="Remove from wishlist"
                      >
                        {removing === item.productId
                          ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
