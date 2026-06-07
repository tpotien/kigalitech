import { useCart } from '../context/CartContext';
import Link from 'next/link';

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, removeItem, updateQty, subtotal, clearCart } = useCart();

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

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
                <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-slate-500">Your cart is empty</p>
              <button
                onClick={closeDrawer}
                className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.key)}
                        className="ml-2 text-slate-400 hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.color} · {item.storage}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <button
                          onClick={() => item.quantity > 1 ? updateQty(item.key, item.quantity - 1) : removeItem(item.key)}
                          className="px-3 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >−</button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.key, item.quantity + 1)}
                          className="px-3 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >+</button>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">${((item.price * item.quantity) / 100).toFixed(2)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">${(subtotal / 100).toFixed(2)}</span>
            </div>
            <p className="text-xs text-center text-slate-400">Shipping & taxes calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="block w-full rounded-full bg-sky-600 py-3.5 text-center font-semibold text-white hover:bg-sky-700"
            >
              Checkout
            </Link>
            <button
              onClick={clearCart}
              className="block w-full text-center text-sm text-slate-400 hover:text-red-500"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
