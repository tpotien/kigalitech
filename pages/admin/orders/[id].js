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
                    <p className="font-bold text-slate-900">RWF {Math.round((item.price / 100) * 1475).toLocaleString()}</p>
                    <p className="text-xs text-slate-400">×{item.quantity}</p>
                    <p className="text-sm font-semibold text-sky-700">RWF {Math.round((item.price * item.quantity / 100) * 1475).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-extrabold text-slate-900">RWF {Math.round((order.total / 100) * 1475).toLocaleString()}</span>
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
              <>
                <a
                  href={(() => {
                    const name = order.shippingName || 'Customer';
                    const msgs = {
                      confirmed: `Hi ${name}! ✅ Your KigaliTech order #${order.id} has been *confirmed* and is being prepared. We'll notify you when it's shipped! 🚀`,
                      processing: `Hi ${name}! 📦 Your KigaliTech order #${order.id} is now being *processed* and packed. Stay tuned!`,
                      shipped: `Hi ${name}! 🚚 Great news — your KigaliTech order #${order.id} is on its way! Our delivery team will contact you shortly. Track your order: https://kigalitechservices.com/orders/${order.id}`,
                      delivered: `Hi ${name}! 🎉 Your KigaliTech order #${order.id} has been *delivered*. Enjoy your new product! If you have any questions, we're here to help.`,
                      cancelled: `Hi ${name}, your KigaliTech order #${order.id} has been *cancelled*. Please contact us at +250 786 276 555 if you have questions.`,
                    };
                    const msg = msgs[order.status] || `Hi ${name}, your KigaliTech order #${order.id} status is now: *${order.status}*. View: https://kigalitechservices.com/orders/${order.id}`;
                    return `https://wa.me/${order.shippingPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 no-underline"
                >
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 32 32" className="h-4 w-4 fill-emerald-600 flex-shrink-0"><path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/></svg>
                    Notify Customer — {order.status}
                  </span>
                  <span>→</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
