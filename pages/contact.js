import { useState } from 'react';
import Layout from '../components/Layout';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Get in Touch</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Contact Us</h1>
          <p className="mt-3 text-lg text-slate-500 max-w-md mx-auto">
            Questions, repairs, or bulk orders — our team responds within a few hours.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: '📍', title: 'Visit Us', lines: ['KN 3 Ave, Kigali City Tower', 'Kigali, Rwanda'] },
              { icon: '📞', title: 'Call Us', lines: ['+250 788 000 000', 'Mon – Sat, 8am – 6pm'] },
              { icon: '📧', title: 'Email Us', lines: ['hello@kigalitech.com', 'support@kigalitech.com'] },
              { icon: '💬', title: 'WhatsApp', lines: ['+250 700 000 000', 'Quick replies via WhatsApp'] },
            ].map(item => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  {item.lines.map(l => <p key={l} className="text-sm text-slate-500">{l}</p>)}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Message Sent!</h2>
                <p className="text-slate-500">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-3 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Send a Message</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name *</label>
                    <input required value={form.name} onChange={set('name')} className={inp} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                    <input required type="email" value={form.email} onChange={set('email')} className={inp} placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={set('message')} className={`${inp} resize-none`} placeholder="How can we help you?" />
                </div>
                <button type="submit" className="w-full rounded-full bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
