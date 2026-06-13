import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

const STATUS_COLOR = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-red-50 text-primary',
  shipped:   'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatCard({ label, value, sub, icon, accent, href }) {
  const content = (
    <div className={`bg-white border border-gray-100 rounded p-5 flex items-start gap-4 hover:border-primary/20 transition-colors`}>
      <div className={`h-11 w-11 rounded flex items-center justify-center flex-shrink-0 ${accent || 'bg-red-50'}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="no-underline block hover:shadow-sm transition-shadow">{content}</Link> : content;
}

function PendingTask({ label, count, href, urgent }) {
  if (!count) return null;
  return (
    <Link href={href} className={`flex items-center justify-between px-4 py-3 rounded text-sm no-underline transition-colors ${
      urgent ? 'bg-red-50 hover:bg-red-100 border border-red-100' : 'bg-amber-50 hover:bg-amber-100 border border-amber-100'
    }`}>
      <span className={`font-medium ${urgent ? 'text-red-800' : 'text-amber-800'}`}>{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${urgent ? 'bg-primary' : 'bg-amber-500'}`}>{count}</span>
    </Link>
  );
}

const QUICK_ACTIONS = [
  { href: '/admin/products/new', label: 'Add New Product', primary: true },
  { href: '/admin/orders', label: 'Manage Orders' },
  { href: '/admin/analytics', label: 'View Analytics' },
  { href: '/admin/coupons', label: 'Coupon Codes' },
  { href: '/admin/repairs', label: 'Repair Tickets' },
  { href: '/admin/bulk-sms', label: 'Bulk SMS' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
  }, []);

  async function refreshSite() {
    setRefreshing(true); setRefreshResult(null);
    try {
      const res = await fetch('/api/admin/revalidate-all', { method: 'POST' });
      const data = await res.json();
      setRefreshResult(`✓ Refreshed ${data.succeeded} pages${data.failed ? ` (${data.failed} failed)` : ''}`);
    } catch { setRefreshResult('Failed to refresh. Try again.'); }
    setRefreshing(false);
  }

  const totalPending =
    (stats?.pendingOrders || 0) + (stats?.openRepairs || 0) +
    (stats?.pendingTradeIns || 0) + (stats?.pendingListings || 0) +
    (stats?.lowStock?.length || 0);

  return (
    <AdminLayout title="Dashboard">

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-400">KigaliTech store performance</p>
        </div>
        <div className="flex items-center gap-3">
          {refreshResult && (
            <span className={`text-sm font-medium ${refreshResult.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
              {refreshResult}
            </span>
          )}
          <button onClick={refreshSite} disabled={refreshing}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium px-4 py-2 rounded text-sm transition-colors flex items-center gap-2">
            <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh Site'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total Revenue" icon="💰" accent="bg-green-50"
          value={stats ? `RWF ${Math.round(stats.totalRevenue).toLocaleString()}` : '…'}
          sub="All time" href="/admin/orders" />
        <StatCard label="Total Orders" icon="📋" accent="bg-blue-50"
          value={stats?.totalOrders} sub={`${stats?.pendingOrders || 0} pending`} href="/admin/orders" />
        <StatCard label="Products" icon="📦" accent="bg-purple-50"
          value={stats?.totalProducts} sub="Active listings" href="/admin/products" />
        <StatCard label="Low Stock" icon="⚠️" accent="bg-amber-50"
          value={stats?.lowStock?.length ?? '…'} sub="Need restocking" href="/admin/products" />
      </div>

      {/* Attention banner */}
      {stats && totalPending > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded px-5 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">{totalPending} action{totalPending !== 1 ? 's' : ''} need your attention</p>
            <p className="text-xs text-amber-700">Review the pending tasks below</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Recent Orders */}
        <div className="bg-white border border-gray-100 rounded overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline no-underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.recentOrders?.length ? stats.recentOrders.map(o => (
              <Link key={o.id} href={`/admin/orders/${o.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 no-underline transition-colors">
                <div className="h-9 w-9 flex items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600 flex-shrink-0">
                  #{o.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{o.user?.name || o.shippingName || 'Guest'}</p>
                  <p className="text-xs text-gray-400">{o.items.length} item{o.items.length !== 1 ? 's' : ''} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">RWF {Math.round(o.total).toLocaleString()}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                </div>
              </Link>
            )) : (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No orders yet.</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Pending tasks */}
          <div className="bg-white border border-gray-100 rounded overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Pending Tasks
                {stats && totalPending > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {totalPending > 9 ? '9+' : totalPending}
                  </span>
                )}
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {stats ? (
                <>
                  <PendingTask label="Orders awaiting confirmation" count={stats.pendingOrders} href="/admin/orders?status=pending" urgent />
                  <PendingTask label="Open repair tickets" count={stats.openRepairs} href="/admin/repairs" urgent={stats.openRepairs > 3} />
                  <PendingTask label="Products low on stock" count={stats.lowStock?.length} href="/admin/products" urgent={stats.lowStock?.length > 5} />
                  <PendingTask label="Trade-in requests" count={stats.pendingTradeIns} href="/admin/trade-ins" />
                  <PendingTask label="Marketplace listings to approve" count={stats.pendingListings} href="/admin/marketplace" />
                  {totalPending === 0 && (
                    <div className="py-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-emerald-700">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-1">Nothing needs attention right now</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-gray-400 text-sm">Loading…</div>
              )}
            </div>
          </div>

          {/* Low stock */}
          <div className="bg-white border border-gray-100 rounded overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">Low Stock</h3>
              <Link href="/admin/products" className="text-sm text-primary hover:underline no-underline">Manage</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {stats?.lowStock?.length ? stats.lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-gray-700 truncate">{p.name}</p>
                  <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 flex-shrink-0">{p.stock} left</span>
                </div>
              )) : (
                <div className="px-5 py-6 text-center text-sm text-emerald-600">✓ All products well stocked</div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-gray-100 rounded p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex items-center justify-center rounded py-2.5 text-sm font-medium no-underline transition-colors ${
                    a.primary ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
