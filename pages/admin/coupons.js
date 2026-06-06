import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', minOrder: '0', maxUses: '100', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.replace('/');
  }, [status, session]);

  useEffect(() => {
    fetch('/api/admin/coupons').then(r => r.json()).then(data => { setCoupons(data); setLoading(false); });
  }, []);

  async function createCoupon(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxUses: Number(form.maxUses),
        expiresAt: form.expiresAt || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setCoupons(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ code: '', type: 'percent', value: '', minOrder: '0', maxUses: '100', expiresAt: '' });
      setMsg('Coupon created!');
    } else {
      setMsg(data.error || 'Failed to create');
    }
    setSaving(false);
  }

  async function toggleActive(coupon) {
    const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
    }
  }

  async function deleteCoupon(id) {
    if (!confirm('Delete this coupon?')) return;
    const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
    if (res.ok) setCoupons(prev => prev.filter(c => c.id !== id));
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/admin" className="text-slate-400 hover:text-slate-900">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Coupon Codes</h1>
        <span className="ml-auto flex items-center gap-3">
          {msg && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{msg}</span>}
          <button
            onClick={() => { setShowForm(!showForm); setMsg(''); }}
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            + New Coupon
          </button>
        </span>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Create form */}
        {showForm && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-slate-900">Create Coupon</h2>
            <form onSubmit={createCoupon} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Value ({form.type === 'percent' ? '%' : '$'}) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Min Order ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrder}
                    onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Expires At (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons list */}
        <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left font-semibold text-slate-500">Code</th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500">Discount</th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500">Uses</th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500">Min Order</th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500">Expires</th>
                <th className="px-4 py-4 text-left font-semibold text-slate-500">Status</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No coupons yet</td></tr>
              ) : coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-900">{coupon.code}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {coupon.type === 'percent' ? `${coupon.value}% off` : `$${(coupon.value / 100).toFixed(2)} off`}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{coupon.usedCount} / {coupon.maxUses}</td>
                  <td className="px-4 py-4 text-slate-600">${(coupon.minOrder / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        coupon.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {coupon.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
