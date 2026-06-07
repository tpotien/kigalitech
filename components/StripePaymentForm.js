import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Lazy-init Stripe — avoids loading until the payment form is shown
let stripePromise = null;
function getStripe(key) {
  if (!stripePromise && key) stripePromise = loadStripe(key);
  return stripePromise;
}

function PaymentForm({ clientSecret, onSuccess, onError, submitting, total, format }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
      onError(error.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setMessage('Unexpected payment status. Please contact support.');
      setProcessing(false);
      onError('Unexpected payment status');
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { googlePay: 'auto', applePay: 'auto' },
        }}
      />
      {message && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing || submitting}
        className="w-full rounded-full bg-sky-600 py-3.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {processing || submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </>
        ) : (
          <>Pay {format(total)}</>
        )}
      </button>
      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe · 256-bit SSL
      </p>
    </form>
  );
}

export default function StripePaymentForm({ amount, currency = 'usd', metadata, onSuccess, onError, submitting, total, format }) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState('');
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!amount || amount < 50) return;
    setLoading(true);
    setInitError('');
    fetch('/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, metadata }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setClientSecret(d.clientSecret);
      })
      .catch((err) => {
        setInitError(err.message);
        onError(err.message);
      })
      .finally(() => setLoading(false));
  }, [amount]);

  if (!pubKey || pubKey === 'placeholder') {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 text-sm text-amber-700">
        <p className="font-semibold">Stripe keys not configured</p>
        <p className="mt-1 text-xs">Add <code>STRIPE_SECRET_KEY</code> and <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your environment to enable card / wallet payments.</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
        {initError}
      </div>
    );
  }

  if (loading || !clientSecret) {
    return (
      <div className="flex items-center justify-center gap-3 py-10 text-slate-400 text-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
        Preparing payment...
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0ea5e9',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
      },
    },
  };

  return (
    <Elements stripe={getStripe(pubKey)} options={options}>
      <PaymentForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
        submitting={submitting}
        total={total}
        format={format}
      />
    </Elements>
  );
}
