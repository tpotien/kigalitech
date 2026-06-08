import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import DeliverySlotPicker from '../components/DeliverySlotPicker';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLang } from '../context/LanguageContext';

const StripePaymentForm = dynamic(() => import('../components/StripePaymentForm'), { ssr: false });

const PAYMENT_METHODS = [
  { id: 'paypack',    label: 'MTN / Airtel MoMo',            icon: '🇷🇼', desc: 'Pay instantly with MTN or Airtel Mobile Money', popular: true },
  { id: 'mtn',        label: 'MTN Mobile Money',              icon: '🟡', desc: 'Pay directly with MTN MoMo', popular: true },
  { id: 'airtel',     label: 'Airtel Money',                  icon: '🔴', desc: 'Pay directly with Airtel Money' },
  { id: 'cash',       label: 'Cash on Delivery',              icon: '💵', desc: 'Pay cash when your order arrives' },
  { id: 'card',       label: 'Card / Google Pay / Apple Pay', icon: '💳', desc: 'Visa, Mastercard, Google Pay, Apple Pay' },
  { id: 'installment',label: 'Installment Plan',              icon: '📅', desc: 'Split over 3–12 months — subject to approval' },
];

const INSTALLMENT_OPTIONS = [
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '12 Months' },
];

// Poll Flutterwave verify endpoint until paid or timeout
async function pollPayment(txRef, maxAttempts = 18, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    try {
      const r = await fetch(`/api/payment/verify?txRef=${txRef}`);
      const d = await r.json();
      if (d.paid) return { success: true };
      if (d.status === 'failed') return { success: false, error: 'Payment failed or was declined' };
    } catch {}
  }
  return { success: false, error: 'Payment timed out. Contact support if money was deducted.' };
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { format, currency } = useCurrency();
  const { t } = useLang();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [momoStatus, setMomoStatus] = useState(''); // '', 'waiting', 'polling', 'success', 'failed'
  const momoTxRef = useRef('');
  const [paypackStatus, setPaypackStatus] = useState(''); // '', 'waiting', 'polling', 'success', 'failed'
  const paypackRef = useRef('');

  const [form, setForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    paymentMethod: 'paypack',
    installmentMonths: 3,
    notes: '',
    useMpost: false,
    mpostPhone: '',
    momoPhone: '',
    paypackPhone: '',
  });

  // Mandatory sign-in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin?callbackUrl=/checkout');
    }
  }, [status]);

  const hasTVItem = items.some(i => i.category === 'TVs' || i.name?.toLowerCase().includes('tv'));
  const [tvInstallation, setTvInstallation] = useState(false);
  const [tvInstallAddress, setTvInstallAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [addons, setAddons] = useState([]);         // available accessories from DB
  const [selectedAddons, setSelectedAddons] = useState({}); // { productId: true }
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [deliverySlot, setDeliverySlot] = useState({ date: '', slot: '' });

  useEffect(() => {
    fetch('/api/products?category=Accessories&limit=8')
      .then(r => r.json())
      .then(data => setAddons(Array.isArray(data) ? data.filter(p => p.stock > 0).slice(0, 8) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/delivery-zones')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setDeliveryZones(data);
          setSelectedZoneId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-800';

  const addonTotal = addons.filter(a => selectedAddons[a.id]).reduce((s, a) => s + a.price, 0);
  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId) || null;
  const shipping = selectedZone
    ? selectedZone.fee
    : (subtotal + addonTotal) >= 9900 ? 0 : 999;
  const tvInstallFee = tvInstallation ? 5000 : 0;
  const total = subtotal + addonTotal + shipping + tvInstallFee;
  const isInstallment = form.paymentMethod === 'installment';
  const isCard = form.paymentMethod === 'card';
  const isMomo = form.paymentMethod === 'mtn' || form.paymentMethod === 'airtel';
  const isPaypack = form.paymentMethod === 'paypack';
  const monthlyAmount = isInstallment ? Math.ceil(total / form.installmentMonths) : 0;

  function buildOrderPayload(overrides = {}) {
    const addonItems = addons
      .filter(a => selectedAddons[a.id])
      .map(a => ({ id: a.id, productId: a.id, name: a.name, price: a.price, quantity: 1, color: '', storage: '', warranty: '1 Year' }));
    return {
      items: [
        ...items.map(i => ({
          id: i.id, productId: i.id, name: i.name,
          price: i.price, quantity: i.quantity,
          color: i.color, storage: i.storage, warranty: i.warranty || '1 Year',
        })),
        ...addonItems,
      ],
      userId: session?.user?.id || undefined,
      shippingName: form.name,
      shippingEmail: form.email,
      shippingPhone: form.phone,
      shippingAddress: form.useMpost ? `MPOST:${form.mpostPhone}` : form.address,
      mpostAddress: form.useMpost ? form.mpostPhone : '',
      paymentMethod: isInstallment
        ? `Installment Plan (${form.installmentMonths} months)`
        : PAYMENT_METHODS.find(m => m.id === form.paymentMethod)?.label || form.paymentMethod,
      installmentPlan: isInstallment ? JSON.stringify({ months: form.installmentMonths, monthly: monthlyAmount, total }) : '',
      installmentMonths: isInstallment ? form.installmentMonths : 0,
      notes: form.notes,
      tvInstallation,
      tvInstallAddress: tvInstallation ? tvInstallAddress : '',
      couponCode: couponCode.trim() || undefined,
      currency: currency || 'USD',
      deliverySlot: deliverySlot.slot ? `${deliverySlot.date} ${deliverySlot.slot}` : '',
      deliveryDate: deliverySlot.date || '',
      ...overrides,
    };
  }

  async function placeOrder(payload) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    return data;
  }

  // Paypack (MTN + Airtel via Paypack)
  async function handlePaypackPay(e) {
    e.preventDefault();
    const phone = form.paypackPhone || form.phone;
    if (!phone) { setError('Enter your mobile money phone number'); return; }
    setSubmitting(true);
    setPaypackStatus('waiting');
    setError('');

    try {
      const orderData = await placeOrder(buildOrderPayload());
      const orderId = orderData.orderId;

      const chargeRes = await fetch('/api/payment/paypack-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: total, orderId, currency: 'RWF' }),
      });
      const chargeData = await chargeRes.json();

      if (!chargeRes.ok) {
        if (chargeRes.status === 503) {
          // Paypack not configured — order saved, redirect
          setPaypackStatus('');
          clearCart();
          router.push(`/orders/${orderId}?payment=paypack_pending`);
          return;
        }
        throw new Error(chargeData.error || 'Could not initiate Paypack payment');
      }

      const ref = chargeData.ref || chargeData.transaction?.ref;
      paypackRef.current = ref;
      setPaypackStatus('polling');

      // Poll paypack-verify
      let paid = false;
      for (let i = 0; i < 18; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const vr = await fetch(`/api/payment/paypack-verify?ref=${ref}`);
          const vd = await vr.json();
          if (vd.paid) { paid = true; break; }
          if (vd.status === 'failed') break;
        } catch {}
      }

      if (paid) {
        setPaypackStatus('success');
        clearCart();
        router.push(`/orders/${orderId}?payment=confirmed`);
      } else {
        setPaypackStatus('failed');
        setError('Payment not confirmed. Your order is saved — contact us if money was deducted.');
        setSubmitting(false);
      }
    } catch (err) {
      setPaypackStatus('failed');
      setError(err.message);
      setSubmitting(false);
    }
  }

  // Cash / Bank / Installment
  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length || isCard || isMomo || isPaypack) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await placeOrder(buildOrderPayload());
      clearCart();
      router.push(`/orders/${data.orderId}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  // Stripe card / wallet
  async function handleStripeSuccess(intentId) {
    setSubmitting(true);
    setError('');
    try {
      const data = await placeOrder(buildOrderPayload({ stripePaymentIntentId: intentId }));
      clearCart();
      router.push(`/orders/${data.orderId}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  // MTN MoMo / Airtel Money
  async function handleMomoPay(e) {
    e.preventDefault();
    if (!form.momoPhone) { setError('Enter your MoMo phone number'); return; }
    setSubmitting(true);
    setMomoStatus('waiting');
    setError('');

    const txRef = `KT-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    momoTxRef.current = txRef;

    try {
      // Create order first (pending), then charge
      const orderData = await placeOrder(buildOrderPayload({ momoTxRef: txRef }));
      const orderId = orderData.orderId;

      // Initiate MoMo charge
      const chargeRes = await fetch('/api/payment/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'RWF',
          phone: form.momoPhone,
          network: form.paymentMethod,
          email: form.email || 'customer@kigalitech.com',
          name: form.name,
          orderId,
          txRef,
        }),
      });
      const chargeData = await chargeRes.json();

      if (!chargeRes.ok) {
        // Flutterwave not configured — order still created, manual confirmation
        if (chargeRes.status === 503) {
          setMomoStatus('manual');
          clearCart();
          router.push(`/orders/${orderId}?payment=momo_pending`);
          return;
        }
        throw new Error(chargeData.error || 'Could not initiate mobile money payment');
      }

      // Poll for confirmation
      setMomoStatus('polling');
      const result = await pollPayment(txRef);

      if (result.success) {
        setMomoStatus('success');
        clearCart();
        router.push(`/orders/${orderId}?payment=confirmed`);
      } else {
        setMomoStatus('failed');
        setError(result.error || 'Payment not confirmed. Your order is saved — contact us to confirm payment.');
        setSubmitting(false);
      }
    } catch (err) {
      setMomoStatus('failed');
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!items.length) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your cart is empty</h1>
          <Link href="/" className="rounded-full bg-sky-600 px-7 py-3 font-semibold text-white hover:bg-sky-700 no-underline">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-8">{t('checkout')}</h1>
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={isMomo ? handleMomoPay : isPaypack ? handlePaypackPay : handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* ── Left ── */}
            <div className="space-y-6">
              {!session && (
                <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-5 py-4">
                  <p className="text-sm text-sky-700 dark:text-sky-300 font-medium">
                    💡 <Link href="/signin" className="underline">Sign in</Link> to track your order and get confirmation emails.
                  </p>
                </div>
              )}

              {/* Contact */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('contactInfo')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')} *</label>
                    <input required autoComplete="name" value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('email')} *</label>
                    <input required type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('phone')} *</label>
                    <input required type="tel" autoComplete="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="+250 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('address')} {!form.useMpost && '*'}
                    </label>
                    <input
                      required={!form.useMpost}
                      disabled={form.useMpost}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      className={`${inp} ${form.useMpost ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Street, City, Country"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.useMpost} onChange={e => set('useMpost', e.target.checked)} className="mt-0.5 accent-sky-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('mpostLabel')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('mpostDesc')}</p>
                    </div>
                  </label>
                  {form.useMpost && (
                    <input value={form.mpostPhone} onChange={e => set('mpostPhone', e.target.value)} placeholder="Your Mpost phone number (e.g. 0788 XXX XXX)" className={`${inp} mt-3`} />
                  )}
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <DeliverySlotPicker value={deliverySlot} onChange={setDeliverySlot} />
                </div>
              </div>

              {/* Delivery Zone */}
              {deliveryZones.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Delivery Zone
                  </label>
                  <div className="space-y-2">
                    {deliveryZones.map(zone => (
                      <label
                        key={zone.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                          selectedZoneId === zone.id
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="deliveryZone"
                            value={zone.id}
                            checked={selectedZoneId === zone.id}
                            onChange={() => setSelectedZoneId(zone.id)}
                            className="accent-sky-600"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{zone.name}</span>
                        </div>
                        <span className={`text-sm font-semibold ${zone.fee === 0 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {zone.fee === 0 ? 'Free' : `RWF ${zone.fee.toLocaleString()}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* TV Installation */}
              {hasTVItem && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">📺</div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('tvInstallTitle')}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('tvInstallDesc')}</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={tvInstallation} onChange={e => setTvInstallation(e.target.checked)} className="accent-amber-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t('addInstallation')} — <span className="text-amber-700 dark:text-amber-400 font-semibold">{format(tvInstallFee)}</span>
                        </span>
                      </label>
                      {tvInstallation && (
                        <input value={tvInstallAddress} onChange={e => setTvInstallAddress(e.target.value)} placeholder="Installation address (if different from delivery)" className={`${inp} mt-3`} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment method selector */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t('paymentMethod')}</h2>
                <p className="text-xs text-slate-400 mb-4">Mobile Money is the fastest way to pay in Rwanda</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map(m => (
                    <label
                      key={m.id}
                      className={`relative flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${
                        form.paymentMethod === m.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                          : m.popular
                            ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {m.popular && (
                        <span className="absolute -top-2.5 left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          Popular in Rwanda
                        </span>
                      )}
                      <input type="radio" name="payment" value={m.id} checked={form.paymentMethod === m.id} onChange={() => set('paymentMethod', m.id)} className="accent-sky-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{m.icon}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Card wallet logos */}
                {isCard && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
                    <span className="font-bold text-[#1a1f71] text-sm tracking-wide">VISA</span>
                    <div className="flex -space-x-1.5">
                      <div className="h-5 w-5 rounded-full bg-red-500 opacity-90" />
                      <div className="h-5 w-5 rounded-full bg-amber-400 opacity-90" />
                    </div>
                    <span className="rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200">G Pay</span>
                    <span className="rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200"> Pay</span>
                    <span className="ml-auto text-xs text-slate-400">Powered by Stripe</span>
                  </div>
                )}

                {/* MTN MoMo phone input */}
                {form.paymentMethod === 'mtn' && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3">
                      <span className="text-2xl">🟡</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">MTN Mobile Money</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">You will receive a payment prompt on your phone</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">MTN MoMo Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={form.momoPhone}
                        onChange={e => set('momoPhone', e.target.value)}
                        className={inp}
                        placeholder="e.g. 0788 123 456"
                      />
                      <p className="mt-1 text-xs text-slate-400">Must be registered MTN MoMo number. We will send a USSD push to approve payment.</p>
                    </div>
                    {momoStatus === 'polling' && (
                      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent flex-shrink-0" />
                        Waiting for you to approve the payment prompt on your phone…
                      </div>
                    )}
                  </div>
                )}

                {/* Airtel Money phone input */}
                {form.paymentMethod === 'airtel' && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                      <span className="text-2xl">🔴</span>
                      <div>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Airtel Money</p>
                        <p className="text-xs text-red-700 dark:text-red-400">You will receive a payment prompt on your phone</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Airtel Money Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={form.momoPhone}
                        onChange={e => set('momoPhone', e.target.value)}
                        className={inp}
                        placeholder="e.g. 0738 123 456"
                      />
                    </div>
                    {momoStatus === 'polling' && (
                      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent flex-shrink-0" />
                        Waiting for you to approve the payment prompt on your phone…
                      </div>
                    )}
                  </div>
                )}

                {/* Paypack MoMo */}
                {isPaypack && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
                      <span className="text-2xl">🇷🇼</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300">Paypack — MTN &amp; Airtel MoMo</p>
                        <p className="text-xs text-green-700 dark:text-green-400">Enter your mobile money number. You will get a payment prompt.</p>
                      </div>
                    </div>

                    {/* MoMo QR Code */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Pay via QR Code</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Scan with your MTN MoMo or Airtel Money app</p>
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="flex-shrink-0 rounded-2xl border-4 border-sky-100 dark:border-sky-900 p-1 bg-white shadow-sm">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('tel:+250786276555')}`}
                            alt="MoMo QR code"
                            width={160}
                            height={160}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 px-4 py-2 mb-3">
                            <span className="text-lg">📱</span>
                            <span className="font-mono text-base font-bold text-sky-700 dark:text-sky-300">+250 786 276 555</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">KigaliTech Business Number</p>
                          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Amount to pay:</p>
                            <p className="text-xl font-extrabold text-amber-800 dark:text-amber-200">{format(total)}</p>
                          </div>
                          <p className="mt-3 text-xs text-slate-400">After paying, click <strong>"Pay via Paypack"</strong> below to complete your order</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile Money Number *</label>
                      <input
                        type="tel"
                        value={form.paypackPhone || form.phone}
                        onChange={e => set('paypackPhone', e.target.value)}
                        className={inp}
                        placeholder="e.g. 0788 123 456 or 0738 123 456"
                      />
                      <p className="mt-1 text-xs text-slate-400">Works with both MTN MoMo and Airtel Money numbers.</p>
                    </div>
                    {paypackStatus === 'polling' && (
                      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent flex-shrink-0" />
                        Waiting for you to approve the payment on your phone…
                      </div>
                    )}
                    {paypackStatus === 'waiting' && (
                      <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent flex-shrink-0" />
                        Initiating payment…
                      </div>
                    )}
                  </div>
                )}

                {/* Bank transfer */}
                {form.paymentMethod === 'bank' && (
                  <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-4 space-y-2">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Bank Transfer Details</p>
                    <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <p><span className="font-medium">Bank:</span> Bank of Kigali (BK)</p>
                      <p><span className="font-medium">Account:</span> 00040-01234567-88</p>
                      <p><span className="font-medium">Name:</span> KigaliTech Ltd</p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 pt-1">Reference your order number in the transfer. We'll confirm within 2 hours.</p>
                  </div>
                )}

                {/* Installment — WhatsApp CTA */}
                {isInstallment && (
                  <div className="mt-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40 text-2xl">📅</div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">Installment Plan</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                          To arrange a payment plan (3–12 months), please contact our customer support. We'll review your order and set up a schedule that works for you.
                        </p>
                        <a
                          href={`https://wa.me/250786276555?text=${encodeURIComponent(`Hi KigaliTech! I'd like to arrange an installment plan for my order of ${format(total)}.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20bf5b] transition-all shadow-sm"
                        >
                          <svg viewBox="0 0 32 32" className="h-4 w-4 fill-white flex-shrink-0">
                            <path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/>
                          </svg>
                          Chat with Support on WhatsApp
                        </a>
                        <p className="mt-3 text-xs text-slate-400">+250 786 276 555 · We reply within minutes during business hours.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accessories add-on */}
              {addons.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100">Protect Your Device</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Add accessories to your order — delivered together</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addons.map(addon => {
                      const selected = !!selectedAddons[addon.id];
                      const img = (() => { try { const imgs = JSON.parse(addon.images); return imgs[0] || null; } catch { return null; } })();
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => setSelectedAddons(s => ({ ...s, [addon.id]: !s[addon.id] }))}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            selected
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-2 ring-sky-200 dark:ring-sky-800'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {img ? (
                            <img src={img} alt={addon.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">🛡️</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{addon.name}</p>
                            <p className="text-xs font-bold text-sky-600 mt-0.5">{format(addon.price)}</p>
                          </div>
                          <div className={`h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                            selected ? 'border-sky-500 bg-sky-500' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {Object.values(selectedAddons).some(Boolean) && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 px-4 py-2.5">
                      <span className="text-sm text-sky-700 dark:text-sky-300 font-medium">
                        {Object.values(selectedAddons).filter(Boolean).length} accessory added
                      </span>
                      <span className="text-sm font-bold text-sky-700 dark:text-sky-300">+{format(addonTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('notes')}</h2>
                <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inp} resize-none`} placeholder="Special instructions, preferred delivery time..." />
              </div>

              {/* Stripe payment form inline */}
              {isCard && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 p-6">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Enter Payment Details</h2>
                  <p className="text-xs text-slate-400 mb-5">Google Pay and Apple Pay appear automatically when available on your device.</p>
                  <StripePaymentForm
                    amount={total}
                    currency={(currency || 'USD').toLowerCase()}
                    metadata={{ customerName: form.name, customerEmail: form.email }}
                    onSuccess={handleStripeSuccess}
                    onError={msg => setError(msg)}
                    submitting={submitting}
                    total={total}
                    format={format}
                  />
                </div>
              )}
            </div>

            {/* ── Right: order summary ── */}
            <div>
              <div className="sticky top-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('orderSummary')}</h2>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.key} className="flex gap-3 px-5 py-3">
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{[item.color, item.storage, `×${item.quantity}`].filter(Boolean).join(' · ')}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{format(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>{t('subtotal')}</span><span>{format(subtotal)}</span>
                  </div>
                  {addonTotal > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Accessories</span><span>{format(addonTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>{t('shipping')}{selectedZone ? ` — ${selectedZone.name}` : ''}</span>
                    <span>{shipping === 0 ? <span className="text-emerald-600">Free</span> : format(shipping)}</span>
                  </div>
                  {tvInstallFee > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>TV Installation</span><span>{format(tvInstallFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{t('total')}</span><span>{format(total)}</span>
                  </div>
                  {isInstallment && (
                    <div className="flex justify-between text-sm text-sky-700 font-semibold">
                      <span>{form.installmentMonths}× monthly</span><span>{format(monthlyAmount)}/mo</span>
                    </div>
                  )}
                </div>

                {/* Submit for non-card methods */}
                {!isCard && (
                  <div className="px-5 pb-5">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-full bg-sky-600 py-3.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {(momoStatus === 'polling' || paypackStatus === 'polling') ? 'Waiting for payment…' : t('placingOrder')}
                        </>
                      ) : isPaypack ? (
                        `Pay ${format(total)} via Paypack`
                      ) : isMomo ? (
                        `Pay ${format(total)} via ${form.paymentMethod === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}`
                      ) : isInstallment ? (
                        t('startInstallment')
                      ) : (
                        t('placeOrder')
                      )}
                    </button>
                    <p className="mt-3 text-center text-xs text-slate-400">{t('secureCheckout')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </Layout>
  );
}
