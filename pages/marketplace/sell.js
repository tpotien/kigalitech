import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useLang } from '../../context/LanguageContext';

const CATEGORIES = ['Phones', 'Laptops', 'Tablets', 'Audio', 'Cameras', 'Wearables', 'TVs', 'Gaming', 'Other'];
export default function SellPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLang();
  const CONDITIONS = [
    { value: 'like_new', label: t('likeNew') },
    { value: 'good', label: t('good') },
    { value: 'fair', label: t('fair') },
    { value: 'poor', label: t('poor') },
  ];

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    phone: session?.user?.phoneNumber || '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!session) { router.push('/signin?callbackUrl=/marketplace/sell'); return; }
    if (!form.category || !form.condition) { setError('Please select category and condition.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Math.round(Number(form.price) * 100) }),
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
            <svg className="h-10 w-10 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Listing Submitted!</h1>
          <p className="text-slate-500 mb-8">Your listing is pending review by our team. Once approved, it'll appear in the marketplace within 24 hours.</p>
          <div className="flex gap-3 justify-center">
            <a href="/marketplace" className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 no-underline">Browse Market</a>
            <button onClick={() => { setSuccess(false); setForm({ title: '', description: '', price: '', category: '', condition: '', phone: '', location: '' }); }} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">List Another</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-violet-900 to-slate-900 py-12 text-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-3xl font-extrabold mb-2">{t('listYourItem')}</h1>
          <p className="text-violet-200">Sell your electronics to thousands of KigaliTech customers. Free listing, admin-verified.</p>
        </div>
      </section>

      <section className="py-12 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

            {!session && (
              <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-sm font-semibold text-amber-800">Sign in required</p>
                <a href="/signin?callbackUrl=/marketplace/sell" className="mt-1 inline-block text-xs font-semibold text-sky-600 hover:underline">Sign In / Create Account →</a>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Item Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. iPhone 12 Pro — 128GB Blue" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condition *</label>
                  <select name="condition" value={form.condition} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white">
                    <option value="">Select...</option>
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the item, include storage size, accessories, any defects..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required placeholder="0.00" className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kigali, Kimihurura" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp / Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+250 7XX XXX XXX" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                <p className="mt-1 text-xs text-slate-400">Buyers will contact you directly via WhatsApp</p>
              </div>

              {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={submitting || !session} className="w-full rounded-full bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? t('loading') : t('submitListing')}
              </button>
            </form>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">All listings are reviewed by KigaliTech before appearing on the marketplace.</p>
        </div>
      </section>
    </Layout>
  );
}
