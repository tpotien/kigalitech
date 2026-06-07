import { useState } from 'react';
import { getServerSideProps as authGuard } from '../../lib/adminAuth';
import AdminLayout from '../../components/AdminLayout';

export { authGuard as getServerSideProps };

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminMarketplace() {
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [saving, setSaving] = useState(null);

  async function loadListings() {
    setLoading(true);
    const res = await fetch(`/api/admin/marketplace?status=${filter === 'all' ? '' : filter}`);
    const data = await res.json();
    setListings(data);
    setLoading(false);
  }

  if (!listings && !loading) loadListings();

  async function updateStatus(id, status) {
    setSaving(id);
    await fetch(`/api/admin/marketplace?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSaving(null);
    loadListings();
  }

  async function toggleVerified(id, verified) {
    setSaving(id);
    await fetch(`/api/admin/marketplace?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified }),
    });
    setSaving(null);
    loadListings();
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing?')) return;
    setSaving(id);
    await fetch(`/api/admin/marketplace?id=${id}`, { method: 'DELETE' });
    setSaving(null);
    loadListings();
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Marketplace Listings</h1>
            <p className="text-sm text-slate-500 mt-1">Review and approve customer listings</p>
          </div>
          <button onClick={loadListings} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">Refresh</button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => { setFilter(s); setListings(null); }} className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap capitalize transition-colors ${filter === s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 py-16 text-center">
            <p className="text-slate-400">No listings found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Seller</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Condition</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map(l => {
                  const images = JSON.parse(l.images || '[]');
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {images[0]
                            ? <img src={images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            : <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">📦</div>
                          }
                          <div>
                            <p className="font-medium text-slate-900">{l.title}</p>
                            <p className="text-xs text-slate-400 line-clamp-1">{l.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">{l.seller?.name}</p>
                        <p className="text-xs text-slate-400">{l.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{l.category}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">RWF {Math.round((l.price / 100) * 1475).toLocaleString()}</td>
                      <td className="px-6 py-4 capitalize text-slate-600">{l.condition?.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                        {l.verified && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">✓ Verified</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {l.status !== 'approved' && (
                            <button onClick={() => updateStatus(l.id, 'approved')} disabled={saving === l.id} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">Approve</button>
                          )}
                          {l.status !== 'rejected' && (
                            <button onClick={() => updateStatus(l.id, 'rejected')} disabled={saving === l.id} className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60">Reject</button>
                          )}
                          <button onClick={() => toggleVerified(l.id, !l.verified)} disabled={saving === l.id} className={`rounded-lg px-3 py-1 text-xs font-semibold ${l.verified ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'} disabled:opacity-60`}>
                            {l.verified ? 'Unverify' : 'Verify'}
                          </button>
                          <button onClick={() => deleteListing(l.id)} disabled={saving === l.id} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
