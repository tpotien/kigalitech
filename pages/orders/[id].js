import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useLang } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

function parse(val) { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return {}; } }

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const DELIVERY_STEPS = [
  { key: 'order_placed',    icon: '📋', label: 'Order Placed',      desc: 'We received your order' },
  { key: 'confirmed',       icon: '✅', label: 'Confirmed',          desc: 'Order confirmed by our team' },
  { key: 'packed',          icon: '📦', label: 'Packed',             desc: 'Items packed and ready' },
  { key: 'out_for_delivery',icon: '🚚', label: 'Out for Delivery',   desc: 'On the way to you' },
  { key: 'delivered',       icon: '🏠', label: 'Delivered',          desc: 'Arrived at destination' },
];

function fiDeliveryTracker({ order }) {
  const tracking = parse(order.deliveryTracking || '{}');
  const status = order.status;

  const statusToStep = {
    pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4,
  };
  const currentStep = statusToStep[status] ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚚</span>
          <h3 className="font-semibold text-slate-900">Delivery Tracking</h3>
        </div>
        {tracking.trackingNumber && (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-mono font-semibold text-sky-700">
            {tracking.trackingNumber}
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="px-6 py-5">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />
          <div
            className="absolute left-5 top-5 w-0.5 bg-sky-500 transition-all duration-700"
            style={{ height: `${(currentStep / (DELIVERY_STEPS.length - 1)) * 100}%` }}
          />

          <div className="space-y-6">
            {DELIVERY_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              const future = i > currentStep;
              return (
                <div key={step.key} className="relative flex items-start gap-4 pl-14">
                  {/* Icon circle */}
                  <div className={`absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 text-base transition-all ${
                    done ? 'border-emerald-400 bg-emerald-50'
                    : active ? 'border-sky-500 bg-sky-50 ring-4 ring-sky-100'
                    : 'border-slate-200 bg-white'
                  }`}>
                    {done ? '✓' : <span className={future ? 'opacity-30' : ''}>{step.icon}</span>}
                  </div>

                  <div className={`flex-1 pb-1 ${future ? 'opacity-40' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${active ? 'text-sky-700' : done ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {step.label}
                        {active && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />}
                      </p>
                      {tracking[step.key]?.time && (
                        <p className="text-xs text-slate-400">{new Date(tracking[step.key].time).toLocaleString()}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tracking[step.key]?.note || step.desc}</p>
                    {tracking[step.key]?.location && (
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">📍 {tracking[step.key].location}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Courier info */}
      {(tracking.courier || tracking.estimatedDelivery) && (
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-wrap gap-4 text-sm">
          {tracking.courier && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Courier</p>
              <p className="font-semibold text-slate-900 mt-0.5">{tracking.courier}</p>
            </div>
          )}
          {tracking.estimatedDelivery && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Est. Delivery</p>
              <p className="font-semibold text-slate-900 mt-0.5">{tracking.estimatedDelivery}</p>
            </div>
          )}
          {tracking.driverName && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Driver</p>
              <p className="font-semibold text-slate-900 mt-0.5">{tracking.driverName}</p>
            </div>
          )}
          {tracking.driverPhone && (
            <a href={`tel:${tracking.driverPhone}`} className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white no-underline hover:bg-emerald-600 ml-auto">
              📞 Call Driver
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function InstallmentCard({ order }) {
  const { format } = useCurrency();
  const plan = parse(order.installmentPlan || '{}');
  if (!order.installmentMonths || order.installmentMonths === 0) return null;

  const paid = 1; // first payment at delivery
  const remaining = order.installmentMonths - paid;
  const monthly = plan.monthly || Math.ceil(order.total / order.installmentMonths);

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💳</span>
        <h3 className="font-semibold text-sky-900">Installment Plan</h3>
        <span className="ml-auto rounded-full bg-sky-200 px-3 py-0.5 text-xs font-semibold text-sky-800">{order.installmentMonths} months</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-white p-3 border border-sky-100">
          <p className="text-xs text-slate-500 mb-1">Monthly</p>
          <p className="font-extrabold text-sky-700">{format(monthly)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-sky-100">
          <p className="text-xs text-slate-500 mb-1">Paid</p>
          <p className="font-extrabold text-emerald-600">{paid} of {order.installmentMonths}</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-sky-100">
          <p className="text-xs text-slate-500 mb-1">Remaining</p>
          <p className="font-extrabold text-slate-900">{remaining} payments</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-sky-600">Next payment due 30 days after delivery. Contact us to adjust your payment schedule.</p>
    </div>
  );
}

export default function OrderPage() {
  const { query } = useRouter();
  const { t } = useLang();
  const { format } = useCurrency();
  const [order, setOrder] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ reason: '', description: '' });
  const [returning, setReturning] = useState(false);
  const [returnDone, setReturnDone] = useState(false);
  const eventRef = useRef(null);

  useEffect(() => {
    if (!query.id) return;
    fetch(`/api/orders/${query.id}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setOrder)
      .catch(() => setFetchError(true));

    const sse = new EventSource(`/api/orders/sse?orderId=${query.id}`);
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type !== 'ping') setOrder((prev) => prev ? { ...prev, ...data } : data);
      } catch {}
    };
    eventRef.current = sse;
    return () => sse.close();
  }, [query.id]);

  if (fetchError) return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-5xl">🔍</span>
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <p className="text-slate-500 text-sm max-w-xs">This order may not exist or you may not have access to it.</p>
        <Link href="/account" className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 no-underline transition-all">
          My Orders
        </Link>
      </div>
    </Layout>
  );

  if (!order) return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    </Layout>
  );

  async function handleReturn(e) {
    e.preventDefault();
    setReturning(true);
    const res = await fetch(`/api/orders/${order.id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnForm),
    });
    if (res.ok) {
      setReturnDone(true);
      setReturnModal(false);
      setOrder(prev => ({ ...prev, returnRequest: { status: 'pending' } }));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Could not submit return. Please contact support.');
    }
    setReturning(false);
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Layout>
      <style global jsx>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body { background: white !important; font-size: 12px; }
          .print-area { max-width: 100% !important; padding: 0 !important; }
          .receipt-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
        @page { margin: 1cm; }
      `}</style>

      <div className="print-area mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Back + Actions */}
        <div className="no-print mb-6 flex items-center justify-between gap-2 flex-wrap">
          <Link href="/account" className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 no-underline">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            My Orders
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {order.status === 'delivered' && !order.returnRequest && (
              <button onClick={() => setReturnModal(true)}
                className="flex items-center gap-1.5 rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 active:scale-95 transition-all">
                ↩ Return
              </button>
            )}
            {order.returnRequest && (
              <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                Return: {order.returnRequest.status}
              </span>
            )}
            {order.billPrintable && (
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-lg shadow-sky-200 active:scale-95 transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {t('printReceipt')}
              </button>
            )}
          </div>
        </div>

        {/* Return submitted banner */}
        {returnDone && (
          <div className="no-print mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">✅</span>
            <div>
              <p className="font-semibold text-emerald-800 text-sm">Return request submitted</p>
              <p className="text-xs text-emerald-600 mt-0.5">Our team will review and contact you within 1–2 business days.</p>
            </div>
          </div>
        )}

        {/* Print-locked notice */}
        {!order.billPrintable && (
          <div className="no-print mb-6 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🔒</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Receipt not available yet</p>
              <p className="text-xs text-amber-600 mt-0.5">Available once our team confirms order and payment.</p>
            </div>
          </div>
        )}

        {/* ===== RECEIPT CARD ===== */}
        <div className="receipt-card rounded-3xl bg-white shadow-xl overflow-hidden">
          {/* Header stripe */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 px-8 py-7 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-lg leading-none">KigaliTech</p>
                  <p className="text-sky-300 text-xs mt-0.5">Official Receipt</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Order</p>
                <p className="text-2xl font-extrabold">#{order.id}</p>
              </div>
            </div>
          </div>

          {/* Status tracker */}
          {order.status !== 'cancelled' && (
            <div className="bg-slate-50 px-8 py-5 no-print">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex flex-1 flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      i < stepIndex ? 'bg-emerald-500 text-white'
                      : i === stepIndex ? 'bg-sky-600 text-white ring-4 ring-sky-200'
                      : 'bg-slate-200 text-slate-400'
                    }`}>
                      {i < stepIndex ? '✓' : i + 1}
                    </div>
                    <p className={`mt-1.5 text-center text-[10px] font-semibold capitalize leading-tight ${i <= stepIndex ? 'text-slate-700' : 'text-slate-400'}`}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
              {/* Connector */}
              <div className="relative -mt-10 flex items-center px-4 pointer-events-none">
                <div className="w-full h-0.5 bg-slate-200 relative">
                  <div className="absolute left-0 top-0 h-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${(Math.max(0, stepIndex) / (STATUS_STEPS.length - 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="bg-red-50 px-8 py-4 text-center">
              <span className="font-semibold text-red-600">Order Cancelled</span>
            </div>
          )}

          {/* Receipt body */}
          <div className="px-8 py-6 space-y-6">
            {/* Date + payment */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Date</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Payment</p>
                <p className="mt-1 font-semibold text-slate-900 capitalize">{order.paymentMethod || 'Pending'}</p>
              </div>
              {order.shippingName && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Customer</p>
                  <p className="mt-1 font-semibold text-slate-900">{order.shippingName}</p>
                  {order.shippingPhone && <p className="text-xs text-slate-500">{order.shippingPhone}</p>}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Delivery</p>
                {order.mpostAddress ? (
                  <p className="mt-1 text-sm text-slate-700">📬 Mpost: {order.mpostAddress}</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-700">{order.shippingAddress}</p>
                )}
              </div>
            </div>

            {/* TV Installation row */}
            {order.tvInstallation && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-center gap-3">
                <span className="text-xl">📺</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Professional TV Installation</p>
                  {order.tvInstallAddress && <p className="text-xs text-amber-700 mt-0.5">📍 {order.tvInstallAddress}</p>}
                  <p className="text-xs text-amber-600 mt-0.5">A technician will contact you to schedule the installation.</p>
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Items</p>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                    {item.product?.images && (
                      <img src={JSON.parse(item.product.images || '[]')[0]} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.color && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{item.color}</span>}
                        {item.storage && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{item.storage}</span>}
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">Warranty: {item.warranty}</span>
                      </div>
                      {item.serial && item.serial !== 'TBD' && <p className="text-xs text-slate-400 mt-0.5">S/N: {item.serial}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">× {item.quantity}</p>
                      <p className="font-bold text-slate-900">{format(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-50">
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">{format(subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-emerald-600">Discount {order.couponCode && `(${order.couponCode})`}</span>
                    <span className="font-semibold text-emerald-600">−{format(order.discountAmount)}</span>
                  </div>
                )}
                {order.tvInstallation && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-slate-600">TV Installation</span>
                    <span className="font-semibold">{format(5000)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-4 bg-slate-900">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-xl font-extrabold text-white">{format(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-3">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${order.adminConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {order.adminConfirmed ? '✓' : '○'} Admin Confirmed
              </div>
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${order.paymentConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {order.paymentConfirmed ? '✓' : '○'} Payment Confirmed
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-900 px-8 py-5 text-center">
            <p className="text-xs text-slate-400">Thank you for shopping with <span className="text-sky-400 font-semibold">KigaliTech</span></p>
            <p className="text-xs text-slate-500 mt-1">Kigali, Rwanda · info@kigalitech.com · +250 700 000 000</p>
          </div>
        </div>

        {/* Delivery Tracker — outside receipt card, hidden on print */}
        <div className="no-print mt-6 space-y-4">
          <DeliveryTracker order={order} />
          <InstallmentCard order={order} />
        </div>
      </div>

      {/* Return request modal */}
      {returnModal && (
        <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Request a Return</h3>
              <button onClick={() => setReturnModal(false)} className="rounded-full p-1.5 hover:bg-slate-100 transition-colors text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleReturn} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                  Reason <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={returnForm.reason}
                  onChange={e => setReturnForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">Select a reason…</option>
                  <option value="Defective / not working">Defective / not working</option>
                  <option value="Wrong item received">Wrong item received</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Additional details</label>
                <textarea
                  rows={3}
                  value={returnForm.description}
                  onChange={e => setReturnForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <p className="text-xs text-slate-400">Our team will review your request and contact you within 1–2 business days.</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setReturnModal(false)}
                  className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={returning}
                  className="flex-1 rounded-full bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-all">
                  {returning ? 'Submitting…' : 'Submit Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
