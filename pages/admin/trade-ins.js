import { useState } from 'react';
import { getServerSideProps as authGuard } from '../../lib/adminAuth';
import AdminLayout from '../../components/AdminLayout';

export { authGuard as getServerSideProps };

const STATUS_OPTIONS = ['pending', 'under_review', 'verified', 'rejected', 'completed'];
const STATUS_COLORS = {
  pending: 'bg-slate-100 text-slate-600',
  under_review: 'bg-amber-100 text-amber-700',
  verified: 'bg-sky-100 text-sky-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export default function AdminTradeIns() {
  const [tradeIns, setTradeIns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [offer, setOffer] = useState('');
  const [final, setFinal] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadTradeIns() {
    setLoading(true);
    const res = await fetch('/api/admin/trade-ins');
    const data = await res.json();
    setTradeIns(data);
    setLoading(false);
  }

  if (!tradeIns && !loading) {
    loadTradeIns();
  }

  const filtered = tradeIns ? (filter === 'all' ? tradeIns : tradeIns.filter(t => t.status === filter)) : [];

  async function saveTradeIn(id, status) {
    setSaving(true);
    await fetch(`/api/admin/trade-ins?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        offeredPrice: offer ? Math.round(Number(offer) * 100) : undefined,
        finalPrice: final ? Math.round(Number(final) * 100) : undefined,
        adminNotes: notes || undefined,
      }),
    });
    setSaving(false);
    setSelected(null);
    loadTradeIns();
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Trade-In Requests</h1>
            <p className="text-sm text-slate-500 mt-1">Review and process customer trade-in submissions</p>
          </div>
          <button onClick={loadTradeIns} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Refresh</button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap capitalize transition-colors ${filter === s ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s.replace('_', ' ')}
              {tradeIns && s !== 'all' && <span className="ml-1 text-xs opacity-70">({tradeIns.filter(t => t.status === s).length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 py-16 text-center">
            <p className="text-slate-400">No trade-ins found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(ti => (
              <div key={ti.id} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{ti.productName}</h3>
                      {ti.brand && <span className="text-xs text-slate-400">by {ti.brand}</span>}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[ti.status]}`}>{ti.status?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span>Customer: <strong>{ti.user?.name}</strong></span>
                      <span>Condition: <strong className="capitalize">{ti.condition?.replace('_', ' ')}</strong></span>
                      <span>Asking: <strong>${ti.askingPrice ? (ti.askingPrice / 100).toFixed(2) : 'N/A'}</strong></span>
                      {ti.offeredPrice > 0 && <span>Offered: <strong className="text-sky-700">${(ti.offeredPrice / 100).toFixed(2)}</strong></span>}
                      {ti.finalPrice > 0 && <span>Final: <strong className="text-emerald-700">${(ti.finalPrice / 100).toFixed(2)}</strong></span>}
                    </div>
                    {ti.description && <p className="mt-2 text-sm text-slate-500">{ti.description}</p>}
                    {ti.adminNotes && <p className="mt-2 text-xs text-slate-400 italic">Note: {ti.adminNotes}</p>}
                  </div>
                  <button
                    onClick={() => { setSelected(ti); setOffer(ti.offeredPrice ? (ti.offeredPrice / 100).toString() : ''); setFinal(ti.finalPrice ? (ti.finalPrice / 100).toString() : ''); setNotes(ti.adminNotes || ''); }}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{selected.productName}</h3>
              <p className="text-sm text-slate-500 mb-6">Customer: {selected.user?.name} — {selected.user?.email}</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Offered Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input type="number" value={offer} onChange={e => setOffer(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-sky-500" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Final Deduction (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input type="number" value={final} onChange={e => setFinal(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-sky-500" placeholder="0.00" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none" placeholder="Internal notes..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Update Status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} onClick={() => saveTradeIn(selected.id, s)} disabled={saving} className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${selected.status === s ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-60`}>
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
