import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function StockAlertButton({ productId }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          email: email.trim(),
          phone: phone.trim() || undefined,
          userId: session?.user?.id ? Number(session.user.id) : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to subscribe');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-4 py-3">
        <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">You&rsquo;re on the list!</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">We&rsquo;ll notify you when this item is back in stock.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-sky-400 hover:text-sky-600 dark:hover:border-sky-500 dark:hover:text-sky-400 transition-all w-full justify-center"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notify Me When Back in Stock
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Get notified when available</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Email address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Phone (WhatsApp) <span className="text-slate-400 font-normal">— optional</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+250 7XX XXX XXX"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold py-2.5 text-sm transition-colors"
          >
            {submitting ? 'Subscribing…' : 'Notify Me'}
          </button>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            We&rsquo;ll only contact you about this product.
          </p>
        </form>
      )}
    </div>
  );
}
