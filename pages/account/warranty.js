import Head from 'next/head';
import Link from 'next/link';
import { getToken } from 'next-auth/jwt';
import prisma from '../../lib/prisma';
import Layout from '../../components/Layout';

// Parse warranty string like "1 Year", "2 Years AppleCare+", "6 Months" into months
function parseWarrantyMonths(warrantyStr) {
  if (!warrantyStr || warrantyStr.trim() === '' || warrantyStr === '—') return null;

  const lower = warrantyStr.toLowerCase();

  // Match patterns like "2 years", "1 year", "6 months", "18 months"
  const yearMatch = lower.match(/(\d+(?:\.\d+)?)\s*year/);
  const monthMatch = lower.match(/(\d+(?:\.\d+)?)\s*month/);

  if (yearMatch) return Math.round(parseFloat(yearMatch[1]) * 12);
  if (monthMatch) return Math.round(parseFloat(monthMatch[1]));

  return null;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getWarrantyStatus(expiryDate) {
  const now = new Date();
  const diffMs = expiryDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Expired', color: 'red', days: diffDays };
  if (diffDays <= 30) return { label: 'Expiring Soon', color: 'amber', days: diffDays };
  return { label: 'Active', color: 'emerald', days: diffDays };
}

const STATUS_STYLES = {
  red: {
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    row: 'border-red-100 dark:border-red-800/40',
    dot: 'bg-red-500',
  },
  amber: {
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    row: 'border-amber-100 dark:border-amber-800/40',
    dot: 'bg-amber-500',
  },
  emerald: {
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    row: 'border-emerald-100 dark:border-emerald-800/40',
    dot: 'bg-emerald-500',
  },
};

export async function getServerSideProps({ req, res }) {
  const token = await getToken({ req });
  if (!token) {
    return { redirect: { destination: '/signin', permanent: false } };
  }

  const orders = await prisma.order.findMany({
    where: { userId: Number(token.id) },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, category: true } },
        },
      },
    },
  });

  // Build warranty entries from order items that have a warranty field
  const warrantyItems = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.warranty || item.warranty.trim() === '' || item.warranty === '—') continue;

      const months = parseWarrantyMonths(item.warranty);
      if (months === null) continue;

      const orderDate = new Date(order.createdAt);
      const expiryDate = addMonths(orderDate, months);
      const status = getWarrantyStatus(expiryDate);

      let images = [];
      try { images = JSON.parse(item.product?.images || '[]'); } catch {}

      warrantyItems.push({
        orderItemId: item.id,
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        category: item.product?.category || '',
        image: images[0] || null,
        orderDate: order.createdAt.toISOString(),
        warranty: item.warranty,
        months,
        expiryDate: expiryDate.toISOString(),
        statusLabel: status.label,
        statusColor: status.color,
        daysRemaining: status.days,
      });
    }
  }

  // Sort: expiring soon first, then active (soonest expiry first), then expired
  warrantyItems.sort((a, b) => {
    const order = { 'Expiring Soon': 0, 'Active': 1, 'Expired': 2 };
    if (order[a.statusLabel] !== order[b.statusLabel]) return order[a.statusLabel] - order[b.statusLabel];
    return new Date(a.expiryDate) - new Date(b.expiryDate);
  });

  return { props: { warrantyItems } };
}

