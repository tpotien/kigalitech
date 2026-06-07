import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function SiteConfig() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.replace('/admin');
  }, [status, session]);

  useEffect(() => {
    fetch('/api/admin/site-config').then(r => r.json()).then(setConfig);
    fetch('/api/admin/products').then(r => r.json()).then(data => setProducts(Array.isArray(data) ? data : []));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/site-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!config) return (
    <AdminLayout title="Site Settings">
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    </AdminLayout>
  );

  const set = (k) => (e) => setConfig({ ...config, [k]: e.target.value });

  async function handleHeroUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: ev.target.result }),
        });
        const data = await res.json();
        if (data.url) setConfig(c => ({ ...c, heroImageUrl: data.url }));
      } finally {
        setHeroUploading(false);
        if (heroFileRef.current) heroFileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <AdminLayout title="Site Settings">
      <form onSubmit={save} className="max-w-2xl space-y-6">
        {saved && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 font-medium">
            Settings saved successfully!
          </div>
        )}

        {/* Brand */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Brand Identity</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Site / App Name</label>
              <input value={config.siteName} onChange={set('siteName')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="KigaliTech" />
              <p className="mt-1 text-xs text-slate-400">Shown in header, emails, and receipts</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tagline</label>
              <input value={config.tagline} onChange={set('tagline')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Logo URL (leave blank to use icon)</label>
              <input value={config.logoUrl} onChange={set('logoUrl')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="https://..." />
              {config.logoUrl && <img src={config.logoUrl} alt="Logo preview" className="mt-2 h-12 rounded-lg object-contain border border-slate-100 p-1" />}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Contact & Location</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Business Email</label>
                <input value={config.email} onChange={set('email')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Business Phone</label>
                <input value={config.phone} onChange={set('phone')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
              <input value={config.address} onChange={set('address')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp Number (with country code)</label>
              <input value={config.whatsappNumber} onChange={set('whatsappNumber')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="250786276555" />
              <p className="mt-1 text-xs text-slate-400">No + or spaces, e.g. 250788123456</p>
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Display Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Currency Symbol</label>
              <select value={config.currency} onChange={set('currency')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200">
                <option value="USD">USD ($)</option>
                <option value="RWF">RWF (Rwandan Franc)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Primary Color (hex)</label>
              <div className="flex gap-2">
                <input type="color" value={config.primaryColor} onChange={set('primaryColor')} className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 p-0.5" />
                <input value={config.primaryColor} onChange={set('primaryColor')} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Flash Deal ── */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="font-semibold text-slate-900">Flash Deal</h2>
              <p className="text-xs text-slate-400">Controls the countdown deal shown on the homepage</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Featured Product</label>
              <select
                value={config.flashDealProductId || ''}
                onChange={set('flashDealProductId')}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">— Auto (first matching product) —</option>
                {products.map(p => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name} — ${(p.price / 100).toFixed(2)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Leave empty to auto-select XM6 or first discounted product</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Discount %</label>
                <input
                  type="number" min="1" max="99"
                  value={config.flashDealDiscount || '25'}
                  onChange={set('flashDealDiscount')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Timer (hours)</label>
                <input
                  type="number" min="1" max="72"
                  value={config.flashDealHours || '8'}
                  onChange={set('flashDealHours')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Badge Label</label>
                <input
                  value={config.flashDealLabel || ''}
                  onChange={set('flashDealLabel')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Flash Deal — Ends Soon"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Hero / New Arrivals ── */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🌟</span>
            <div>
              <h2 className="font-semibold text-slate-900">New Arrivals Hero</h2>
              <p className="text-xs text-slate-400">Customise the full-width hero section at the top of the homepage</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Badge Text</label>
              <input
                value={config.heroBadgeText || ''}
                onChange={set('heroBadgeText')}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="New Arrivals Just Dropped"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Headline (3 lines, separated by \n)</label>
              <input
                value={config.heroTitle || ''}
                onChange={set('heroTitle')}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono"
                placeholder="Tech That\nElevates\nYour Life"
              />
              <p className="mt-1 text-xs text-slate-400">Line 1 — plain | Line 2 — gradient highlight | Line 3 — plain. Use \n to separate.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Subtitle</label>
              <textarea
                rows={2}
                value={config.heroSubtitle || ''}
                onChange={set('heroSubtitle')}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
                placeholder="Premium electronics — phones, laptops..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Price Label</label>
                <input
                  value={config.heroPriceLabel || ''}
                  onChange={set('heroPriceLabel')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Starting from"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Price</label>
                <input
                  value={config.heroPrice || ''}
                  onChange={set('heroPrice')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="$129.99"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Product Image</label>
              {/* Upload from device */}
              <div className="mb-2 flex items-center gap-3">
                <input
                  ref={heroFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeroUpload}
                />
                <button
                  type="button"
                  onClick={() => heroFileRef.current?.click()}
                  disabled={heroUploading}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50 transition"
                >
                  {heroUploading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Image from Device
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-400">or paste URL below</span>
              </div>
              <input
                value={config.heroImageUrl || ''}
                onChange={set('heroImageUrl')}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="https://images.unsplash.com/... (leave blank for default)"
              />
              {config.heroImageUrl && (
                <div className="mt-3 relative w-fit">
                  <img
                    src={config.heroImageUrl}
                    alt="Hero preview"
                    className="h-32 w-56 rounded-xl object-cover border border-slate-200 shadow-sm"
                    onError={e => e.target.style.display = 'none'}
                  />
                  <button
                    type="button"
                    onClick={() => setConfig(c => ({ ...c, heroImageUrl: '' }))}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 text-xs"
                    title="Remove image"
                  >×</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 shadow-lg shadow-sky-200"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </AdminLayout>
  );
}
