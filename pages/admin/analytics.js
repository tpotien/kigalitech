import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#0ea5e9',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};
const PIE_FALLBACK = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];

function fmt(cents) {
  return `RWF ${Math.round(cents).toLocaleString()}`;
}

function Trend({ current, prev }) {
  if (!prev) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  const up = pct >= 0;
  return (
    <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 shadow-xl border border-white/10 text-white text-xs">
      <p className="font-semibold mb-1 text-slate-300">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey === 'revenue' ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [visitors, setVisitors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/analytics-data').then(r => r.json()),
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/visitors').then(r => r.ok ? r.json() : null),
    ]).then(([analyticsData, statsData, visitorData]) => {
      setData(analyticsData);
      setStats(statsData);
      setVisitors(visitorData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const { daily, statusData, topProductsData, summary } = data;

  const kpis = [
    {
      label: '30-Day Revenue',
      value: fmt(summary.periodRevenue),
      sub: `This week vs last`,
      trend: <Trend current={summary.currentWeekRevenue} prev={summary.prevWeekRevenue} />,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-sky-600 bg-sky-50',
    },
    {
      label: '30-Day Orders',
      value: summary.periodOrders.toLocaleString(),
      sub: `${summary.totalOrders} all time`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'All-Time Revenue',
      value: fmt(summary.totalRevenue),
      sub: `Avg ${summary.totalOrders ? fmt(summary.totalRevenue / summary.totalOrders) : 'RWF 0'}/order`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Low Stock Items',
      value: stats?.lowStock?.length ?? 0,
      sub: `${stats?.totalProducts ?? 0} total products`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <AdminLayout title="Analytics">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{k.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl font-extrabold text-slate-900">{k.value}</p>
                  {k.trend}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${k.color}`}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Visitor Analytics */}
      {visitors && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-slate-900">Site Visitors</h2>
            <span className="text-xs text-slate-400 bg-sky-50 text-sky-600 rounded-full px-2 py-0.5 font-medium">Last 30 days</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            {[
              { label: 'Today', value: visitors.todayViews.toLocaleString() },
              { label: 'This Week', value: visitors.weekViews.toLocaleString() },
              { label: '30-Day Total', value: visitors.totalViews.toLocaleString() },
            ].map(k => (
              <div key={k.label} className="rounded-2xl bg-white border border-slate-200 p-5">
                <p className="text-sm text-slate-500">{k.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">page views</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Visitor chart */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm">Daily Visitors — Last 14 Days</h3>
              {visitors.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={visitors.daily} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="views" name="Views" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No visitor data yet — it accumulates as people browse the site</div>
              )}
            </div>
            {/* Top pages */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm">Top Pages</h3>
              {visitors.topPages.length > 0 ? (
                <div className="space-y-2">
                  {visitors.topPages.map((p, i) => (
                    <div key={p.path} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-400 w-4 flex-shrink-0">{i + 1}</span>
                        <span className="text-xs text-slate-600 truncate font-mono">{p.path}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 flex-shrink-0">{p.views.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">No page data yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Line Chart */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900">Revenue — Last 30 Days</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daily revenue trend</p>
          </div>
          <span className="text-sm font-semibold text-sky-600">{fmt(summary.periodRevenue)} total</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={daily} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tickFormatter={(v) => `RWF ${Math.round(v).toLocaleString()}`}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column: Top products + Status pie */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mb-6">

        {/* Top Products Bar Chart */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="font-bold text-slate-900">Top Products by Units Sold</h2>
            <p className="text-xs text-slate-400 mt-0.5">All time</p>
          </div>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="qty" name="Units" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">Orders by Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 30 days</p>
          </div>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || PIE_FALLBACK[i % PIE_FALLBACK.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.name] || PIE_FALLBACK[i % PIE_FALLBACK.length] }} />
                      <span className="capitalize text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No orders in last 30 days</div>
          )}
        </div>
      </div>

      {/* Orders per day bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6">
        <div className="mb-6">
          <h2 className="font-bold text-slate-900">Order Volume — Last 30 Days</h2>
          <p className="text-xs text-slate-400 mt-0.5">Number of orders per day</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={daily} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" name="Orders" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Google Analytics section */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-2">
              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.004 0C5.374 0 0 5.373 0 12s5.374 12 12.004 12C18.626 24 24 18.627 24 12S18.626 0 12.004 0zm-1.498 16.866l-2.994-2.994L15.858 6.52l2.994 2.994-8.346 7.352zm-.996 2.617l-4.49-4.49 9.338-8.183 4.49 4.49-9.338 8.183z"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Google Analytics</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracking active — Measurement ID: <span className="font-mono text-sky-600">G-5M0HWXKDNP</span>
              </p>
            </div>
          </div>
          <a
            href="https://analytics.google.com/analytics/web/#/p{your-property-id}/reports"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 no-underline transition-colors"
          >
            Open GA Dashboard →
          </a>
        </div>
        <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
          <p className="text-xs text-emerald-700">GA4 is active. Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">analytics.google.com</a>, select your KigaliTech property, and view Realtime / Reports for live visitor data.</p>
        </div>
      </div>

      {/* Low stock alert table */}
      {stats?.lowStock?.length > 0 && (
        <div className="rounded-2xl bg-white border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-amber-100 p-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Low Stock Alert</h2>
              <p className="text-xs text-slate-400">{stats.lowStock.length} product{stats.lowStock.length !== 1 ? 's' : ''} need restocking</p>
            </div>
          </div>
          <div className="space-y-2">
            {stats.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-2.5">
                <span className="text-sm font-medium text-slate-700 truncate">{p.name}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-amber-600 font-bold">{p.stock} left</span>
                  <span className="text-xs text-slate-400">threshold: {p.lowStockThreshold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
