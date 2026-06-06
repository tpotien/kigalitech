import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

const STATUS_OPTS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/orders').then((r) => r.json()).then((data) => { setOrders(data); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  async function updateStatus(id, status) {
    await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function toggleFlag(id, field, current) {
    const body = { [field]: !current };
    await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      const updated = { ...o, [field]: !current };
      updated.billPrintable = updated.adminConfirmed && updated.paymentConfirmed;
      return updated;
    }));
  }

  return (
    <AdminLayout title="Orders">
      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {['all', ...STATUS_OPTS].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Admin ✓</th>
                <th className="px-4 py-3">Paid ✓</th>
                <th className="px-4 py-3">Print</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">#{o.id}</p>
                      <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{o.user?.name || o.shippingName || 'Guest'}</p>
                    <p className="text-xs text-slate-400">{o.user?.email || o.shippingEmail || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">${(o.total / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`rounded-full px-2 py-1 text-xs font-semibold border-0 cursor-pointer ${STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-600'}`}
                    >
                      {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFlag(o.id, 'adminConfirmed', o.adminConfirmed)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${o.adminConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      {o.adminConfirmed ? '✓ Yes' : 'Confirm'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFlag(o.id, 'paymentConfirmed', o.paymentConfirmed)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${o.paymentConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      {o.paymentConfirmed ? '✓ Paid' : 'Mark Paid'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.billPrintable ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                      {o.billPrintable ? '🖨 Unlocked' : '🔒 Locked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 no-underline">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center text-slate-400">No orders found.</div>}
        </div>
      )}
    </AdminLayout>
  );
}
