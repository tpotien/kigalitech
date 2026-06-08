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
            <button
              onClick={() => {
                const orderItems = order.items || [];
                const sub = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
                const win = window.open('', '_blank');
                win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice #${order.id} — KigaliTech</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 28px; }
  .brand { font-size: 24px; font-weight: 900; color: #0f172a; }
  .brand-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 20px; font-weight: 800; color: #0ea5e9; }
  .invoice-meta p { font-size: 12px; color: #64748b; margin-top: 2px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .info-block p { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; }
  .info-block span { font-size: 14px; font-weight: 600; color: #1e293b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #0f172a; }
  thead th { color: #fff; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
  .totals { width: 300px; margin-left: auto; }
  .totals table { margin-bottom: 0; }
  .totals td { padding: 8px 12px; }
  .totals .grand { background: #0f172a; color: #fff; font-weight: 800; font-size: 16px; }
  .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 20px; } @page { margin: 12mm; size: A4; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">KigaliTech</div>
    <div class="brand-sub">Kigali, Rwanda &middot; info@kigalitechservices.com &middot; +250 786 276 555</div>
  </div>
  <div class="invoice-meta">
    <h2>INVOICE #${order.id}</h2>
    <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>Status: ${(order.status || '').toUpperCase()}</p>
  </div>
</div>
<div class="info-grid">
  <div class="info-block">
    <p>Bill To</p>
    <span>${order.shippingName || 'Customer'}</span><br/>
    <span style="font-weight:400;color:#64748b;">${order.shippingEmail || ''}</span><br/>
    <span style="font-weight:400;color:#64748b;">${order.shippingPhone || ''}</span>
  </div>
  <div class="info-block">
    <p>Delivery Address</p>
    <span style="font-weight:400;color:#1e293b;">${order.mpostAddress ? 'Mpost: ' + order.mpostAddress : (order.shippingAddress || '—')}</span>
  </div>
  <div class="info-block">
    <p>Payment Method</p>
    <span>${order.paymentMethod || 'Pending'}</span>
  </div>
  <div class="info-block">
    <p>Payment Status</p>
    <span style="color:${order.paymentConfirmed ? '#16a34a' : '#d97706'}">${order.paymentConfirmed ? 'Confirmed' : 'Pending'}</span>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Item</th>
      <th>Variant</th>
      <th style="text-align:right;">Qty</th>
      <th style="text-align:right;">Unit Price</th>
      <th style="text-align:right;">Total</th>
    </tr>
  </thead>
  <tbody>
    ${orderItems.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${item.name}</strong>${item.serial && item.serial !== 'TBD' ? '<br/><small style="color:#94a3b8;">S/N: ' + item.serial + '</small>' : ''}</td>
      <td style="color:#64748b;">${[item.color, item.storage, item.warranty ? 'Warranty: ' + item.warranty : ''].filter(Boolean).join(' · ')}</td>
      <td style="text-align:right;">${item.quantity}</td>
      <td style="text-align:right;">RWF ${(item.price).toLocaleString()}</td>
      <td style="text-align:right;font-weight:600;">RWF ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="totals">
  <table>
    <tr><td>Subtotal</td><td style="text-align:right;">RWF ${sub.toLocaleString()}</td></tr>
    ${order.discountAmount > 0 ? `<tr><td style="color:#16a34a;">Discount${order.couponCode ? ' (' + order.couponCode + ')' : ''}</td><td style="text-align:right;color:#16a34a;">−RWF ${order.discountAmount.toLocaleString()}</td></tr>` : ''}
    ${order.tvInstallation ? `<tr><td>TV Installation</td><td style="text-align:right;">RWF 5,000</td></tr>` : ''}
    <tr class="grand"><td>TOTAL</td><td style="text-align:right;">RWF ${(order.total).toLocaleString()}</td></tr>
  </table>
</div>
<div class="footer">
  <p>Thank you for shopping with <strong>KigaliTech</strong>. This is a computer-generated invoice.</p>
  <p style="margin-top:4px;">For queries, contact us at info@kigalitechservices.com or call +250 786 276 555</p>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`);
                win.document.close();
              }}
              className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Invoice
            </button>
            <Link href={`/orders/${order.id}/receipt`} className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline transition-all">
              Full Receipt
            </Link>
          </div>
        </div>


        {/* MoMo payment sent banner */}
        {query.payment === 'momo_sent' && !order.paymentConfirmed && (
          <div className="no-print mb-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">⏳</div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Payment sent — pending confirmation</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                  We'll verify your MoMo payment and confirm your order shortly. Send us the payment screenshot for faster processing.
                </p>
                <a
                  href={`https://wa.me/250786276555?text=${encodeURIComponent(`Hi KigaliTech! I've sent payment for Order #${order.id}. Please confirm.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#20bf5b] transition-all"
                >
                  <svg viewBox="0 0 32 32" className="h-4 w-4 fill-white flex-shrink-0"><path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/></svg>
                  Send Payment Screenshot
                </a>
              </div>
            </div>
          </div>
        )}

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
            <p className="text-xs text-slate-500 mt-1">Kigali, Rwanda · info@kigalitechservices.com · +250 786 276 555</p>
          </div>
        </div>

        {/* Delivery Tracker — outside receipt card, hidden on print */}
        <div className="no-print mt-6 space-y-4">
          {order.status === 'delivered' && !order.returnRequest && (
            <div className="flex justify-end">
              <Link
                href={`/returns/${order.id}`}
                className="flex items-center gap-2 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-5 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 no-underline transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Request Return
              </Link>
            </div>
          )}
          <DeliveryTracker order={order} />
          <InstallmentCard order={order} />
        </div>
      </div>
    </Layout>
  );
}
