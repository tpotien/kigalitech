import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_COLOR = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-sky-100 text-sky-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped:    'bg-violet-100 text-violet-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-700',
};

function rwf(n) { return `RWF ${Math.round(n).toLocaleString()}`; }

export default function OrderLookup() {
  const [orderId, setOrderId]   = useState('');
  const [email, setEmail]       = useState('');
  const [order, setOrder]       = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: Number(orderId), email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Order not found.'); }
      else { setOrder(data); }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <Layout title="Track Your Order">
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-16 px-4">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 text-3xl mb-4">📦</div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Track Your Order</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Enter your order number and the email used at checkout.
            </p>
          </div>

          {/* Lookup form */}
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Order Number
              </label>
              <input
                type="number"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. 1042"
                required
                min="1"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:text-white"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2.5 text-sm font-medium">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold py-3 text-sm transition"
            >
              {loading ? 'Looking up…' : 'Track Order'}
            </button>
          </form>

          {/* Result */}
          {order && (
            <div className="mt-8 space-y-4">
              {/* Order summary card */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">Order</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">#{order.id}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-600'}`}>
                    {order.status}
                  </span>
                </div>

                {/* Progress bar */}
                {order.status !== 'cancelled' && (
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      {STATUS_STEPS.map((s, i) => (
                        <div key={s} className="flex flex-col items-center gap-1" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                          <div className={`h-2.5 w-2.5 rounded-full border-2 transition-all ${
                            i < stepIndex ? 'bg-emerald-500 border-emerald-500'
                            : i === stepIndex ? 'bg-sky-500 border-sky-500 ring-4 ring-sky-100 dark:ring-sky-900/30'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                          }`} />
                          <span className={`text-[10px] font-medium capitalize ${i === stepIndex ? 'text-sky-600' : i < stepIndex ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {s}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="relative h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-sky-500 transition-all duration-700"
                        style={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Order details */}
                <div className="px-6 py-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {order.shippingName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Name</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{order.shippingName}</span>
                    </div>
                  )}
                  {order.shippingCity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Delivery to</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{order.shippingCity}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Total</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rwf(order.total)}</span>
                  </div>
                </div>

                {/* Items */}
                {order.items?.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Items</p>
                    <ul className="space-y-2">
                      {order.items.map(item => (
                        <li key={item.id} className="flex items-center justify-between text-sm gap-3">
                          <span className="text-slate-700 dark:text-slate-300 truncate flex-1">
                            {item.name}
                            {item.color && <span className="text-slate-400 ml-1">· {item.color}</span>}
                            {item.storage && <span className="text-slate-400 ml-1">· {item.storage}</span>}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">×{item.quantity}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{rwf(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* CTA */}
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Need help?{' '}
                <Link href="/contact" className="text-sky-600 hover:underline">Contact support</Link>
              </p>
            </div>
          )}

          {/* Already have an account */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            Have an account?{' '}
            <Link href="/account" className="text-sky-600 hover:underline">Sign in</Link>
            {' '}to view all your orders.
          </p>
        </div>
      </div>
    </Layout>
  );
}
