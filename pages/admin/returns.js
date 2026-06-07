import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Link from 'next/link';

const STATUS_COLORS = {
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'completed'];

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function ReturnRow({ ret, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    status: ret.status,
    adminNotes: ret.adminNotes || '',
    refundAmount: ret.refundAmount || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ret.id, ...form }),
      });
      const data = await res.json();
      if (res.ok) { onSave(data); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <tr
        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 font-semibold text-slate-900">
          <Link href={`/orders/${ret.orderId}`} onClick={e => e.stopPropagation()} className="text-sky-600 hover:underline no-underline">
            #{ret.orderId}
          </Link>
        </td>
        <td className="px-4 py-3">
          <p className="font-medium text-slate-800">{ret.user?.name || '—'}</p>
          <p className="text-xs text-slate-400">{ret.user?.email || ''}</p>
        </td>
        <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{ret.reason}</td>
        <td className="px-4 py-3"><StatusBadge status={ret.status} /></td>
        <td className="px-4 py-3 text-sm text-slate-400">{new Date(ret.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3">
          <button className="text-xs text-sky-600 hover:underline">
            {expanded ? 'Collapse' : 'Details'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td colSpan={6} className="px-4 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700">{ret.description || 'No description provided.'}</p>
                {ret.refundAmount > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Refund Amount</p>
                    <p className="text-sm font-bold text-emerald-700">RWF {Number(ret.refundAmount).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Update form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Update Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Refund Amount (RWF)</label>
                  <input
                    type="number"
                    value={form.refundAmount}
                    onChange={e => setForm(f => ({ ...f, refundAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Admin Notes</label>
                  <textarea
                    rows={2}
                    value={form.adminNotes}
                    onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))}
                    placeholder="Internal notes or message to customer..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/returns')
      .then(r => r.json())
      .then(data => { setReturns(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleSave(updated) {
    setReturns(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  }

  const counts = {
    all: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    completed: returns.filter(r => r.status === 'completed').length,
  };

  const filtered = filter === 'all' ? returns : returns.filter(r => r.status === filter);

  return (
    <AdminLayout title="Returns">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Return Requests</h1>
            <p className="text-slate-500 text-sm mt-1">{returns.length} total return{returns.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved', 'rejected', 'completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filter === tab ? 'bg-sky-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="capitalize">{tab}</span>
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${filter === tab ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">No return requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ret => (
                    <ReturnRow key={ret.id} ret={ret} onSave={handleSave} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
