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

const SELLER_STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  inactive: 'bg-amber-100 text-amber-700',
};

const GRACE_MONTHS = 5;

function graceInfo(firstListingAt) {
  if (!firstListingAt) return { expired: false, label: 'Not started' };
  const start = new Date(firstListingAt);
  const end = new Date(firstListingAt);
  end.setMonth(end.getMonth() + GRACE_MONTHS);
  const now = new Date();
  if (now > end) return { expired: true, label: `Expired ${end.toLocaleDateString()}` };
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return { expired: false, label: `${days}d left (ends ${end.toLocaleDateString()})` };
}

export default function AdminMarketplace() {
  const [tab, setTab] = useState('listings');

  // Listings state
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [saving, setSaving] = useState(null);

  // Sellers state
  const [sellers, setSellers] = useState(null);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [sellerSaving, setSellerSaving] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null); // { seller }
  const [suspendReason, setSuspendReason] = useState('terms_violation');
  const [paidMonths, setPaidMonths] = useState(1);

  async function loadListings() {
    setLoading(true);
    const res = await fetch(`/api/admin/marketplace?status=${filter === 'all' ? '' : filter}`);
    const data = await res.json();
    setListings(data);
    setLoading(false);
  }

  async function loadSellers() {
    setSellersLoading(true);
    const res = await fetch('/api/admin/sellers');
    const data = await res.json();
    setSellers(data);
    setSellersLoading(false);
  }

  if (tab === 'listings' && !listings && !loading) loadListings();
  if (tab === 'sellers' && !sellers && !sellersLoading) loadSellers();

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

  async function updateSeller(userId, patch) {
    setSellerSaving(userId);
    await fetch('/api/admin/sellers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    });
    setSellerSaving(null);
    loadSellers();
  }

  function confirmSuspend() {
    if (!suspendModal) return;
    updateSeller(suspendModal.seller.id, {
      sellerStatus: 'suspended',
      sellerSuspendedReason: suspendReason,
    });
    setSuspendModal(null);
  }

  function markPaid(seller, months) {
    const now = new Date();
    const current = seller.sellerSubscriptionExp ? new Date(seller.sellerSubscriptionExp) : now;
    const base = current > now ? current : now;
    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    updateSeller(seller.id, {
      sellerStatus: 'active',
      sellerSubscriptionExp: next.toISOString(),
      sellerSuspendedReason: '',
    });
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
            <p className="text-sm text-slate-500 mt-1">Manage listings and seller accounts</p>
          </div>
          <button
            onClick={() => { tab === 'listings' ? loadListings() : loadSellers(); }}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Refresh
          </button>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[['listings', 'Listings'], ['sellers', 'Sellers']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === key
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─── LISTINGS TAB ─── */}
        {tab === 'listings' && (
          <>
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
                          <td className="px-6 py-4 font-semibold text-slate-900">RWF {l.price.toLocaleString()}</td>
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
          </>
        )}

        {/* ─── SELLERS TAB ─── */}
        {tab === 'sellers' && (
          <>
            {sellersLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
              </div>
            ) : !sellers || sellers.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 py-16 text-center">
                <p className="text-slate-400">No sellers yet</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Seller</th>
                      <th className="px-5 py-3">Listings</th>
                      <th className="px-5 py-3">Grace Period</th>
                      <th className="px-5 py-3">Subscription</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sellers.map(s => {
                      const grace = graceInfo(s.sellerFirstListingAt);
                      const subExp = s.sellerSubscriptionExp ? new Date(s.sellerSubscriptionExp) : null;
                      const subActive = subExp && subExp > new Date();
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-900">{s.name || '—'}</p>
                            <p className="text-xs text-slate-400">{s.email}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{s._count.marketplaceListings}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-medium ${grace.expired ? 'text-red-600' : 'text-emerald-600'}`}>
                              {grace.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {subExp ? (
                              <span className={`text-xs font-medium ${subActive ? 'text-emerald-600' : 'text-red-500'}`}>
                                {subActive ? `Active until ${subExp.toLocaleDateString()}` : `Expired ${subExp.toLocaleDateString()}`}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">None</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${SELLER_STATUS_COLORS[s.sellerStatus] || 'bg-slate-100 text-slate-600'}`}>
                              {s.sellerStatus}
                            </span>
                            {s.sellerStatus === 'suspended' && s.sellerSuspendedReason && (
                              <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{s.sellerSuspendedReason.replace('_', ' ')}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {s.sellerStatus !== 'suspended' && (
                                <button
                                  onClick={() => { setSuspendReason('terms_violation'); setSuspendModal({ seller: s }); }}
                                  disabled={sellerSaving === s.id}
                                  className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-60"
                                >
                                  Suspend
                                </button>
                              )}
                              {s.sellerStatus !== 'active' && (
                                <button
                                  onClick={() => updateSeller(s.id, { sellerStatus: 'active', sellerSuspendedReason: '' })}
                                  disabled={sellerSaving === s.id}
                                  className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 disabled:opacity-60"
                                >
                                  Reactivate
                                </button>
                              )}
                              <div className="flex items-center gap-1">
                                <select
                                  value={paidMonths}
                                  onChange={e => setPaidMonths(Number(e.target.value))}
                                  className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700 outline-none"
                                >
                                  {[1,2,3,6,12].map(m => (
                                    <option key={m} value={m}>{m}mo</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => markPaid(s, paidMonths)}
                                  disabled={sellerSaving === s.id}
                                  className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-200 disabled:opacity-60"
                                >
                                  Mark Paid
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Suspend modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Suspend Seller</h2>
            <p className="text-sm text-slate-500 mb-5">
              Suspending <strong>{suspendModal.seller.name || suspendModal.seller.email}</strong> will hide their listings from the marketplace.
            </p>
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Reason</p>
              <div className="space-y-2">
                {[
                  { value: 'terms_violation', label: 'Terms of Service Violation', desc: 'Fraudulent listing, prohibited item, abuse, etc.' },
                  { value: 'non_payment', label: 'Non-payment of Subscription', desc: 'Monthly fee (RWF 10,000) not paid after grace period.' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition ${suspendReason === opt.value ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="reason" value={opt.value} checked={suspendReason === opt.value} onChange={() => setSuspendReason(opt.value)} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSuspendModal(null)} className="rounded-xl px-5 py-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmSuspend} className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700">Suspend Account</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
