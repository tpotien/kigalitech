import { useState, useEffect } from 'react';
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
              <input value={config.whatsappNumber} onChange={set('whatsappNumber')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="250700000000" />
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
                <option value="RWF">RWF (RF)</option>
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Product Image URL</label>
              <input
                value={config.heroImageUrl || ''}
                onChange={set('heroImageUrl')}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="https://images.unsplash.com/... (leave blank for default)"
              />
              {config.heroImageUrl && (
                <img
                  src={config.heroImageUrl}
                  alt="Hero preview"
                  className="mt-2 h-24 w-40 rounded-xl object-cover border border-slate-100"
                  onError={e => e.target.style.display = 'none'}
                />
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
