import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';
import { useSession } from 'next-auth/react';

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, removeItem, updateQty, subtotal, clearCart } = useCart();
  const { format } = useCurrency();
  const { data: session } = useSession();
  const [freeDeliveries, setFreeDeliveries] = useState(null);

  useEffect(() => {
    if (!drawerOpen) return;
    fetch('/api/account/free-deliveries')
      .then(r => r.json())
      .then(setFreeDeliveries)
      .catch(() => {});
  }, [drawerOpen, session]);

  // Estimated delivery: 1-3 business days from today
  const deliveryFrom = new Date();
  deliveryFrom.setDate(deliveryFrom.getDate() + 1);
  while (deliveryFrom.getDay() === 0 || deliveryFrom.getDay() === 6) deliveryFrom.setDate(deliveryFrom.getDate() + 1);
  const deliveryTo = new Date(deliveryFrom);
  deliveryTo.setDate(deliveryTo.getDate() + 2);
  while (deliveryTo.getDay() === 0 || deliveryTo.getDay() === 6) deliveryTo.setDate(deliveryTo.getDate() + 1);
  const fmt = (d) => d.toLocaleDateString('en-RW', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Cart</span>
            {items.length > 0 && (
              <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free delivery progress */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
            {freeDeliveries ? (
              <>
                <div className="flex justify-between items-center mb-1.5">
                  <p className={`text-xs font-semibold ${freeDeliveries.remaining > 0 ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {freeDeliveries.remaining > 0
                      ? `Free delivery — ${freeDeliveries.remaining} of ${freeDeliveries.total} remaining`
                      : 'Free deliveries used up'}
                  </p>
                  <span className="text-[10px] text-slate-400">{freeDeliveries.used}/{freeDeliveries.total}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${freeDeliveries.remaining > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    style={{ width: `${(freeDeliveries.used / freeDeliveries.total) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-emerald-600 mb-1.5">First 5 orders: free delivery!</p>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
              </>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
                <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Your cart is empty</p>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Add items to get started</p>
              </div>
              <Link
                href="/#products"
                onClick={closeDrawer}
                className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.key)}
                        className="flex-shrink-0 ml-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {(item.color || item.storage) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {[item.color, item.storage].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {item.isPreOrder && (
                      <span className="inline-flex w-fit items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        Pre-order deposit
                      </span>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <button
                          onClick={() => item.quantity > 1 ? updateQty(item.key, item.quantity - 1) : removeItem(item.key)}
                          className="px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >−</button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.key, item.quantity + 1)}
                          className="px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >+</button>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{format(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5 space-y-3">
            {/* Delivery estimate */}
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
              <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Estimated delivery: <span className="font-semibold">{fmt(deliveryFrom)} – {fmt(deliveryTo)}</span>
              </p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{format(subtotal)}</span>
            </div>
            <p className="text-xs text-center font-medium text-emerald-600 dark:text-emerald-400">
              {freeDeliveries?.remaining > 0 || !freeDeliveries
                ? 'Free delivery on this order'
                : 'Standard shipping applies'}
            </p>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="block w-full rounded-full bg-sky-600 py-3.5 text-center font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              Checkout
            </Link>
            <div className="flex items-center justify-between">
              <button
                onClick={closeDrawer}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                ← Continue shopping
              </button>
              <button
                onClick={clearCart}
                className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
