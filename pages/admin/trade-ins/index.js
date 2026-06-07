import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

const STATUS_META = {
  pending:     { label: 'Pending Review',  color: 'bg-slate-100 text-slate-600' },
  offer_made:  { label: 'Offer Made',      color: 'bg-sky-100 text-sky-700' },
  negotiating: { label: 'Negotiating',     color: 'bg-violet-100 text-violet-700' },
  accepted:    { label: 'Accepted',        color: 'bg-emerald-100 text-emerald-700' },
  rejected:    { label: 'Rejected',        color: 'bg-red-100 text-red-700' },
  confirmed:   { label: 'Confirmed',       color: 'bg-emerald-600 text-white' },
  completed:   { label: 'Completed',       color: 'bg-slate-600 text-white' },
};

const CONDITION_LABEL = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor' };

export default function AdminTradeIns() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all' ? '/api/admin/trade-ins' : `/api/admin/trade-ins?status=${filter}`;
    fetch(url).then(r => r.json()).then(data => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'offer_made', label: 'Offer Sent' },
    { id: 'negotiating', label: 'Negotiating' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const needsAction = items.filter(i => ['pending', 'negotiating', 'accepted'].includes(i.status));

  return (
    <AdminLayout title="Trade-Ins">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trade-In Requests</h1>
          {needsAction.length > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-0.5">{needsAction.length} item{needsAction.length !== 1 ? 's' : ''} need your attention</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === t.id ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 py-20 text-center">
          <p className="text-slate-400">No trade-in requests found</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {items.map(item => {
              const meta = STATUS_META[item.status] || STATUS_META.pending;
              const actionNeeded = ['pending', 'negotiating', 'accepted'].includes(item.status);
              return (
                <Link
                  key={item.id}
                  href={`/admin/trade-ins/${item.id}`}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 no-underline transition-colors ${actionNeeded ? 'bg-amber-50/30' : ''}`}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600 overflow-hidden">
                    {item.user?.image
                      ? <img src={item.user.image} alt="" className="h-full w-full object-cover" />
                      : (item.user?.name || '?')[0].toUpperCase()
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.productName}</p>
                      {item.brand && <span className="text-xs text-slate-400">{item.brand}</span>}
                      {actionNeeded && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.user?.name || item.user?.email} · {CONDITION_LABEL[item.condition] || item.condition} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {item.askingPrice > 0 && <span>Asked: ${(item.askingPrice / 100).toFixed(0)}</span>}
                      {item.offeredPrice > 0 && <span className="text-sky-600">Offered: ${(item.offeredPrice / 100).toFixed(0)}</span>}
                      {item.counterPrice > 0 && <span className="text-violet-600">Counter: ${(item.counterPrice / 100).toFixed(0)}</span>}
                      {item.finalPrice > 0 && <span className="font-bold text-emerald-700">Final: ${(item.finalPrice / 100).toFixed(0)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
