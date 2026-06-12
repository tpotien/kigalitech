import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

const STATUS_META = {
  pending:     { label: 'Pending Review',  color: 'bg-slate-100 text-slate-600',     icon: '⏳' },
  offer_made:  { label: 'Offer Sent',      color: 'bg-sky-100 text-sky-700',         icon: '💬' },
  negotiating: { label: 'Counter Received', color: 'bg-violet-100 text-violet-700',  icon: '🔄' },
  accepted:    { label: 'Accepted',        color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  rejected:    { label: 'Rejected',        color: 'bg-red-100 text-red-700',         icon: '❌' },
  confirmed:   { label: 'Confirmed',       color: 'bg-emerald-600 text-white',       icon: '🎉' },
  completed:   { label: 'Completed',       color: 'bg-slate-600 text-white',         icon: '✓' },
};

const CONDITION_LABELS = { excellent: 'Excellent ✨', good: 'Good 👍', fair: 'Fair', poor: 'Poor' };

export default function AdminTradeInDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  // Offer form
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/trade-ins/${id}`)
      .then(r => r.json())
      .then(data => {
        setItem(data && !data.error ? data : null);
        setLoading(false);
      })
      .catch(() => {
        setItem(null);
        setLoading(false);
      });
  }, [id]);

  async function doAction(action, extra = {}) {
    setActionLoading(true);
    setMsg({ text: '', ok: false });
    try {
      const res = await fetch(`/api/admin/trade-ins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        // Re-fetch full item to include user relation
        const full = await fetch(`/api/admin/trade-ins/${id}`).then(r => r.json()).catch(() => null);
        setItem(full && !full.error ? full : data);
        setMsg({ text: 'Action completed successfully', ok: true });
        setOfferAmount('');
        setOfferNote('');
        setRejectNote('');
      } else {
        setMsg({ text: data.error || 'Something went wrong', ok: false });
      }
    } catch {
      setMsg({ text: 'Network error — please try again', ok: false });
    }
    setActionLoading(false);
  }

  function fmt(n) {
    return `RWF ${Math.round(n).toLocaleString()}`;
  }

  if (loading) {
    return (
      <AdminLayout title="Trade-In Detail">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!item || item.error) {
    return (
      <AdminLayout title="Trade-In Detail">
        <div className="text-center py-20 text-slate-400">Trade-in not found</div>
      </AdminLayout>
    );
  }

  const meta = STATUS_META[item.status] || STATUS_META.pending;
  const images = (() => { try { const p = JSON.parse(item.images || '[]'); return Array.isArray(p) ? p : []; } catch { return []; } })();

  return (
    <AdminLayout title={`Trade-In #${item.id}`}>
      <div className="mb-6">
        <Link href="/admin/trade-ins" className="text-sm text-sky-600 hover:text-sky-800 no-underline">← Back to Trade-Ins</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Details */}
        <div className="space-y-6">

          {/* Header */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{item.productName}</h1>
                  {item.brand && <span className="text-sm text-slate-500">{item.brand}</span>}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${meta.color}`}>{meta.icon} {meta.label}</span>
                  <span className="text-xs text-slate-500">Trade-In #{item.id}</span>
                  <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <img key={i} src={src} alt="" className="h-24 w-24 flex-shrink-0 rounded-xl object-cover border border-slate-100" />
                ))}
              </div>
            )}

            {/* Info grid */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Condition</p>
                <p className="mt-0.5 font-semibold text-slate-800">{CONDITION_LABELS[item.condition] || item.condition}</p>
              </div>
              {item.askingPrice > 0 && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Customer Asking</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{fmt(item.askingPrice)}</p>
                </div>
              )}
              {item.offeredPrice > 0 && (
                <div className="rounded-xl bg-sky-50 p-3">
                  <p className="text-xs text-sky-600">Our Offer</p>
                  <p className="mt-0.5 font-semibold text-sky-800">{fmt(item.offeredPrice)}</p>
                </div>
              )}
              {item.counterPrice > 0 && (
                <div className="rounded-xl bg-violet-50 p-3">
                  <p className="text-xs text-violet-600">Customer Counter</p>
                  <p className="mt-0.5 font-semibold text-violet-800">{fmt(item.counterPrice)}</p>
                </div>
              )}
              {item.finalPrice > 0 && (
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-600">Agreed Price</p>
                  <p className="mt-0.5 font-bold text-emerald-800 text-lg">{fmt(item.finalPrice)}</p>
                </div>
              )}
              {item.couponCode && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 col-span-2 sm:col-span-1">
                  <p className="text-xs text-emerald-600">Coupon Issued</p>
                  <p className="mt-0.5 font-mono font-bold text-emerald-800">{item.couponCode}</p>
                </div>
              )}
            </div>

            {item.description && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Description</p>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{item.description}</p>
              </div>
            )}
          </div>

          {/* Negotiation thread */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Negotiation Thread</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {/* Submission */}
              <div className="flex items-start gap-3 px-6 py-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 overflow-hidden">
                  {item.user?.image ? <img src={item.user.image} alt="" className="h-full w-full object-cover" /> : (item.user?.name || '?')[0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">{item.user?.name || item.user?.email} <span className="font-normal text-slate-400">submitted trade-in</span></p>
                  <p className="mt-1 text-sm text-slate-600">{item.description || 'No description provided.'}</p>
                  {item.askingPrice > 0 && <p className="mt-1 text-xs text-slate-500">Asking: <span className="font-semibold">{fmt(item.askingPrice)}</span></p>}
                  <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Admin offer */}
              {item.offeredPrice > 0 && (
                <div className="flex items-start gap-3 px-6 py-4 bg-sky-50/30">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">K</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-sky-700">KigaliTech <span className="font-normal text-slate-400">made an offer</span></p>
                    {item.adminNotes && <p className="mt-1 text-sm text-slate-700">{item.adminNotes}</p>}
                    <p className="mt-1 text-sm font-bold text-sky-700">Offered: {fmt(item.offeredPrice)}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* User counter */}
              {item.counterPrice > 0 && (
                <div className="flex items-start gap-3 px-6 py-4 bg-violet-50/30">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white overflow-hidden">
                    {item.user?.image ? <img src={item.user.image} alt="" className="h-full w-full object-cover" /> : (item.user?.name || '?')[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-violet-700">{item.user?.name || 'Customer'} <span className="font-normal text-slate-400">sent a counter-offer</span></p>
                    {item.userNotes && <p className="mt-1 text-sm text-slate-700">{item.userNotes}</p>}
                    <p className="mt-1 text-sm font-bold text-violet-700">Counter: {fmt(item.counterPrice)}</p>
                  </div>
                </div>
              )}

              {/* Final status */}
              {['accepted', 'rejected', 'confirmed', 'completed'].includes(item.status) && (
                <div className={`flex items-center gap-3 px-6 py-4 ${item.status === 'rejected' ? 'bg-red-50/30' : 'bg-emerald-50/30'}`}>
                  <span className="text-xl">{meta.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                    {item.finalPrice > 0 && <p className="text-xs text-slate-500">Agreed value: {fmt(item.finalPrice)}</p>}
                    {item.couponCode && <p className="text-xs font-mono text-emerald-700 font-bold mt-0.5">Coupon: {item.couponCode}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions + customer info */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Customer</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 overflow-hidden">
                {item.user?.image
                  ? <img src={item.user.image} alt="" className="h-full w-full object-cover" />
                  : <span className="font-bold text-slate-600">{(item.user?.name || '?')[0]}</span>
                }
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.user?.name || 'No name'}</p>
                <p className="text-sm text-slate-500">{item.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {msg.text && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {msg.text}
            </div>
          )}

          {/* Action panel */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Actions</h2>
            </div>
            <div className="p-5 space-y-4">

              {/* Make / revise offer (pending, offer_made, negotiating) */}
              {['pending', 'offer_made', 'negotiating'].includes(item.status) && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {item.status === 'negotiating' ? 'Counter with New Offer' : item.status === 'offer_made' ? 'Revise Offer' : 'Make Offer'}
                  </p>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Offer Amount (RWF)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-semibold">RWF</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={offerAmount}
                        onChange={e => setOfferAmount(e.target.value)}
                        placeholder="0"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={offerNote}
                    onChange={e => setOfferNote(e.target.value)}
                    placeholder="Add a message to the customer (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  <button
                    disabled={!offerAmount || actionLoading}
                    onClick={() => doAction(item.status === 'negotiating' ? 'counter_offer' : 'offer', {
                      offeredPrice: Math.round(parseFloat(offerAmount)),
                      adminNotes: offerNote,
                    })}
                    className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? 'Sending…' : item.status === 'negotiating' ? 'Send Counter-Offer' : item.status === 'offer_made' ? 'Update Offer' : 'Send Offer'}
                  </button>
                </div>
              )}

              {/* Accept customer's counter */}
              {item.status === 'negotiating' && item.counterPrice > 0 && (
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                  <p className="text-sm font-semibold text-violet-800 mb-1">Customer offered {fmt(item.counterPrice)}</p>
                  {item.userNotes && <p className="text-xs text-violet-700 mb-3">"{item.userNotes}"</p>}
                  <button
                    disabled={actionLoading}
                    onClick={() => doAction('accept_counter')}
                    className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Accepting…' : `Accept ${fmt(item.counterPrice)}`}
                  </button>
                </div>
              )}

              {/* Confirm accepted trade-in */}
              {item.status === 'accepted' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-1">Deal agreed at {fmt(item.finalPrice || item.offeredPrice)}</p>
                  <p className="text-xs text-emerald-700 mb-3">Confirm to generate the customer's coupon code.</p>
                  <button
                    disabled={actionLoading}
                    onClick={() => doAction('confirm')}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Confirming…' : '🎉 Confirm & Issue Coupon'}
                  </button>
                </div>
              )}

              {/* Confirmed — show coupon */}
              {item.status === 'confirmed' && item.couponCode && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-xs text-emerald-600 font-semibold mb-1">Coupon Issued</p>
                  <p className="font-mono text-lg font-bold text-emerald-800">{item.couponCode}</p>
                  <p className="text-xs text-emerald-700 mt-1">Value: {fmt(item.finalPrice)} · Single use</p>
                </div>
              )}

              {/* Reject */}
              {!['rejected', 'confirmed', 'completed'].includes(item.status) && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Reject Trade-In</p>
                  <textarea
                    rows={2}
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:border-red-300 focus:outline-none"
                  />
                  <button
                    disabled={actionLoading}
                    onClick={() => doAction('reject', { adminNotes: rejectNote })}
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejecting…' : 'Reject Trade-In'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
