import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats);
    fetch('/api/admin/orders').then((r) => r.json()).then(setOrders);
  }, []);

  // Build daily revenue for last 7 days
  const dailyRevenue = (() => {
    const map = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map[key] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in map) map[key] += o.total;
    });
    return Object.entries(map).map(([date, total]) => ({ date, total }));
  })();

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.total), 1);

  // Top categories
  const catRevenue = orders.reduce((acc, o) => {
    o.items?.forEach((item) => {
      const cat = item.product?.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + item.price * item.quantity;
    });
    return acc;
  }, {});
  const topCats = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = Math.max(...topCats.map((c) => c[1]), 1);

  // Status breakdown
  const statusBreakdown = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  return (
    <AdminLayout title="Analytics">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Revenue', value: stats ? `$${(stats.totalRevenue / 100).toFixed(2)}` : '…', icon: '💰' },
          { label: 'Total Orders', value: stats?.totalOrders ?? '…', icon: '🛒' },
          { label: 'Avg Order Value', value: stats?.totalOrders ? `$${((stats.totalRevenue / stats.totalOrders) / 100).toFixed(2)}` : '—', icon: '📊' },
          { label: 'Active Products', value: stats?.totalProducts ?? '…', icon: '📦' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{k.label}</p>
              <span className="text-2xl">{k.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Revenue chart */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Revenue — Last 7 Days</h2>
          <div className="flex items-end gap-3 h-48">
            {dailyRevenue.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-xl bg-sky-500 transition-all"
                  style={{ height: `${(d.total / maxRevenue) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                  title={`$${(d.total / 100).toFixed(2)}`}
                />
                <p className="text-xs text-slate-400 text-center">{d.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Order Status</h2>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-24 text-sm capitalize text-slate-600">{status}</div>
                <div className="flex-1 rounded-full bg-slate-100 h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${(count / orders.length) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 w-6 text-right">{count}</span>
              </div>
            ))}
            {!orders.length && <p className="text-slate-400 text-sm">No orders yet.</p>}
          </div>
        </div>
      </div>

      {/* Top categories */}
      <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Revenue by Category</h2>
        <div className="space-y-3">
          {topCats.map(([cat, revenue]) => (
            <div key={cat} className="flex items-center gap-4">
              <div className="w-28 text-sm text-slate-700 font-medium truncate">{cat}</div>
              <div className="flex-1 rounded-full bg-slate-100 h-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${(revenue / maxCat) * 100}%` }} />
              </div>
              <span className="text-sm font-semibold text-slate-900 w-20 text-right">${(revenue / 100).toFixed(2)}</span>
            </div>
          ))}
          {!topCats.length && <p className="text-slate-400 text-sm">No data yet.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
