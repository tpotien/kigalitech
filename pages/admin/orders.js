import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

const STATUS_OPTS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLOR = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-sky-100 text-sky-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped:    'bg-violet-100 text-violet-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('confirmed');
  const [bulkLoading, setBulkLoading] = useState(false);

  function load(opts = {}) {
    const f = opts.filter ?? filter;
    const s = opts.search ?? search;
    const p = opts.page ?? page;
    setLoading(true);
    const params = new URLSearchParams({ limit: '50', page: String(p) });
    if (f !== 'all') params.set('status', f);
    if (s) params.set('search', s);
    fetch(`/api/admin/orders?${params}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders || data);
        setTotal(data.total ?? (data.orders ?? data).length);
        setPages(data.pages ?? 1);
        setLoading(false);
        setSelected(new Set());
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  function applyFilter(f) { setFilter(f); setPage(1); load({ filter: f, page: 1 }); }
  function applySearch() { setSearch(searchInput); setPage(1); load({ search: searchInput, page: 1 }); }
  function goPage(p) { setPage(p); load({ page: p }); }

  const filtered = orders; // server already filtered

  function toggleSelect(id) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(o => o.id)));
  }

  async function updateStatus(id, status) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  async function bulkUpdate() {
    if (!selected.size) return;
    setBulkLoading(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: bulkStatus }),
      })
    ));
    setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, status: bulkStatus } : o));
    setSelected(new Set());
    setBulkLoading(false);
  }

  function exportCSV() {
    const rows = [
      ['Order #', 'Date', 'Customer', 'Email', 'Phone', 'Status', 'Total (RWF)', 'Items', 'Shipping Address'],
      ...filtered.map(o => [
        o.id,
        new Date(o.createdAt).toLocaleDateString(),
        o.shippingName || o.user?.name || '',
        o.shippingEmail || o.user?.email || '',
        o.shippingPhone || '',
        o.status,
        Math.round(o.total),
        (o.items || []).map(i => `${i.name} x${i.quantity}`).join('; '),
        [o.shippingAddress, o.shippingCity].filter(Boolean).join(', '),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function toggleFlag(id, field, current) {
    const body = { [field]: !current };
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, [field]: !current };
      updated.billPrintable = updated.adminConfirmed && updated.paymentConfirmed;
      return updated;
    }));
  }

  return (
    <AdminLayout title="Orders">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', ...STATUS_OPTS].map(s => (
            <button key={s} onClick={() => applyFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <form onSubmit={e => { e.preventDefault(); applySearch(); }} className="flex gap-1">
            <input
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, phone, email, #…"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm w-64 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button type="submit" className="rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold px-4 py-2 text-sm transition">Search</button>
          </form>
          <button onClick={exportCSV}
            className="rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-4 py-2 text-sm transition whitespace-nowrap">
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-sky-50 border border-sky-200 px-5 py-3">
          <span className="text-sm font-semibold text-sky-700">{selected.size} selected</span>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-600">Set status to</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-sky-400">
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={bulkUpdate} disabled={bulkLoading}
            className="rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold px-4 py-1.5 text-sm transition">
            {bulkLoading ? 'Updating…' : 'Apply'}
          </button>
          <button onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="rounded" />
                </th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Admin ✓</th>
                <th className="px-4 py-3">Paid ✓</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(o => (
                <tr key={o.id} className={`hover:bg-slate-50 ${selected.has(o.id) ? 'bg-sky-50/60' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">#{o.id}</p>
                    <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{o.user?.name || o.shippingName || 'Guest'}</p>
                    <p className="text-xs text-slate-400">{o.user?.email || o.shippingEmail || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">RWF {Math.round(o.total).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className={`rounded-full px-2 py-1 text-xs font-semibold border-0 cursor-pointer ${STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFlag(o.id, 'adminConfirmed', o.adminConfirmed)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${o.adminConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                      {o.adminConfirmed ? '✓ Yes' : 'Confirm'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFlag(o.id, 'paymentConfirmed', o.paymentConfirmed)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${o.paymentConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                      {o.paymentConfirmed ? '✓ Paid' : 'Mark Paid'}
                    </button>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/orders/${o.id}`}
                      className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 no-underline">
                      Details
                    </Link>
                    {(o.shippingPhone || o.user?.phoneNumber) && (
                      <a href={`https://wa.me/${(o.shippingPhone || o.user?.phoneNumber || '').replace(/\D/g,'').replace(/^0/,'250')}?text=${encodeURIComponent(`Hi ${o.shippingName || o.user?.name || 'there'}! Your KigaliTech order #${o.id} status: ${o.status}. Track: kigalitechservices.com/orders/${o.id}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#128C7E] hover:bg-[#25D366]/20 no-underline">
                        📱 WA
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm font-semibold text-slate-600">No orders found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Showing {orders.length} of {total} orders</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => goPage(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
              return (
                <button key={p} onClick={() => goPage(p)}
                  className={`rounded-lg border px-3 py-1.5 ${p === page ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={page >= pages} onClick={() => goPage(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
