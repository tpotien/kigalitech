import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

const EMPTY = { code: '', type: 'percent', value: '', minOrder: '0', maxUses: '100', expiresAt: '' };

export default function AdminCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin');
    if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role)) router.replace('/');
  }, [status, session]);

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(data => { setCoupons(data); setLoading(false); });
  }, []);

  async function save(e) {
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
      setForm(EMPTY);
      setMsg('Coupon created successfully!');
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg(data.error || 'Failed to create coupon');
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
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
    if (res.ok) setCoupons(prev => prev.filter(c => c.id !== id));
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  function fmtDiscount(c) {
    if (c.type === 'percent') return `${c.value}% off`;
    return `RWF ${Number(c.value).toLocaleString()} off`;
  }

  function isExpired(c) {
    return c.expiresAt && new Date(c.expiresAt) < new Date();
  }

  function statusLabel(c) {
    if (!c.active) return { label: 'Inactive', cls: 'bg-slate-100 text-slate-500' };
    if (isExpired(c)) return { label: 'Expired', cls: 'bg-red-100 text-red-600' };
    if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { label: 'Exhausted', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' };
  }

  const active = coupons.filter(c => c.active && !isExpired(c) && !(c.maxUses > 0 && c.usedCount >= c.maxUses));
  const totalUses = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);

  return (
    <AdminLayout title="Coupon Codes">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Coupon Codes</h1>
            <p className="text-sm text-slate-500 mt-0.5">Create and manage discount codes for customers</p>
          </div>
          <div className="flex items-center gap-3">
            {msg && (
              <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${msg.includes('success') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {msg}
              </span>
            )}
            <button
              onClick={() => { setShowForm(!showForm); setMsg(''); }}
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Coupon
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Coupons', value: coupons.length, icon: '🏷️' },
            { label: 'Active', value: active.length, icon: '✅' },
            { label: 'Total Uses', value: totalUses, icon: '🛒' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold text-slate-900 dark:text-white">Create New Coupon</h2>
            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="SAVE20"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-mono font-bold tracking-widest focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none dark:text-white"
                  >
                    <option value="percent">Percentage (%) off</option>
                    <option value="fixed">Fixed Amount (RWF) off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                    {form.type === 'percent' ? 'Percentage (%)' : 'Amount (RWF)'} *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={form.type === 'percent' ? 100 : undefined}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === 'percent' ? '20' : '5000'}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Min Order (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrder}
                    onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Max Uses (0 = unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Preview */}
              {form.code && form.value && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-900 px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">🏷️</span>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-mono font-bold text-sky-700 dark:text-sky-400">{form.code}</span>
                    {' — '}
                    {form.type === 'percent' ? `${form.value}% off` : `RWF ${Number(form.value).toLocaleString()} off`}
                    {Number(form.minOrder) > 0 && ` on orders over RWF ${Number(form.minOrder).toLocaleString()}`}
                    {form.expiresAt && ` · expires ${new Date(form.expiresAt).toLocaleDateString()}`}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Creating…' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY); }}
                  className="rounded-full border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🏷️</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No coupons yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first coupon to offer discounts to customers</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['Code', 'Discount', 'Min Order', 'Uses', 'Expires', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {coupons.map(coupon => {
                    const { label, cls } = statusLabel(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="flex items-center gap-2 group"
                            title="Click to copy"
                          >
                            <span className="font-mono font-bold text-slate-900 dark:text-white tracking-widest">{coupon.code}</span>
                            <span className="text-slate-300 group-hover:text-sky-500 transition text-xs">
                              {copied === coupon.code ? '✓' : '⧉'}
                            </span>
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{fmtDiscount(coupon)}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                          {Number(coupon.minOrder) > 0 ? `RWF ${Number(coupon.minOrder).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-sky-500"
                                style={{ width: coupon.maxUses > 0 ? `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` : '0%' }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {coupon.usedCount} {coupon.maxUses > 0 ? `/ ${coupon.maxUses}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleActive(coupon)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80 ${cls}`}
                          >
                            {label}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
