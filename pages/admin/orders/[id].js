import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

const STATUS_OPTS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLOR = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-sky-100 text-sky-700', processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-violet-100 text-violet-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

function parse(val) { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; } }

export default function AdminOrderDetail() {
  const { query } = useRouter();
  const [order, setOrder] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.id) fetch(`/api/admin/orders/${query.id}`).then((r) => r.json()).then(setOrder);
  }, [query.id]);

  async function patch(fields) {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    const updated = await res.json();
    setOrder(updated);
    setSaving(false);
  }

  if (!order) return <AdminLayout title="Order"><div className="py-20 text-center text-slate-400">Loading...</div></AdminLayout>;

  const images0 = (item) => { const imgs = parse(item.product?.images); return imgs[0]; };

  return (
    <AdminLayout title={`Order #${order.id}`}>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-sky-600">← All Orders</Link>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-600'}`}>{order.status}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Order items */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Items ({(order.items || []).length})</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex gap-4 px-6 py-4">
                  {images0(item) && <img src={images0(item)} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.color} · {item.storage} · Warranty: {item.warranty}</p>
                    <p className="text-xs text-slate-400">Serial: {item.serial}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${(item.price / 100).toFixed(2)}</p>
                    <p className="text-xs text-slate-400">×{item.quantity}</p>
                    <p className="text-sm font-semibold text-sky-700">${((item.price * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-extrabold text-slate-900">${(order.total / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Customer info */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Customer</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {[
                { label: 'Name', value: order.user?.name || order.shippingName },
                { label: 'Email', value: order.user?.email || order.shippingEmail },
                { label: 'Phone', value: order.shippingPhone },
                { label: 'Payment', value: order.paymentMethod },
                { label: 'Address', value: order.shippingAddress },
                { label: 'Notes', value: order.notes },
              ].map(({ label, value }) => value ? (
                <div key={label}>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="font-medium text-slate-800 mt-0.5">{value}</p>
                </div>
              ) : null)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Order Status</h2>
            <select
              value={order.status}
              onChange={(e) => patch({ status: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Approval & Payment</h2>
            <p className="text-xs text-slate-400">Customer can only print their bill after BOTH are confirmed.</p>

            <button
              onClick={() => patch({ adminConfirmed: !order.adminConfirmed })}
              disabled={saving}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition ${order.adminConfirmed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
            >
              {order.adminConfirmed ? '✓ Admin Confirmed' : 'Confirm Order'}
            </button>

            <button
              onClick={() => patch({ paymentConfirmed: !order.paymentConfirmed })}
              disabled={saving}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition ${order.paymentConfirmed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
            >
              {order.paymentConfirmed ? '✓ Payment Confirmed' : 'Mark as Paid'}
            </button>

            <div className={`rounded-xl p-3 text-center text-sm font-semibold ${order.billPrintable ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
              {order.billPrintable ? '🖨 Bill Unlocked for Printing' : '🔒 Bill Locked — Awaiting Confirmation'}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-2">
            <h2 className="font-semibold text-slate-900 mb-1">Links</h2>
            <Link href={`/orders/${order.id}`} target="_blank" className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 no-underline">
              View Receipt Page <span>→</span>
            </Link>
            {order.shippingPhone && (
              <a
                href={`https://wa.me/${order.shippingPhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(order.shippingName || '')}%2C%20your%20order%20%23${order.id}%20is%20${order.status}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-100 no-underline"
              >
                📱 WhatsApp Customer <span>→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
