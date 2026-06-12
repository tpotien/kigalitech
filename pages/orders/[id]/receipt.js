import Link from 'next/link';
import { useEffect } from 'react';
import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

const PAYMENT_LABELS = {
  card: 'Credit / Debit Card',
  cash: 'Cash on Delivery',
  mtn_mobile: 'MTN Mobile Money',
  airtel_mobile: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
  'MTN Mobile Money': 'MTN Mobile Money',
  'Airtel Money': 'Airtel Money',
  'Cash on Delivery': 'Cash on Delivery',
  'Bank Transfer': 'Bank Transfer',
};

const CASH_METHODS = ['cash', 'Cash on Delivery'];

export default function ReceiptPage({ order, items, paymentConfirmed, isCash }) {
  useEffect(() => {
    document.title = `Receipt — Order #${order.id} — KigaliTech`;
  }, [order.id]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = order.discountAmount || 0;
  const total = order.total;
  const shipping = subtotal + discount - total > 0 ? 0 : (subtotal - discount >= 9900 ? 0 : 999);
  const isPending = !paymentConfirmed;

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const timeStr = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  function fmt(n) {
    return `RWF ${Math.round(n).toLocaleString()}`;
  }

  return (
    <div className="receipt-print-root bg-slate-100 dark:bg-slate-950 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        .receipt-print-root { background: #f1f5f9; }
        .receipt-a4 {
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 0 auto;
          box-shadow: 0 4px 32px rgba(0,0,0,0.12);
          position: relative;
        }

        /* ── Diagonal watermark ── */
        .watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 10;
          overflow: hidden;
        }
        .watermark-text {
          transform: rotate(-35deg);
          font-size: 64px;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: rgba(239, 68, 68, 0.13);
          white-space: nowrap;
          user-select: none;
          text-transform: uppercase;
          font-family: sans-serif;
        }

        @media print {
          html, body, #__next { background: white !important; margin: 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          .receipt-print-root, .receipt-print-root * { visibility: visible !important; }
          .receipt-print-root {
            position: absolute; top: 0; left: 0; right: 0;
            background: white !important;
            padding: 0 !important; margin: 0 !important;
          }
          .receipt-a4 {
            width: 100% !important;
            min-height: unset !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .watermark-text { color: rgba(239,68,68,0.10) !important; }
          .r-header  { padding: 10px 24px !important; }
          .r-banner  { padding: 6px 24px !important; }
          .r-body    { padding: 12px 24px !important; gap: 10px !important; }
          .r-logo    { width: 40px !important; height: 40px !important; }
          .r-h1      { font-size: 14px !important; }
          .r-h1sub   { font-size: 10px !important; margin-top: 1px !important; }
          .r-banner-text  { font-size: 11px !important; }
          .r-ordnum  { font-size: 20px !important; }
          .r-label   { font-size: 8px !important; }
          .r-value   { font-size: 11px !important; }
          .r-subval  { font-size: 9px !important; }
          .r-section { margin-bottom: 8px !important; }
          .r-divider { margin: 6px 0 !important; }
          .r-item-row { padding: 5px 10px !important; }
          .r-item-head { padding: 4px 10px !important; font-size: 8px !important; }
          .r-item-name { font-size: 10px !important; }
          .r-item-meta { font-size: 8px !important; }
          .r-item-num  { font-size: 10px !important; }
          .r-totals    { padding: 8px 14px !important; }
          .r-total-row { font-size: 10px !important; margin-bottom: 3px !important; }
          .r-grand     { font-size: 13px !important; padding-top: 5px !important; }
          .r-badge     { padding: 6px 12px !important; }
          .r-badge-icon { width: 24px !important; height: 24px !important; }
          .r-badge-title { font-size: 10px !important; }
          .r-footer    { padding: 8px 24px 12px !important; }
          .r-footer-main { font-size: 11px !important; }
          .r-footer-sub  { font-size: 9px !important; }
          .r-footer-tiny { font-size: 8px !important; }
          .no-print  { display: none !important; }
        }
        @page { size: A4 portrait; margin: 8mm; }
      ` }} />

      {/* ── Screen toolbar ── */}
      <div className="no-print sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/account" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-600 no-underline dark:text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/orders/${order.id}`} className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline transition-all">
            Order Details
          </Link>
          {isPending ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-100 border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 cursor-not-allowed select-none">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Print disabled — payment pending
            </div>
          ) : (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {/* ── Unpaid alert banner (screen only) ── */}
      {isPending && (
        <div className="no-print bg-red-600 text-white text-center px-4 py-3 flex items-center justify-center gap-3">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span className="font-semibold text-sm">
            {isCash
              ? 'Payment is due on delivery — this receipt becomes valid once our agent collects payment.'
              : 'Payment not confirmed yet — this is not a valid receipt. Please complete your payment first.'}
          </span>
          <Link href={`/orders/${order.id}`} className="ml-2 rounded-full bg-white text-red-700 font-bold text-xs px-3 py-1 no-underline hover:bg-red-50">
            View Order →
          </Link>
        </div>
      )}

      {/* ── A4 Receipt ── */}
      <div className="receipt-a4 py-6 px-0 sm:my-6">

        {/* Diagonal watermark — only when unpaid */}
        {isPending && (
          <div className="watermark">
            <span className="watermark-text">
              {isCash ? 'PAYMENT DUE ON DELIVERY' : 'NOT YET PAID'}
            </span>
          </div>
        )}

        {/* Header */}
        <div className={`r-header px-10 py-7 text-center ${isPending ? 'bg-slate-700' : 'bg-slate-900'}`}>
          <img src="/logo.png" alt="KigaliTech" className="r-logo mx-auto mb-2 h-16 w-16 rounded-full object-cover border-2 border-orange-400/50 shadow-lg" />
          <h1 className="r-h1 text-xl font-bold tracking-tight text-white">KigaliTech</h1>
          <p className="r-h1sub mt-0.5 text-xs font-semibold tracking-wider uppercase text-orange-300">
            {isPending ? 'Order Summary — Awaiting Payment' : 'Official Purchase Receipt'}
          </p>
        </div>

        {/* Banner */}
        <div className={`r-banner px-10 py-4 text-center ${isPending ? 'bg-amber-500' : 'bg-sky-600'}`}>
          <p className="r-banner-text text-sm font-semibold text-white">
            {isPending
              ? isCash
                ? 'Payment will be collected on delivery. Keep this for your records.'
                : 'Your order has been received. Please complete your payment to confirm.'
              : 'Thank you for your purchase! Your order is confirmed.'}
          </p>
        </div>

        {/* Body */}
        <div className="r-body px-8 py-7 space-y-5">

          {/* Order meta row */}
          <div className="r-section flex flex-wrap gap-6 justify-between items-start">
            <div>
              <p className="r-label text-[10px] font-semibold uppercase tracking-wider text-slate-400">Order Number</p>
              <p className="r-ordnum mt-0.5 text-2xl font-extrabold text-slate-900">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="r-label text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date &amp; Time</p>
              <p className="r-value mt-0.5 text-sm font-semibold text-slate-700">{dateStr}</p>
              <p className="r-subval text-xs text-slate-400">{timeStr}</p>
            </div>
            <div className="text-right">
              <p className="r-label text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
              <span className={`inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isPending ? (isCash ? 'Awaiting Delivery' : 'Pending Payment') : order.status}
              </span>
            </div>
          </div>

          <div className="r-divider border-t border-dashed border-slate-200" />

          {/* Customer info */}
          {(order.shippingName || order.shippingAddress) && (
            <>
              <div className="r-section grid sm:grid-cols-2 gap-5">
                {order.shippingName && (
                  <div>
                    <p className="r-label text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Billed To</p>
                    <p className="r-value text-sm font-semibold text-slate-800">{order.shippingName}</p>
                    {order.shippingEmail && <p className="r-subval text-xs text-slate-500">{order.shippingEmail}</p>}
                    {order.shippingPhone && <p className="r-subval text-xs text-slate-500">{order.shippingPhone}</p>}
                  </div>
                )}
                {order.shippingAddress && (
                  <div>
                    <p className="r-label text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Shipped To</p>
                    <p className="r-subval text-xs text-slate-600 leading-relaxed">{order.shippingAddress}</p>
                  </div>
                )}
                {order.paymentMethod && (
                  <div>
                    <p className="r-label text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Payment Method</p>
                    <p className="r-subval text-xs text-slate-600">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
                  </div>
                )}
              </div>
              <div className="r-divider border-t border-dashed border-slate-200" />
            </>
          )}

          {/* Line items */}
          <div className="r-section">
            <p className="r-label text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Items {isPending ? 'Ordered' : 'Purchased'}</p>
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="r-item-head grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Unit Price</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              {items.map((item, i) => (
                <div key={item.id} className={`r-item-row grid grid-cols-12 gap-2 px-4 py-3 items-start ${i < items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="col-span-6">
                    <p className="r-item-name text-sm font-semibold text-slate-900">{item.name}</p>
                    <div className="r-item-meta mt-0.5 flex flex-wrap gap-1 text-[10px] text-slate-400">
                      {item.color && item.color !== 'default' && <span>{item.color}</span>}
                      {item.storage && item.storage !== 'default' && <span>· {item.storage}</span>}
                      {item.warranty && item.warranty !== 'default' && <span>· {item.warranty}</span>}
                    </div>
                  </div>
                  <span className="r-item-num col-span-2 text-center text-sm text-slate-600">{item.quantity}</span>
                  <span className="r-item-num col-span-2 text-right text-sm text-slate-600">{fmt(item.price)}</span>
                  <span className="r-item-num col-span-2 text-right text-sm font-bold text-slate-900">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="r-totals rounded-xl bg-slate-50 border border-slate-100 px-5 py-4 space-y-2">
            <div className="r-total-row flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700 font-medium">{fmt(subtotal)}</span>
            </div>
            {shipping > 0 && (
              <div className="r-total-row flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-700">{fmt(shipping)}</span>
              </div>
            )}
            {shipping === 0 && (
              <div className="r-total-row flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
            )}
            {discount > 0 && (
              <div className="r-total-row flex justify-between text-sm">
                <span className="text-emerald-600">Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span className="text-emerald-600 font-medium">−{fmt(discount)}</span>
              </div>
            )}
            <div className="r-grand flex justify-between border-t border-slate-200 pt-3">
              <span className="text-base font-extrabold text-slate-900">
                {isPending ? (isCash ? 'Amount Due on Delivery' : 'Total Due') : 'Total Paid'}
              </span>
              <span className={`text-xl font-extrabold ${isPending ? 'text-red-600' : 'text-slate-900'}`}>{fmt(total)}</span>
            </div>
          </div>

          {/* Payment status badge */}
          {isPending ? (
            <div className="r-badge flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div className="r-badge-icon flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-400">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="r-badge-title text-sm font-bold text-amber-800">
                  {isCash ? 'Payment Due on Delivery' : 'Payment Not Confirmed'}
                </p>
                <p className="r-subval text-xs text-amber-600">
                  {isCash
                    ? 'Our delivery agent will collect payment when your order arrives.'
                    : 'This document is not a valid receipt until payment is confirmed by KigaliTech.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="r-badge flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <div className="r-badge-icon flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="r-badge-title text-sm font-bold text-emerald-800">Payment Confirmed</p>
                <p className="r-subval text-xs text-emerald-600">This is your official proof of purchase from KigaliTech</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="r-footer border-t border-dashed border-slate-200 px-8 py-5 text-center space-y-1.5">
          <p className="r-footer-main text-sm font-semibold text-slate-700">
            {isPending ? 'Questions? Contact us below.' : 'We hope you love your new device!'}
          </p>
          <p className="r-footer-sub text-xs text-slate-400">Need help? <a href="https://wa.me/250786276555" className="text-green-600 font-medium">WhatsApp: +250 786 276 555</a></p>
          <p className="r-footer-tiny text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">KigaliTech — Premium Electronics</p>
          <p className="r-footer-tiny text-[10px] text-slate-400">KN 74St, infront of Al madina mosque, Kigali Rwanda</p>
          <p className="r-footer-tiny text-[10px] text-slate-400">Email: kigalitechservices@gmail.com</p>
          <p className="r-footer-tiny text-[10px] text-slate-400">Phone: +250 786 276 555</p>
          <p className="r-footer-tiny text-[10px] text-slate-300 pt-1">Order #{order.id} · {dateStr} · {timeStr}</p>
        </div>
      </div>

      <div className="no-print h-8" />
    </div>
  );
}

export async function getServerSideProps({ req, params }) {
  const token = await getToken({ req });
  if (!token) return { redirect: { destination: '/signin', permanent: false } };

  const orderId = Number(params.id);
  if (!Number.isFinite(orderId)) return { redirect: { destination: '/', permanent: false } };
  const where = {
    id: orderId,
    ...(token.role !== 'admin' && token.role !== 'staff' ? { userId: Number(token.id) } : {}),
  };

  const order = await prisma.order.findFirst({ where, include: { items: true } });
  if (!order) return { notFound: true };

  const isCash = CASH_METHODS.includes(order.paymentMethod);

  // Block receipt entirely for non-cash unpaid orders (redirect to order page)
  if (!order.paymentConfirmed && !isCash) {
    return {
      redirect: {
        destination: `/orders/${orderId}?receipt=blocked`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      order: JSON.parse(JSON.stringify(order)),
      items: JSON.parse(JSON.stringify(order.items)),
      paymentConfirmed: order.paymentConfirmed,
      isCash,
    },
  };
}
