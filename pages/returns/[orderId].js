import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const REASONS = [
  'Defective product',
  'Wrong item received',
  'Changed my mind',
  'Other',
];

export default function ReturnRequest() {
  const router = useRouter();
  const { orderId } = router.query;
  const { data: session, status } = useSession();

  const [order, setOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/signin?callbackUrl=/returns/${orderId}`);
    }
  }, [status, orderId]);

  useEffect(() => {
    if (!orderId || status !== 'authenticated') return;
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => setOrder(data))
      .catch(() => setError('Could not load order details.'));
  }, [orderId, status]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) { setError('Please select a reason.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit return request');
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || (!order && !error)) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <Link
          href={`/orders/${orderId}`}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 no-underline"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Order #{orderId}
        </Link>

        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-8 py-6 text-white">
            <h1 className="text-xl font-extrabold">Request a Return</h1>
            <p className="text-amber-100 text-sm mt-1">Order #{orderId}</p>
          </div>

          <div className="px-8 py-6">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-emerald-100 text-3xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Return Request Submitted</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Return Request #{success.id} submitted. We&apos;ll respond within 24 hours.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 text-sm text-left space-y-1">
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> <span className="text-slate-600 dark:text-slate-400">{success.reason}</span></p>
                  {success.description && (
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Details:</span> <span className="text-slate-600 dark:text-slate-400">{success.description}</span></p>
                  )}
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span> <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold capitalize">{success.status}</span></p>
                </div>
                <Link
                  href={`/orders/${orderId}`}
                  className="inline-block rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 no-underline transition-all"
                >
                  Back to Order
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Order summary */}
                {order && (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 text-sm space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Order #{order.id}</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''} &middot; Status: <span className="font-semibold capitalize">{order.status}</span>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Reason for Return *
                  </label>
                  <div className="space-y-2">
                    {REASONS.map(r => (
                      <label
                        key={r}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                          reason === r
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="accent-sky-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Additional Details <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Please describe the issue in detail..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-800 resize-none"
                  />
                </div>

                <p className="text-xs text-slate-400">
                  Returns are accepted within 7 days of delivery. Once submitted, our team will review your request and respond within 24 hours.
                </p>

                <button
                  type="submit"
                  disabled={submitting || !reason}
                  className="w-full rounded-full bg-amber-600 py-3.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Return Request'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
