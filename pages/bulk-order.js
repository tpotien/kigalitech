import { useState } from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';

export default function BulkOrder() {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', items: '', quantity: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const setField = k => e => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/bulk-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed. Please try again.'); setLoading(false); return; }
    setDone(true); setLoading(false);
  }

  const benefits = [
    { icon: '💰', title: 'Volume Discounts', desc: 'Up to 25% off for 10+ units' },
    { icon: '🚚', title: 'Free Delivery', desc: 'Free delivery for orders of 10+ units in Kigali' },
    { icon: '👤', title: 'Account Manager', desc: 'Dedicated contact for your business needs' },
  ];

  return (
    <Layout title="Corporate & Bulk Orders">
      <Head><title>Bulk Orders | KigaliTech</title></Head>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <span className="inline-block rounded-full bg-sky-100 dark:bg-sky-900/30 px-4 py-1.5 text-sky-700 dark:text-sky-300 text-sm font-semibold mb-4">Corporate & B2B</span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">Bulk & Corporate Orders</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">For businesses, schools, NGOs, and government buying 5+ devices. Get exclusive pricing and dedicated support.</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {benefits.map(b => (
            <div key={b.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 text-center">
              <div className="text-3xl mb-2">{b.icon}</div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{b.title}</h3>
              <p className="text-xs text-slate-500">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Form */}
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-5">Request a Quote</h2>
              {done ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Quote Request Received!</h3>
                  <p className="text-slate-500 text-sm">We&apos;ll send your quote within 2 hours via WhatsApp and email.</p>
                  <a href={`https://wa.me/250786276555?text=Hello, I just submitted a bulk order quote request for ${form.companyName}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-5 rounded-xl bg-emerald-500 text-white px-6 py-2.5 text-sm font-bold hover:bg-emerald-600 transition-colors">
                    💬 Chat on WhatsApp
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Company Name *</label>
                      <input required value={form.companyName} onChange={setField('companyName')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Contact Person *</label>
                      <input required value={form.contactName} onChange={setField('contactName')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email *</label>
                      <input required type="email" value={form.email} onChange={setField('email')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">WhatsApp / Phone *</label>
                      <input required value={form.phone} onChange={setField('phone')} placeholder="+250 7XX XXX XXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Products Needed</label>
                    <textarea value={form.items} onChange={setField('items')} rows={3} placeholder="e.g. 20x Samsung Galaxy A35, 10x iPhone 15 Pro, 5x MacBook Air M2"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Additional Requirements</label>
                    <textarea value={form.message} onChange={setField('message')} rows={2} placeholder="Delivery timeline, warranty requirements, payment terms..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold py-3 text-sm transition-colors">
                    {loading ? 'Sending…' : 'Request Quote →'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
              <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-3 text-sm">Quick WhatsApp</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Need an immediate quote? Chat directly with our B2B team.</p>
              <a href="https://wa.me/250786276555?text=Hello KigaliTech, I need a bulk order quote"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 text-sm transition-colors no-underline">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat on WhatsApp
              </a>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Why choose KigaliTech?</p>
              <p>✅ Genuine products with full warranty</p>
              <p>✅ RRA-certified invoices provided</p>
              <p>✅ Flexible payment terms</p>
              <p>✅ After-sales support in Kigali</p>
              <p>✅ Same-day delivery available</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
