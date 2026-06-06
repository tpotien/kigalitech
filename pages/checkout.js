import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLang } from '../context/LanguageContext';

const PAYMENT_METHODS = ['Cash on Delivery', 'Mobile Money (MoMo)', 'Bank Transfer', 'Installment Plan', 'Stripe (Card)'];
const INSTALLMENT_OPTIONS = [
  { months: 3, label: '3 Months', note: 'Pay in 3 equal monthly installments' },
  { months: 6, label: '6 Months', note: 'Pay in 6 equal monthly installments' },
  { months: 12, label: '12 Months', note: 'Pay in 12 equal monthly installments' },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { format } = useCurrency();
  const { t } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    paymentMethod: 'Cash on Delivery',
    installmentMonths: 3,
    notes: '',
    useMpost: false,
    mpostPhone: '',
  });

  const hasTVItem = items.some(i => i.category === 'TVs' || i.name?.toLowerCase().includes('tv'));
  const [tvInstallation, setTvInstallation] = useState(false);
  const [tvInstallAddress, setTvInstallAddress] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inp = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';

  const shipping = subtotal >= 9900 ? 0 : 999;
  const tvInstallFee = tvInstallation ? 5000 : 0;
  const total = subtotal + shipping + tvInstallFee;
  const isInstallment = form.paymentMethod === 'Installment Plan';
  const monthlyAmount = isInstallment ? Math.ceil(total / form.installmentMonths) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, productId: i.id, name: i.name, price: i.price, quantity: i.quantity, color: i.color, storage: i.storage, warranty: i.warranty || '1 Year' })),
          userId: session?.user?.id || undefined,
          shippingName: form.name,
          shippingEmail: form.email,
          shippingPhone: form.phone,
          shippingAddress: form.useMpost ? `MPOST:${form.mpostPhone}` : form.address,
          mpostAddress: form.useMpost ? form.mpostPhone : '',
          paymentMethod: isInstallment ? `Installment Plan (${form.installmentMonths} months)` : form.paymentMethod,
          installmentPlan: isInstallment ? JSON.stringify({ months: form.installmentMonths, monthly: monthlyAmount, total }) : '',
          installmentMonths: isInstallment ? form.installmentMonths : 0,
          notes: form.notes,
          tvInstallation,
          tvInstallAddress: tvInstallation ? tvInstallAddress : '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      clearCart();
      router.push(`/orders/${data.orderId}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
          <Link href="/" className="rounded-full bg-sky-600 px-7 py-3 font-semibold text-white hover:bg-sky-700 no-underline">Continue Shopping</Link>
        </div>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">{t('checkout')}</h1>
        {error && <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* Left — form */}
            <div className="space-y-6">
              {!session && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
                  <p className="text-sm text-sky-700 font-medium">💡 <Link href="/signin" className="underline">Sign in</Link> to track your order and get confirmation emails.</p>
                </div>
              )}

              {/* Contact */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">{t('contactInfo')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')} *</label>
                    <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')} *</label>
                    <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inp} placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('phone')} *</label>
                    <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inp} placeholder="+250 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t('address')} {!form.useMpost && '*'}
                    </label>
                    <input required={!form.useMpost} disabled={form.useMpost} value={form.address} onChange={(e) => set('address', e.target.value)} className={`${inp} ${form.useMpost ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Street, City, Country" />
                  </div>
                </div>

                {/* Mpost option */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.useMpost} onChange={e => set('useMpost', e.target.checked)} className="mt-0.5 accent-sky-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('mpostLabel')}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t('mpostDesc')}</p>
                    </div>
                  </label>
                  {form.useMpost && (
                    <input value={form.mpostPhone} onChange={e => set('mpostPhone', e.target.value)} placeholder="Your Mpost phone number (e.g. 0788 XXX XXX)" className={`${inp} mt-3`} />
                  )}
                </div>
              </div>

              {/* TV Installation Option */}
              {hasTVItem && (
                <div className="rounded-2xl bg-white border border-amber-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">📺</div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-slate-900 mb-1">{t('tvInstallTitle')}</h2>
                      <p className="text-sm text-slate-500 mb-4">{t('tvInstallDesc')}</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={tvInstallation} onChange={e => setTvInstallation(e.target.checked)} className="accent-amber-600" />
                        <span className="text-sm font-medium text-slate-700">{t('addInstallation')} — <span className="text-amber-700 font-semibold">{format(tvInstallFee)}</span></span>
                      </label>
                      {tvInstallation && (
                        <input value={tvInstallAddress} onChange={e => setTvInstallAddress(e.target.value)} placeholder="Installation address (if different from delivery)" className={`${inp} mt-3`} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">{t('paymentMethod')}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${form.paymentMethod === m ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="payment" value={m} checked={form.paymentMethod === m} onChange={() => set('paymentMethod', m)} className="accent-sky-600" />
                      <div>
                        <span className="text-sm font-medium text-slate-700">{m}</span>
                        {m === 'Installment Plan' && <p className="text-xs text-slate-400 mt-0.5">Split your payment over 3–12 months</p>}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Installment options */}
                {isInstallment && (
                  <div className="mt-4 rounded-xl bg-sky-50 border border-sky-100 p-4">
                    <p className="text-sm font-semibold text-sky-800 mb-3">Choose Installment Plan</p>
                    <div className="grid grid-cols-3 gap-3">
                      {INSTALLMENT_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt.months}
                          onClick={() => set('installmentMonths', opt.months)}
                          className={`rounded-xl border p-3 text-center transition-all ${form.installmentMonths === opt.months ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-200' : 'border-sky-200 bg-white hover:border-sky-300'}`}
                        >
                          <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                          <p className="text-xs text-sky-700 font-semibold mt-1">{format(Math.ceil(total / opt.months))}/mo</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 rounded-lg bg-white border border-sky-100 px-4 py-3">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Monthly payment</span>
                        <span className="font-bold text-sky-700">{format(monthlyAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600 mt-1">
                        <span>Total ({form.installmentMonths} payments)</span>
                        <span className="font-semibold">{format(total)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">First payment due at delivery. Remaining payments monthly. Subject to approval.</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">{t('notes')}</h2>
                <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inp} resize-none`} placeholder="Special instructions, preferred delivery time..." />
              </div>
            </div>

            {/* Right — summary */}
            <div>
              <div className="sticky top-20 rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">{t('orderSummary')}</h2>
                </div>
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.key} className="flex gap-3 px-5 py-3">
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{[item.color, item.storage, `×${item.quantity}`].filter(Boolean).join(' · ')}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{format(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 px-5 py-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t('subtotal')}</span><span>{format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t('shipping')}</span>
                    <span>{shipping === 0 ? <span className="text-emerald-600">{t('freeShipping')}</span> : format(shipping)}</span>
                  </div>
                  {tvInstallFee > 0 && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>TV Installation</span><span>{format(tvInstallFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                    <span>{t('total')}</span><span>{format(total)}</span>
                  </div>
                  {isInstallment && (
                    <div className="flex justify-between text-sm text-sky-700 font-semibold">
                      <span>{form.installmentMonths}× monthly</span><span>{format(monthlyAmount)}/mo</span>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <button type="submit" disabled={submitting} className="w-full rounded-full bg-sky-600 py-3.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-all">
                    {submitting ? t('placingOrder') : isInstallment ? t('startInstallment') : t('placeOrder')}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-400">{t('secureCheckout')}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </Layout>
  );
}
