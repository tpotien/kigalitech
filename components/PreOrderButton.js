import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function PreOrderButton({ product }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const deposit = product.preOrderDeposit
    ? `RWF ${(product.preOrderDeposit / 100).toLocaleString()}`
    : 'Free to reserve';
  const releaseDate = product.preOrderDate
    ? new Date(product.preOrderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Coming Soon';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/pre-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed. Please try again.'); setLoading(false); return; }
    setDone(true); setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 text-base transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
      >
        🔔 Pre-Order Now · {deposit} deposit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
              <h2 className="text-xl font-bold text-white">Pre-Order: {product.name}</h2>
              <p className="text-amber-100 text-sm mt-1">Expected: {releaseDate}</p>
            </div>
            <div className="p-6">
              {done ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You&apos;re on the list!</h3>
                  <p className="text-slate-500 text-sm">We&apos;ll notify you at <strong>{form.email}</strong> when it&apos;s ready.</p>
                  <button onClick={() => { setOpen(false); setDone(false); }} className="mt-5 rounded-xl bg-slate-100 dark:bg-slate-800 px-6 py-2.5 text-sm font-semibold hover:bg-slate-200 transition-colors">Close</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Number</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="+250 7XX XXX XXX"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
                    💳 Deposit: <strong>{deposit}</strong> · Full payment due on release date
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 text-sm font-bold disabled:opacity-50 hover:from-amber-600 hover:to-orange-600 transition-all">
                      {loading ? 'Submitting…' : 'Confirm Pre-Order'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
