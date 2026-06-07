import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import { useLang } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useWhatsAppCtx } from '../../context/WhatsAppContext';

function parse(val) { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return {}; } }

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const DELIVERY_STEPS = [
  { key: 'order_placed',    icon: '📋', label: 'Order Placed',      desc: 'We received your order' },
  { key: 'confirmed',       icon: '✅', label: 'Confirmed',          desc: 'Order confirmed by our team' },
  { key: 'packed',          icon: '📦', label: 'Packed',             desc: 'Items packed and ready' },
  { key: 'out_for_delivery',icon: '🚚', label: 'Out for Delivery',   desc: 'On the way to you' },
  { key: 'delivered',       icon: '🏠', label: 'Delivered',          desc: 'Arrived at destination' },
];

function DeliveryTracker({ order }) {
  const tracking = parse(order.deliveryTracking || '{}');
  const status = order.status;

  const statusToStep = {
    pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4,
  };
  const currentStep = statusToStep[status] ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚚</span>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delivery Tracking</h3>
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
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100 dark:bg-slate-800" />
          <div
            className="absolute left-5 top-5 w-0.5 bg-sky-500 transition-all duration-700"
            style={{ height: `${(currentStep / (DELIVERY_STEPS.length - 1)) * 100}%` }}
          />

          <div className="space-y-6">
            {DELIVERY_STEPS.map((step, i) => {
              const isDeliveredFinal = status === 'delivered' && i === DELIVERY_STEPS.length - 1;
              const done = i < currentStep || isDeliveredFinal;
              const active = i === currentStep && !isDeliveredFinal;
              const future = i > currentStep;
              return (
                <div key={step.key} className="relative flex items-start gap-4 pl-14">
                  {/* Icon circle */}
                  <div className={`absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 text-base transition-all ${
                    done ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : active ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-4 ring-sky-100 dark:ring-sky-900'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}>
                    {done ? '✓' : <span className={future ? 'opacity-30' : ''}>{step.icon}</span>}
                  </div>

                  <div className={`flex-1 pb-1 ${future ? 'opacity-40' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${active ? 'text-sky-700' : done ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {step.label}
                        {active && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />}
                        {isDeliveredFinal && <span className="ml-2 text-emerald-500 text-xs">✓ Delivered</span>}
                      </p>
                      {(tracking[step.key]?.time || (isDeliveredFinal && order.updatedAt)) && (
                        <p className="text-xs text-slate-400">
                          {new Date(tracking[step.key]?.time || order.updatedAt).toLocaleString()}
                        </p>
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
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800 flex flex-wrap gap-4 text-sm">
          {tracking.courier && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Courier</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tracking.courier}</p>
            </div>
          )}
          {tracking.estimatedDelivery && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Est. Delivery</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tracking.estimatedDelivery}</p>
            </div>
          )}
          {tracking.driverName && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Driver</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tracking.driverName}</p>
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
        <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-sky-100 dark:border-sky-900">
          <p className="text-xs text-slate-500 mb-1">Monthly</p>
          <p className="font-extrabold text-sky-700">{format(monthly)}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-sky-100 dark:border-sky-900">
          <p className="text-xs text-slate-500 mb-1">Paid</p>
          <p className="font-extrabold text-emerald-600">{paid} of {order.installmentMonths}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-800 p-3 border border-sky-100 dark:border-sky-900">
          <p className="text-xs text-slate-500 mb-1">Remaining</p>
          <p className="font-extrabold text-slate-900">{remaining} payments</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-sky-600">Next payment due 30 days after delivery. Contact us to adjust your payment schedule.</p>
    </div>
  );
}

export default function OrderPage() {
  const { query, replace } = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { t } = useLang();
  const { format } = useCurrency();
  const { setWhatsappCtx } = useWhatsAppCtx();
  const [order, setOrder] = useState(null);
  const eventRef = useRef(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      replace(`/signin?callbackUrl=/orders/${query.id}`);
    }
  }, [authStatus]);

  useEffect(() => {
    if (query.id) {
      setWhatsappCtx({ type: 'order', id: query.id });
      return () => setWhatsappCtx(null);
    }
  }, [query.id]);

  useEffect(() => {
    if (!query.id || authStatus !== 'authenticated') return;
    fetch(`/api/orders/${query.id}`).then((r) => r.json()).then(setOrder);

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

  if (authStatus === 'loading' || !order) return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    </Layout>
  );

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Layout>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body, #__next { background: white !important; color: black !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute;
            top: 0; left: 0; right: 0;
            background: white !important;
            padding: 16px !important;
          }
          .no-print { display: none !important; }
          .receipt-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
          }
        }
        @page { margin: 12mm; size: A4; }
      ` }} />

      <div className="print-area mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Back + Print */}
        <div className="no-print mb-6 flex items-center justify-between">
          <Link href="/account" className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 no-underline">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            My Orders
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-lg shadow-sky-200 active:scale-95 transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t('printReceipt')}
            </button>
            <Link href={`/orders/${order.id}/receipt`} className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline transition-all">
              Full Receipt
            </Link>
          </div>
        </div>


        {/* ===== RECEIPT CARD ===== */}
        <div className="receipt-card rounded-3xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Header stripe */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 px-8 py-7 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="KigaliTech" className="h-14 w-14 rounded-full object-cover border-2 border-orange-400/50 shadow-lg" />
                <div>
                  <p className="font-extrabold text-lg leading-none">KigaliTech</p>
                  <p className="text-orange-300 text-xs mt-0.5 font-semibold tracking-wide">Official Receipt</p>
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
            <div className="bg-slate-50 dark:bg-slate-800 px-8 py-5 no-print">
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
                    <p className={`mt-1.5 text-center text-[10px] font-semibold capitalize leading-tight ${i <= stepIndex ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
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
            <div className="bg-red-50 dark:bg-red-900/20 px-8 py-4 text-center">
              <span className="font-semibold text-red-600">Order Cancelled</span>
            </div>
          )}

          {/* Receipt body */}
          <div className="px-8 py-6 space-y-6">
            {/* Date + payment */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Date</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Payment</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100 capitalize">{order.paymentMethod || 'Pending'}</p>
              </div>
              {order.shippingName && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Customer</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{order.shippingName}</p>
                  {order.shippingPhone && <p className="text-xs text-slate-500 dark:text-slate-400">{order.shippingPhone}</p>}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Delivery</p>
                {order.mpostAddress ? (
                  <p className="mt-1 text-sm text-slate-700">📬 Mpost: {order.mpostAddress}</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{order.shippingAddress}</p>
                )}
              </div>
            </div>

            {/* TV Installation row */}
            {order.tvInstallation && (
              <div className="rounded-xl border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center gap-3">
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
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800 p-3">
                    {item.product?.images && (
                      <img src={JSON.parse(item.product.images || '[]')[0]} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.color && <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">{item.color}</span>}
                        {item.storage && <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">{item.storage}</span>}
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">Warranty: {item.warranty}</span>
                      </div>
                      {item.serial && item.serial !== 'TBD' && <p className="text-xs text-slate-400 mt-0.5">S/N: {item.serial}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">× {item.quantity}</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{format(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-semibold dark:text-slate-200">{format(subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-emerald-600">Discount {order.couponCode && `(${order.couponCode})`}</span>
                    <span className="font-semibold text-emerald-600">−{format(order.discountAmount)}</span>
                  </div>
                )}
                {order.tvInstallation && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">TV Installation</span>
                    <span className="font-semibold dark:text-slate-200">{format(5000)}</span>
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
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${order.adminConfirmed ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {order.adminConfirmed ? '✓' : '○'} Admin Confirmed
              </div>
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${order.paymentConfirmed ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
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
    </Layout>
  );
}
