import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useLang } from '../context/LanguageContext';

function getConditions(t) {
  return [
    { value: 'like_new', label: t('likeNew'), desc: 'No scratches, complete accessories' },
    { value: 'good', label: t('good'), desc: 'Minor scratches, fully functional' },
    { value: 'fair', label: t('fair'), desc: 'Visible wear, all features work' },
    { value: 'poor', label: t('poor'), desc: 'Heavy wear or minor issues' },
  ];
}

export default function TradeInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLang();
  const CONDITIONS = getConditions(t);

  const [form, setForm] = useState({
    productName: '',
    brand: '',
    condition: '',
    description: '',
    askingPrice: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!session) { router.push('/signin?callbackUrl=/trade-in'); return; }
    if (!form.condition) { setError('Please select a condition.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/trade-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, askingPrice: Math.round(Number(form.askingPrice) * 100) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{t('tradeIn')} — {t('confirmed')}!</h1>
          <p className="text-slate-500 mb-8">{t('tradeInDesc')}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSuccess(false); setForm({ productName: '', brand: '', condition: '', description: '', askingPrice: '' }); }} className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Submit Another</button>
            <a href="/account#tradein" className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 no-underline">View My Trade-Ins</a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-900 via-sky-800 to-slate-900 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6">
            ♻️ Trade-In Program
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">{t('tradeInTitle')}</h1>
          <p className="text-sky-200 text-lg max-w-xl mx-auto">{t('tradeInDesc')}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-b border-slate-100 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-center">
            {[
              { icon: '📝', step: '1', title: t('step1'), desc: 'Describe your device and expected value' },
              { icon: '🔍', step: '2', title: t('step2'), desc: 'Our team inspects and confirms condition' },
              { icon: '💬', step: '3', title: t('step3'), desc: 'Receive a verified deduction amount' },
              { icon: '🛒', step: '4', title: t('step4'), desc: 'Discount applied to your next order' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-2xl">{s.icon}</div>
                <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-1">Step {s.step}</p>
                <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{t('submitTradeIn')}</h2>

            {!session && (
              <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Sign in to submit</p>
                  <p className="text-xs text-amber-600 mt-0.5">You need an account to submit a trade-in.</p>
                  <a href="/signin?callbackUrl=/trade-in" className="mt-2 inline-block text-xs font-semibold text-sky-600 hover:underline">Sign In / Create Account →</a>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('deviceName')} *</label>
                  <input
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. iPhone 13 Pro Max"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('deviceBrand')}</label>
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="e.g. Apple"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('deviceCondition')} *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CONDITIONS.map(c => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setForm(prev => ({ ...prev, condition: c.value }))}
                      className={`rounded-xl border p-3 text-left transition-all ${form.condition === c.value ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('description')}</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the device: storage size, any damage, included accessories..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('yourAskingPrice')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    name="askingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.askingPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-4 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">We'll make a final offer after verification. This is just your estimate.</p>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !session}
                className="w-full rounded-full bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? t('loading') : t('submitTradeIn')}
              </button>
            </form>
          </div>

          {/* Note */}
          <div className="mt-6 rounded-2xl bg-slate-800 p-6 text-white">
            <h3 className="font-semibold mb-3">What we accept</h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>• Smartphones (iPhone, Samsung, Xiaomi, etc.)</li>
              <li>• Laptops and tablets (any brand)</li>
              <li>• Cameras and GoPro/Insta360 cameras</li>
              <li>• Smartwatches and earbuds</li>
              <li>• Gaming consoles and accessories</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">Devices must power on. We reserve the right to adjust the final offer after physical inspection.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
