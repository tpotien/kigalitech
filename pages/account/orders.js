import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const STATUS_STYLES = {
  pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  shipped:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  delivered:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function usdCentsToRwf(n) {
  return Math.round(n);
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  function reorder(order) {
    const items = order.items || [];
    items.forEach(item => {
      if (item.product) {
        const imgs = (() => { try { return JSON.parse(item.product.images || '[]'); } catch { return []; } })();
        addItem({ id: item.product.id, name: item.product.name, price: item.price, image: imgs[0], color: item.color || '', storage: item.storage || '', quantity: item.quantity });
      }
    });
    toast({ type: 'cart', title: 'Added to cart', message: `${items.length} item${items.length !== 1 ? 's' : ''} from Order #${order.id}` });
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin?callbackUrl=/account/orders');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/account/orders')
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  if (loading) return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account/loyalty" className="text-slate-400 hover:text-violet-600 no-underline">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Orders</h1>
            <p className="text-sm text-slate-400 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🛍️</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No orders yet</p>
            <p className="text-sm text-slate-400 mb-6">Your purchase history will appear here.</p>
            <Link href="/products" className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white no-underline hover:bg-violet-700">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const isOpen = expanded === order.id;
              const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const total = usdCentsToRwf(order.total);

              return (
                <div key={order.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">Order #{order.id}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {order.status}
                        </span>
                        {order.paymentConfirmed && (
                          <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">Paid</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{date} · {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900 dark:text-white">RWF {total.toLocaleString()}</p>
                      {order.paymentMethod && <p className="text-xs text-slate-400 mt-0.5 capitalize">{order.paymentMethod}</p>}
                    </div>
                    <svg className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded: items */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-3">
                      {order.items?.map((item, i) => {
                        const imgs = (() => { try { return JSON.parse(item.product?.images || '[]'); } catch { return []; } })();
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              {imgs[0]
                                ? <img src={imgs[0]} alt="" className="h-full w-full object-cover" />
                                : <div className="flex h-full items-center justify-center text-xl">📦</div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.product?.name || 'Product'}</p>
                              {item.color && <p className="text-xs text-slate-400">{item.color}{item.storage ? ` · ${item.storage}` : ''}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">RWF {usdCentsToRwf(item.price).toLocaleString()}</p>
                              <p className="text-xs text-slate-400">×{item.quantity}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Discount */}
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                          <span className="text-emerald-600 font-semibold">−RWF {usdCentsToRwf(order.discountAmount).toLocaleString()}</span>
                        </div>
                      )}

                      {/* Shipping info */}
                      {order.shippingAddress && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Delivery To</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{order.shippingName}</p>
                          <p className="text-xs text-slate-400">{order.shippingAddress} · {order.shippingPhone}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                        <Link href={`/orders/${order.id}`} className="no-underline rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                          View Details
                        </Link>
                        {order.items?.length > 0 && (
                          <button
                            onClick={() => reorder(order)}
                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
                          >
                            🔁 Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
