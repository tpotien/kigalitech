import { useState } from 'react';
import Layout from '../components/Layout';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setSent(true); } else { setError(data.error || 'Failed to send. Please try again.'); }
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-800';

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Get in Touch</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-slate-100">Contact Us</h1>
          <p className="mt-3 text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Questions, repairs, or bulk orders — our team responds within a few hours.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: '📍', title: 'Visit Us', lines: ['KN 74St, infront of Al madina mosque', 'Kigali, Rwanda'] },
              { icon: '📞', title: 'Call Us', lines: ['+250 786 276 555', 'Mon – Sat, 8am – 8pm'] },
              { icon: '📧', title: 'Email Us', lines: ['kigalitechservices@gmail.com', 'tpotien1@gmail.com'] },
              { icon: '💬', title: 'WhatsApp', lines: ['+250 786 276 555', 'Quick replies via WhatsApp'] },
            ].map(item => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <div className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  {item.lines.map(l => <p key={l} className="text-sm text-slate-500 dark:text-slate-400">{l}</p>)}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Message Sent!</h2>
                <p className="text-slate-500 dark:text-slate-400">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-3 rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Send a Message</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Your Name *</label>
                    <input required value={form.name} onChange={set('name')} className={inp} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address *</label>
                    <input required type="email" value={form.email} onChange={set('email')} className={inp} placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
                  <select required value={form.subject} onChange={set('subject')} className={inp}>
                    <option value="">Select a topic...</option>
                    <option>Order inquiry</option>
                    <option>Product question</option>
                    <option>Repair request</option>
                    <option>Bulk / business order</option>
                    <option>Return or exchange</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={set('message')} className={`${inp} resize-none`} placeholder="How can we help you?" />
                </div>
                {error && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-full bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Find Us</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">KN 74St, infront of Al madina mosque, Kigali, Rwanda</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.4895!2d30.0619!3d-1.9441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca6f7e9b6c4a1%3A0x8c2b4e3f1a9d5e2b!2sKN%2074%20St%2C%20Kigali!5e0!3m2!1sen!2srw!4v1699000000000!5m2!1sen!2srw"
            width="100%"
            height="400"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="KigaliTech Store Location"
          />
        </div>
      </div>
    </Layout>
  );
}