export default function WarrantyPage({ warrantyItems }) {
  const activeCount = warrantyItems.filter(w => w.statusColor === 'emerald').length;
  const expiringSoonCount = warrantyItems.filter(w => w.statusColor === 'amber').length;
  const expiredCount = warrantyItems.filter(w => w.statusColor === 'red').length;

  return (
    <Layout>
      <Head>
        <title>Warranty Tracker — KigaliTech</title>
        <meta name="description" content="Track your product warranties and get alerts before they expire." />
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/account" className="text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 no-underline">
                Account
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Warranty Tracker</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Warranty Tracker</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track warranties for all your purchased products
            </p>
          </div>

          {/* Summary cards */}
          {warrantyItems.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 p-4 text-center">
                <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{activeCount}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">Active</p>
              </div>
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 p-4 text-center">
                <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">{expiringSoonCount}</p>
                <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-500">Expiring Soon</p>
              </div>
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 p-4 text-center">
                <p className="text-3xl font-extrabold text-red-700 dark:text-red-400">{expiredCount}</p>
                <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-500">Expired</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {warrantyItems.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                <svg className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No warranties found</h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Warranties from your purchased products will appear here once the order includes warranty information.
              </p>
              <Link href="/products" className="mt-6 inline-block rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 no-underline">
                Shop Products
              </Link>
            </div>
          ) : (
            /* Warranty table */
            <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Order Date</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Warranty</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Expiry Date</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {warrantyItems.map((item) => {
                      const styles = STATUS_STYLES[item.statusColor];
                      const expiryDate = new Date(item.expiryDate);
                      const orderDate = new Date(item.orderDate);
                      return (
                        <tr key={item.orderItemId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                                {item.image ? (
                                  <img src={item.image} alt={item.productName} className="h-full w-full object-contain p-1" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-slate-300">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <Link href={`/products/${item.productId}`} className="font-medium text-slate-900 dark:text-slate-100 text-sm hover:text-sky-700 no-underline line-clamp-1">
                                  {item.productName}
                                </Link>
                                <p className="text-[11px] text-sky-600 font-semibold uppercase tracking-wider mt-0.5">{item.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{item.warranty}</span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${styles.dot}`} />
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles.badge}`}>
                                {item.statusLabel}
                              </span>
                              {item.statusColor === 'amber' && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                                  {item.daysRemaining}d left
                                </span>
                              )}
                              {item.statusColor === 'red' && (
                                <span className="text-xs text-red-500 dark:text-red-400 font-medium whitespace-nowrap">
                                  {Math.abs(item.daysRemaining)}d ago
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-50 dark:divide-slate-800">
                {warrantyItems.map((item) => {
                  const styles = STATUS_STYLES[item.statusColor];
                  const expiryDate = new Date(item.expiryDate);
                  const orderDate = new Date(item.orderDate);
                  return (
                    <div key={item.orderItemId} className={`p-5 border-l-4 ${
                      item.statusColor === 'emerald' ? 'border-l-emerald-400' :
                      item.statusColor === 'amber' ? 'border-l-amber-400' :
                      'border-l-red-400'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="h-full w-full object-contain p-1" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/products/${item.productId}`} className="font-semibold text-slate-900 dark:text-slate-100 text-sm hover:text-sky-700 no-underline line-clamp-1">
                              {item.productName}
                            </Link>
                            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${styles.badge}`}>
                              {item.statusLabel}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <div>
                              <span className="font-medium text-slate-400">Warranty</span>
                              <p className="text-slate-700 dark:text-slate-300 font-medium">{item.warranty}</p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-400">Purchased</span>
                              <p className="text-slate-700 dark:text-slate-300">{orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-400">Expires</span>
                              <p className={`font-medium ${
                                item.statusColor === 'red' ? 'text-red-600 dark:text-red-400' :
                                item.statusColor === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                                'text-slate-700 dark:text-slate-300'
                              }`}>
                                {expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            {item.statusColor === 'amber' && (
                              <div>
                                <span className="font-medium text-slate-400">Time left</span>
                                <p className="font-bold text-amber-600 dark:text-amber-400">{item.daysRemaining} days</p>
                              </div>
                            )}
                            {item.statusColor === 'red' && (
                              <div>
                                <span className="font-medium text-slate-400">Expired</span>
                                <p className="font-bold text-red-600 dark:text-red-400">{Math.abs(item.daysRemaining)} days ago</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <Link href={`/orders/${item.orderId}`} className="text-xs font-medium text-sky-600 hover:text-sky-700 no-underline">
                              View Order #{item.orderId} →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer note */}
          {warrantyItems.length > 0 && (
            <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              Warranty expiry is calculated from your order date. Contact us to verify manufacturer warranty coverage.
            </p>
          )}

        </div>
      </div>
    </Layout>
  );
}
