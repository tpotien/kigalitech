import { useState, useEffect } from 'react';
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
    negotiable: false,
  });
  const [images, setImages] = useState([]); // array of base64 data URLs
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sellerStatusData, setSellerStatusData] = useState(null);

  useEffect(() => {
    if (!session) return;
    fetch('/api/marketplace/my-seller-status')
      .then(r => r.json())
      .then(d => setSellerStatusData(d))
      .catch(() => {});
  }, [session]);

  function resizeImage(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const MAX = 900;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageFiles(files) {
    const remaining = 8 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    const resized = await Promise.all(toProcess.map(resizeImage));
    setImages(prev => [...prev, ...resized]);
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!session) { router.push('/signin?callbackUrl=/marketplace/sell'); return; }
    if (!form.category || !form.condition) { setError('Please select category and condition.'); return; }
    if (images.length < 4) { setError('Please upload at least 4 photos of your item.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, images, price: Math.round(Number(form.price)) }),
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

            {sellerStatusData && sellerStatusData.sellerStatus === 'suspended' && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-5">
                <p className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <span>⛔</span> Your seller account is suspended
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Reason: <span className="capitalize">{sellerStatusData.sellerSuspendedReason?.replace('_', ' ') || 'Policy violation'}</span>.
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">Contact support to resolve this before you can list items.</p>
              </div>
            )}

            {sellerStatusData && !sellerStatusData.canList && sellerStatusData.sellerStatus !== 'suspended' && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-5">
                <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <span>⚠️</span> Subscription required to list
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Your 5-month free period has ended. Pay RWF 10,000/month via MoMo to <strong>0786276555</strong> then contact us to reactivate.
                </p>
              </div>
            )}

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

              {/* Photos — min 4 required */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Photos <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-semibold ${images.length >= 4 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {images.length}/4 min · {images.length}/8 max
                  </span>
                </div>

                {/* Image grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {images.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 transition">
                          ✕
                        </button>
                        {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white font-bold">COVER</span>}
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 8 && (
                  <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition ${images.length < 4 ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-violet-400'}`}>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => handleImageFiles(e.target.files)} />
                    <span className="text-2xl">📷</span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {images.length === 0 ? 'Upload at least 4 photos' : 'Add more photos'}
                    </p>
                    <p className="text-xs text-slate-400">First photo is the cover · JPG/PNG · auto-compressed</p>
                  </label>
                )}
              </div>

              {/* Subscription notice */}
              <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 px-4 py-3 flex items-start gap-3">
                <span className="text-xl mt-0.5">💼</span>
                <div>
                  <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Sell on KigaliTech Marketplace</p>
                  <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">Free to list for the first 5 months. After the grace period, a <strong>RWF 10,000/month</strong> subscription is required to keep your listings active and continue selling.</p>
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
                    <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200"><span>Buyer pays</span><span>RWF {Number(form.price).toLocaleString()}</span></div>
                      <div className="flex justify-between text-slate-500 mt-0.5"><span>You receive</span><span className="font-semibold text-emerald-700 dark:text-emerald-400">RWF {Number(form.price).toLocaleString()}</span></div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kigali, Kimihurura" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  WhatsApp / Phone <span className="text-red-500">*</span>
                </label>
                <input required name="phone" value={form.phone} onChange={handleChange} placeholder="+250 7XX XXX XXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900" />
                <p className="mt-1 text-xs text-slate-400">Required — buyers contact you directly via WhatsApp</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 hover:border-violet-400 transition">
                <input type="checkbox" name="negotiable" checked={form.negotiable}
                  onChange={e => setForm(p => ({ ...p, negotiable: e.target.checked }))}
                  className="accent-violet-600 h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Price is negotiable</p>
                  <p className="text-xs text-slate-400 mt-0.5">Shows a "Negotiable" badge on your listing</p>
                </div>
              </label>

              {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={submitting || !session || (sellerStatusData && !sellerStatusData.canList)} className="w-full rounded-full bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed">
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
