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

  // AI identification state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState('serial'); // 'serial' | 'photo'
  const [serialInput, setSerialInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiPhoto, setAiPhoto] = useState(null); // base64 data URL

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAiPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function identifyDevice() {
    setAiLoading(true);
    setAiError('');
    try {
      const body = aiMode === 'serial'
        ? { serialNumber: serialInput }
        : { imageDataUrl: aiPhoto };
      const res = await fetch('/api/marketplace/ai-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'AI could not identify device'); return; }
      // Auto-fill form
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        category: data.category || prev.category,
        condition: data.suggestedCondition || prev.condition,
        price: data.suggestedPrice ? String(data.suggestedPrice) : prev.price,
      }));
      setAiOpen(false);
    } catch {
      setAiError('AI service error. Please fill in the form manually.');
    } finally {
      setAiLoading(false);
    }
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
        body: JSON.stringify({ ...form, price: Math.round(Number(form.price)) }),
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Listing Submitted!</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Your listing is pending review by our team. Once approved, it'll appear in the marketplace within 24 hours.</p>
          <div className="flex gap-3 justify-center">
            <a href="/marketplace" className="rounded-full border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline">Browse Market</a>
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

      <section className="py-12 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">

            {!session && (
              <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-sm font-semibold text-amber-800">Sign in required</p>
                <a href="/signin?callbackUrl=/marketplace/sell" className="mt-1 inline-block text-xs font-semibold text-sky-600 hover:underline">Sign In / Create Account →</a>
              </div>
            )}

            {/* AI Device Identification */}
            <div className="mb-4 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 overflow-hidden">
              <button type="button" onClick={() => setAiOpen(v => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🤖</span>
                  <div>
                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">AI Auto-Fill</p>
                    <p className="text-xs text-violet-600 dark:text-violet-400">Identify device by serial number or photo</p>
                  </div>
                </div>
                <span className="text-violet-400 text-lg">{aiOpen ? '▲' : '▼'}</span>
              </button>

              {aiOpen && (
                <div className="border-t border-violet-200 dark:border-violet-800 px-5 py-4 space-y-4">
                  {/* Mode switcher */}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAiMode('serial')}
                      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${aiMode === 'serial' ? 'bg-violet-600 text-white' : 'border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40'}`}>
                      Serial Number
                    </button>
                    <button type="button" onClick={() => setAiMode('photo')}
                      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${aiMode === 'photo' ? 'bg-violet-600 text-white' : 'border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40'}`}>
                      Photo Scan
                    </button>
                  </div>

                  {aiMode === 'serial' ? (
                    <div className="flex gap-2">
                      <input value={serialInput} onChange={e => setSerialInput(e.target.value)}
                        placeholder="Enter IMEI / Serial Number (e.g. 354758112345678)"
                        className="flex-1 rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900" />
                      <button type="button" onClick={identifyDevice} disabled={aiLoading || !serialInput.trim()}
                        className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition">
                        {aiLoading ? '...' : 'Identify'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 p-6 cursor-pointer hover:border-violet-500 transition">
                        <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                        {aiPhoto
                          ? <img src={aiPhoto} alt="Device" className="h-28 w-28 object-cover rounded-lg" />
                          : <><span className="text-3xl">📷</span><span className="text-sm text-violet-600 dark:text-violet-400 font-medium">Take photo or upload device image</span></>
                        }
                      </label>
                      {aiPhoto && (
                        <button type="button" onClick={identifyDevice} disabled={aiLoading}
                          className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition">
                          {aiLoading ? 'Identifying...' : 'Identify Device from Photo'}
                        </button>
                      )}
                    </div>
                  )}

                  {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                  <p className="text-[11px] text-violet-500 dark:text-violet-400">AI will auto-fill the title, description, category, condition, and suggest a price. You can edit everything before submitting.</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Item Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. iPhone 12 Pro — 128GB Blue" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Condition *</label>
                  <select name="condition" value={form.condition} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900">
                    <option value="">Select...</option>
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the item, include storage size, accessories, any defects..." className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 resize-none" />
              </div>

              {/* Grace period / commission notice */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-4 py-3 flex items-start gap-3">
                <span className="text-xl mt-0.5">🎉</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">0% Commission for your first 5 months!</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">After the grace period, a 3% service fee applies on each sale. Fees are paid by the buyer on top of your listed price.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Your Price (RWF) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">RWF</span>
                    <input name="price" type="number" min="0" step="1" value={form.price} onChange={handleChange} required placeholder="0" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 py-2.5 pl-12 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900" />
                  </div>
                  {form.price && Number(form.price) > 0 && (
                    <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-2 text-xs space-y-0.5">
                      <div className="flex justify-between text-slate-500"><span>Your earnings</span><span className="font-semibold text-slate-800 dark:text-white">RWF {Number(form.price).toLocaleString()}</span></div>
                      <div className="flex justify-between text-slate-400"><span>+ 3% buyer fee</span><span>RWF {Math.round(Number(form.price) * 0.03).toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 pt-0.5"><span>Buyer pays</span><span>RWF {Math.round(Number(form.price) * 1.03).toLocaleString()}</span></div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kigali, Kimihurura" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp / Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+250 7XX XXX XXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900" />
                <p className="mt-1 text-xs text-slate-400">Buyers will contact you directly via WhatsApp</p>
              </div>

              {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={submitting || !session} className="w-full rounded-full bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? t('loading') : t('submitListing')}
              </button>
            </form>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">All listings are reviewed by KigaliTech before appearing on the marketplace.</p>
        </div>
      </section>
    </Layout>
  );
}
