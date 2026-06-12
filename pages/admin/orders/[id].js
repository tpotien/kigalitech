import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

const STATUS_OPTS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLOR = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-sky-100 text-sky-700', processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-violet-100 text-violet-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

function parse(val) { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; } }
function rwf(n) { return `RWF ${Math.round(n).toLocaleString()}`; }

function AdminNoteBox({ order, onSave }) {
  const [note, setNote] = useState(order?.adminNote || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setNote(order?.adminNote || ''); }, [order?.adminNote]);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNote: note }),
    });
    setSaving(false);
    setSaved(true);
    onSave(note);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
      <h2 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
        📝 Internal Note <span className="text-xs font-normal text-amber-600">(only visible to admin)</span>
      </h2>
      <textarea
        value={note} onChange={e => setNote(e.target.value)} rows={3}
        placeholder="Add notes about this order, e.g. customer called, hold until Friday…"
        className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none"
      />
      <button onClick={save} disabled={saving}
        className="mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-4 py-2 text-sm transition">
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Note'}
      </button>
    </div>
  );
}

export default function AdminOrderDetail() {
  const { query } = useRouter();
  const [order, setOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

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

  function handlePrint() {
    if (!order) return;
    const items = (order.items || []).map(item => `
      <tr>
        <td style="padding:5px 8px 5px 0;vertical-align:top;font-size:12px">
          <div style="font-weight:bold">${item.name}</div>
          ${item.color ? `<div style="font-size:10px;color:#555">${[item.color, item.storage].filter(Boolean).join(' · ')}</div>` : ''}
          ${item.serial && item.serial !== 'TBD' ? `<div style="font-size:10px;color:#555">S/N: ${item.serial}</div>` : ''}
          <div style="font-size:10px;color:#555">Warranty: ${item.warranty}</div>
        </td>
        <td style="text-align:right;padding:5px 0;font-size:12px;white-space:nowrap">${item.quantity}</td>
        <td style="text-align:right;padding:5px 0;font-size:12px;white-space:nowrap">${rwf(item.price)}</td>
        <td style="text-align:right;padding:5px 0;font-size:12px;font-weight:bold;white-space:nowrap">${rwf(item.price * item.quantity)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order #${order.id} — KigaliTech</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: monospace; font-size: 13px; color: #000; background: #fff; padding: 24px; }
  .wrap { max-width: 420px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style></head><body>
<div class="wrap">
  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:12px">
    <p style="font-weight:bold;font-size:18px;margin-bottom:2px">KigaliTech Services</p>
    <p style="font-size:11px">KG 7 Ave, Kigali, Rwanda</p>
    <p style="font-size:11px">Tel: +250 786 276 555</p>
    <p style="font-size:11px">info@kigalitechservices.com</p>
  </div>
  <div style="text-align:center;margin-bottom:12px">
    <p style="font-weight:bold;font-size:15px">SALES RECEIPT</p>
    <p style="font-size:11px;margin-top:2px">Order #${order.id} · ${new Date(order.createdAt).toLocaleString('en-RW')}</p>
  </div>
  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:8px 0;margin-bottom:12px">
    <p style="font-weight:bold">Customer</p>
    <p style="margin-top:2px">${order.shippingName || order.user?.name || '—'}</p>
    ${order.shippingPhone ? `<p style="font-size:11px;margin-top:1px">${order.shippingPhone}</p>` : ''}
    ${(order.shippingEmail || order.user?.email) ? `<p style="font-size:11px;margin-top:1px">${order.shippingEmail || order.user?.email}</p>` : ''}
    ${order.shippingAddress ? `<p style="font-size:11px;margin-top:1px">${order.shippingAddress}</p>` : ''}
  </div>
  <table style="margin-bottom:12px">
    <thead><tr style="border-bottom:1px solid #000">
      <th style="text-align:left;padding-bottom:4px;font-size:12px">Item</th>
      <th style="text-align:right;padding-bottom:4px;font-size:12px">Qty</th>
      <th style="text-align:right;padding-bottom:4px;font-size:12px">Price</th>
      <th style="text-align:right;padding-bottom:4px;font-size:12px">Total</th>
    </tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div style="border-top:1px dashed #000;padding-top:8px;margin-bottom:12px">
    ${order.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>Discount${order.couponCode ? ` (${order.couponCode})` : ''}</span><span>-${rwf(order.discountAmount)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;border-top:1px solid #000;padding-top:6px;margin-top:4px">
      <span>TOTAL</span><span>${rwf(order.total)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px"><span>Payment</span><span>${order.paymentMethod || '—'}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:2px"><span>Status</span><span style="font-weight:bold">${order.paymentConfirmed ? 'PAID ✓' : 'PENDING'}</span></div>
  </div>
  <div style="text-align:center;border-top:1px dashed #000;padding-top:10px;font-size:11px">
    <p style="font-weight:bold">Thank you for shopping at KigaliTech!</p>
    <p style="margin-top:4px">Warranty: +250 786 276 555</p>
    <p style="margin-top:2px">kigalitechservices.com</p>
    <p style="margin-top:8px;font-size:10px;color:#666">Printed ${new Date().toLocaleString('en-RW')}</p>
  </div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;
    const existing = document.getElementById('__order-print-frame');
    if (existing) existing.remove();
    const iframe = document.createElement('iframe');
    iframe.id = '__order-print-frame';
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:600px;height:800px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    iframe.onload = () => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } }
      setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 2000);
    };
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
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-2.5 text-left">Item</th>
                  <th className="px-3 py-2.5 text-center">Qty</th>
                  <th className="px-3 py-2.5 text-right">Unit Price</th>
                  <th className="px-6 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {images0(item) && <img src={images0(item)} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{[item.color, item.storage, item.warranty && `Warranty: ${item.warranty}`].filter(Boolean).join(' · ')}</p>
                          {item.serial && item.serial !== 'TBD' && <p className="text-xs text-slate-400">S/N: {item.serial}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center font-semibold text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-4 text-right text-slate-700">RWF {Math.round(item.price).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">RWF {Math.round(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-extrabold text-slate-900">RWF {Math.round(order.total).toLocaleString()}</span>
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
              {order.billPrintable ? '🖨 Bill Unlocked for Customer' : '🔒 Bill Locked — Awaiting Confirmation'}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Print
              </button>
              {['confirmed','delivered','processing','shipped'].includes(order.status) && (
                <button
                  type="button"
                  onClick={() => setReceiptOpen(v => !v)}
                  className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  {receiptOpen ? 'Hide' : 'Receipt'}
                </button>
              )}
            </div>

            {/* Inline receipt preview */}
            {receiptOpen && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 space-y-1 mt-1">
                <div className="text-center font-bold text-sm mb-2">KigaliTech Services</div>
                <div className="text-center text-[10px] text-slate-500 mb-3">KG 7 Ave, Kigali · +250 786 276 555</div>
                <div className="border-t border-dashed border-slate-300 pt-2 mb-2">
                  <div className="font-bold">Order #{order.id}</div>
                  <div className="text-slate-500">{new Date(order.createdAt).toLocaleString('en-RW')}</div>
                  <div className="mt-1">{order.shippingName || order.user?.name}</div>
                </div>
                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <span className="flex-1 truncate">{item.name} ×{item.quantity}</span>
                      <span className="flex-shrink-0">{rwf(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-bold">
                  <span>TOTAL</span><span>{rwf(order.total)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment</span><span>{order.paymentMethod || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span><span className="font-bold">{order.paymentConfirmed ? 'PAID ✓' : 'PENDING'}</span>
                </div>
                <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">Thank you for shopping at KigaliTech!</div>
              </div>
            )}
          </div>

          <AdminNoteBox order={order} onSave={note => setOrder(o => ({ ...o, adminNote: note }))} />

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
