import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subject: 'Contact Form' }),
      });
      const data = await res.json();
      if (res.ok) setSent(true);
      else setError(data.error || 'Failed to send. Please try again.');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = 'w-full border border-ex-border rounded px-4 py-3 text-sm text-ex-text outline-none focus:border-primary placeholder:text-ex-muted';

  return (
    <Layout>
      <div className="max-w-container mx-auto px-4 lg:px-6 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-ex-muted flex items-center gap-2 mb-14">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ex-text font-medium">Contact</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Contact info ── */}
          <div className="lg:col-span-1 space-y-5">
            {/* Call To Us */}
            <div className="rounded border border-ex-border p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-ex-text">Call To Us</h3>
              </div>
              <p className="text-sm text-ex-muted mb-2">We are available 24/7, 7 days a week.</p>
              <p className="text-sm text-ex-text font-medium">Phone: +250 786 276 555</p>
            </div>

            {/* Horizontal divider */}
            <hr className="border-ex-border" />

            {/* Write To Us */}
            <div className="rounded border border-ex-border p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-ex-text">Write To Us</h3>
              </div>
              <p className="text-sm text-ex-muted mb-3">Fill out our form and we will contact you within 24 hours.</p>
              <p className="text-sm text-ex-text">Emails: kigalitechservices@gmail.com</p>
              <p className="text-sm text-ex-text mt-1">Support: tpotien1@gmail.com</p>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="lg:col-span-2 rounded border border-ex-border p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 text-3xl">✓</div>
                <h2 className="text-xl font-semibold text-ex-text mb-2">Message Sent!</h2>
                <p className="text-ex-muted text-sm mb-6">We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', message: '' }); }}
                  className="btn-outline text-sm">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input required value={form.name} onChange={set('name')} placeholder="Your Name *" className={inp} />
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="Your Email *" className={inp} />
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="Your Phone" className={inp} />
                </div>
                <textarea required rows={8} value={form.message} onChange={set('message')}
                  placeholder="Your Message"
                  className={`${inp} resize-none`} />
                {error && (
                  <div className="rounded bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={loading} className="btn-primary px-10 disabled:opacity-60">
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
