import { useEffect } from 'react';
import Link from 'next/link';
import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

const PAYMENT_LABELS = {
  card: 'Credit / Debit Card',
  cash: 'Cash on Delivery',
  mtn_mobile: 'MTN Mobile Money',
  airtel_mobile: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
};

export default function ReceiptPage({ order, items }) {
  useEffect(() => {
    document.title = `Receipt — Order #${order.id} — KigaliTech`;
  }, [order.id]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = order.discountAmount || 0;
  const total = order.total;

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-card { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
        @page { margin: 12mm; size: A4; }
      `}</style>

      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        {/* Action bar */}
        <div className="no-print mx-auto mb-6 flex max-w-2xl items-center justify-between">
          <Link href="/account" className="flex items-center gap-2 text-sm font-medium text-slate-500 no-underline hover:text-slate-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
        </div>

        {/* Receipt card */}
        <div className="receipt-card mx-auto max-w-2xl rounded-3xl bg-white shadow-xl shadow-slate-200/60 overflow-hidden">

          {/* Dark header */}
          <div className="bg-slate-900 px-10 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">KigaliTech</h1>
            <p className="mt-1 text-sm text-slate-400">Official Purchase Receipt</p>
          </div>

          {/* Thank you banner */}
          <div className="bg-sky-600 px-10 py-5 text-center">
            <p className="text-lg font-semibold text-white">Thank you for your purchase! 🎉</p>
            <p className="mt-0.5 text-sm text-sky-100">
              Your order has been confirmed. We appreciate your trust in KigaliTech.
            </p>
          </div>

          <div className="px-8 sm:px-10 py-8 space-y-7">

            {/* Order meta */}
            <div className="flex flex-wrap gap-6 justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order Number</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">#{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date & Time</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{dateStr}</p>
                <p className="text-xs text-slate-400">{timeStr}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200" />

            {/* Ship to */}
            {(order.shippingName || order.shippingAddress) && (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {order.shippingName && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Billed To</p>
                      <p className="text-sm font-semibold text-slate-800">{order.shippingName}</p>
                      {order.shippingEmail && <p className="text-sm text-slate-500">{order.shippingEmail}</p>}
                      {order.shippingPhone && <p className="text-sm text-slate-500">{order.shippingPhone}</p>}
                    </div>
                  )}
                  {order.shippingAddress && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Shipped To</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{order.shippingAddress}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-slate-200" />
              </>
            )}

            {/* Line items */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Items Purchased</p>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Unit</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 gap-2 px-5 py-4 items-start ${i < items.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="col-span-6">
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <div className="mt-0.5 space-x-2 text-xs text-slate-400">
                        {item.color && item.color !== 'default' && <span>{item.color}</span>}
                        {item.storage && item.storage !== 'default' && <span>{item.storage}</span>}
                        {item.warranty && item.warranty !== 'default' && <span>{item.warranty}</span>}
                      </div>
                    </div>
                    <span className="col-span-2 text-center text-sm text-slate-600">{item.quantity}</span>
                    <span className="col-span-2 text-right text-sm text-slate-600">${(item.price / 100).toFixed(2)}</span>
                    <span className="col-span-2 text-right text-sm font-bold text-slate-900">${((item.price * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-2xl bg-slate-50 px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700 font-medium">${(subtotal / 100).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ''}
                  </span>
                  <span className="text-emerald-600 font-medium">−${(discount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-bold text-slate-900">Total Paid</span>
                <span className="text-xl font-bold text-slate-900">${(total / 100).toFixed(2)}</span>
              </div>
              {order.paymentMethod && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Payment method</span>
                  <span className="text-slate-600">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">Payment Confirmed</p>
                <p className="text-xs text-emerald-600 mt-0.5">This is your official proof of purchase</p>
              </div>
            </div>

            {/* Footer message */}
            <div className="text-center pt-2 pb-4 space-y-3 border-t border-dashed border-slate-200">
              <p className="text-slate-800 font-semibold text-base mt-5">
                We hope you love your new device!
              </p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                Need help? Visit your account page for support, repairs, or returns.
                Our team is always here for you.
              </p>
              <p className="text-xs font-semibold text-slate-400 pt-1 uppercase tracking-widest">
                KigaliTech — Premium Electronics
              </p>
              <p className="text-xs text-slate-300 pt-1">
                Order #{order.id} · {dateStr}
              </p>
            </div>
          </div>
        </div>

        {/* Print button bottom */}
        <div className="no-print mx-auto mt-8 mb-4 flex max-w-2xl justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-8 py-3 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
          >
            View Order Details
          </Link>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req, params }) {
  const token = await getToken({ req });
  if (!token) return { redirect: { destination: '/signin', permanent: false } };

  const orderId = Number(params.id);
  const where = {
    id: orderId,
    ...(token.role !== 'admin' && token.role !== 'staff' ? { userId: Number(token.id) } : {}),
  };

  const order = await prisma.order.findFirst({
    where,
    include: { items: true },
  });

  if (!order) return { notFound: true };

  return {
    props: {
      order: JSON.parse(JSON.stringify(order)),
      items: JSON.parse(JSON.stringify(order.items)),
    },
  };
}
