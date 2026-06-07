import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

function StatCard({ label, value, sub, color, href }) {
  const content = (
    <div className={`rounded-2xl border p-5 ${color || 'border-slate-200 bg-white'}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-900">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="no-underline hover:opacity-90 transition-opacity">{content}</Link> : content;
}

const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function PendingTask({ icon, label, count, href, urgent }) {
  if (!count) return null;
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-4 py-3 no-underline transition-colors ${
        urgent ? 'bg-red-50 hover:bg-red-100 border border-red-100' : 'bg-amber-50 hover:bg-amber-100 border border-amber-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className={`text-sm font-medium ${urgent ? 'text-red-800' : 'text-amber-800'}`}>{label}</span>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${urgent ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
        {count}
      </span>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats);
  }, []);

  const totalPending =
    (stats?.pendingOrders || 0) +
    (stats?.openRepairs || 0) +
    (stats?.pendingTradeIns || 0) +
    (stats?.pendingListings || 0) +
    (stats?.lowStock?.length || 0);

  return (
    <AdminLayout title="Dashboard">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Total Revenue" value={stats ? `RWF ${Math.round((stats.totalRevenue / 100) * 1475).toLocaleString()}` : '…'} sub="All time" href="/admin/orders" />
        <StatCard label="Total Orders" value={stats?.totalOrders} sub={`${stats?.pendingOrders || 0} pending`} href="/admin/orders" />
        <StatCard label="Products" value={stats?.totalProducts} sub="Active listings" href="/admin/products" />
        <StatCard
          label="Low Stock"
          value={stats?.lowStock?.length ?? '…'}
          sub="Need restocking"
          color={stats?.lowStock?.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}
        />
      </div>

      {/* Attention banner */}
      {stats && totalPending > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="font-bold text-amber-900">
              {totalPending} action{totalPending !== 1 ? 's' : ''} need{totalPending === 1 ? 's' : ''} your attention
            </p>
            <p className="text-sm text-amber-700">Review the pending tasks in the panel below</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Recent Orders */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-sky-600 hover:text-sky-800">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.recentOrders?.length ? stats.recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 no-underline">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                  #{o.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{o.user?.name || o.shippingName || 'Guest'}</p>
                  <p className="text-xs text-slate-500">{o.items.length} item{o.items.length !== 1 ? 's' : ''} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">RWF {Math.round((o.total / 100) * 1475).toLocaleString()}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-600'}`}>
                    {o.status}
                  </span>
                </div>
              </Link>
            )) : (
              <div className="px-6 py-10 text-center text-slate-400">No orders yet.</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Pending tasks widget */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                Pending Tasks
                {stats && totalPending > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {totalPending > 9 ? '9+' : totalPending}
                  </span>
                )}
              </h2>
            </div>
            <div className="p-4 space-y-2">
              {stats ? (
                <>
                  <PendingTask
                    icon="🛒"
                    label="Orders awaiting confirmation"
                    count={stats.pendingOrders}
                    href="/admin/orders?status=pending"
                    urgent
                  />
                  <PendingTask
                    icon="🔧"
                    label="Open repair tickets"
                    count={stats.openRepairs}
                    href="/admin/repairs"
                    urgent={stats.openRepairs > 3}
                  />
                  <PendingTask
                    icon="⚠️"
                    label="Products low on stock"
                    count={stats.lowStock?.length}
                    href="/admin/products"
                    urgent={stats.lowStock?.length > 5}
                  />
                  <PendingTask
                    icon="🔄"
                    label="Trade-in requests"
                    count={stats.pendingTradeIns}
                    href="/admin/trade-ins"
                  />
                  <PendingTask
                    icon="🏪"
                    label="Marketplace listings to approve"
                    count={stats.pendingListings}
                    href="/admin/marketplace"
                  />
                  {totalPending === 0 && (
                    <div className="py-6 text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-sm font-semibold text-emerald-700">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-0.5">Nothing needs attention right now</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-slate-400 text-sm">Loading…</div>
              )}
            </div>
          </div>

          {/* Low stock detail */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">⚠️ Low Stock</h2>
              <Link href="/admin/products" className="text-sm text-sky-600">Manage</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {stats?.lowStock?.length ? stats.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-slate-700 truncate">{p.name}</p>
                  <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{p.stock} left</span>
                </div>
              )) : (
                <div className="px-5 py-6 text-center text-sm text-emerald-600">✓ All products well stocked</div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: '/admin/products/new', label: '+ Add New Product', color: 'bg-sky-600 text-white hover:bg-sky-700' },
                { href: '/admin/orders', label: '📋 Manage Orders', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { href: '/admin/staff', label: '👥 Manage Staff', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { href: '/admin/coupons', label: '🏷️ Coupon Codes', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { href: '/admin/repairs', label: '🔧 Repair Tickets', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { href: '/admin/analytics', label: '📈 View Analytics', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
              ].map((a) => (
                <Link key={a.href} href={a.href} className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium no-underline transition-colors ${a.color}`}>
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
