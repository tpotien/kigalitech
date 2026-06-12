import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Link from 'next/link';
import { useWhatsAppCtx } from '../context/WhatsAppContext';
import { useCurrency } from '../context/CurrencyContext';

const ISSUE_TYPES = [
  'Screen Damage',
  'Battery',
  'Water Damage',
  'Charging Port',
  'Software',
  'Other',
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Standard (3–5 days)' },
  { value: 'medium', label: 'Express (1–2 days)' },
  { value: 'high', label: 'Urgent (Same day)' },
];

export default function RepairsPage() {
  const { data: session, status } = useSession();
  const { format } = useCurrency();
  const router = useRouter();
  const { setWhatsappCtx } = useWhatsAppCtx();

  useEffect(() => {
    setWhatsappCtx({ type: 'repair' });
    return () => setWhatsappCtx(null);
  }, []);

  const [form, setForm] = useState({
    brand: '',
    model: '',
    issueType: '',
    description: '',
    urgency: 'low',
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (session) {
      setLoadingTickets(true);
      fetch('/api/repairs')
        .then(r => r.json())
        .then(data => setTickets(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoadingTickets(false));
    }
  }, [session, success]);

  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  }

  function removeImage(idx) {
    const newImages = images.filter((_, i) => i !== idx);
    const newPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImages(newImages);
    setImagePreviews(newPreviews);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.brand || !form.model || !form.issueType || !form.description) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      let deviceImages = [];
      if (images.length > 0) {
        for (const file of images) {
          const imageDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const res = await fetch('/api/repairs/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUrl }),
          });
          if (res.ok) {
            const data = await res.json();
            deviceImages.push(data.url);
          }
        }
      }

      const payload = {
        productName: `${form.brand} ${form.model}`.trim(),
        issue: `${form.issueType}${form.description ? ': ' + form.description : ''}`,
        description: form.description,
        priority: form.urgency,
        deviceImages,
      };

      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        setForm({ brand: '', model: '', issueType: '', description: '', urgency: 'low' });
        setImages([]);
        setImagePreviews([]);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit repair request.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const STATUS_META = {
    open:          { label: 'Open',          color: 'bg-amber-100 text-amber-700' },
    in_progress:   { label: 'In Progress',   color: 'bg-sky-100 text-sky-700' },
    waiting_parts: { label: 'Waiting Parts', color: 'bg-violet-100 text-violet-700' },
    completed:     { label: 'Completed',     color: 'bg-emerald-100 text-emerald-700' },
    cancelled:     { label: 'Cancelled',     color: 'bg-red-100 text-red-600' },
  };
  const QUOTE_META = {
    pending:   null,
    quoted:    { label: 'Quote ready',   color: 'bg-amber-50 border-amber-200 text-amber-800' },
    accepted:  { label: 'Quote accepted', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    rejected:  { label: 'Quote rejected', color: 'bg-red-50 border-red-200 text-red-700' },
    confirmed: { label: 'Confirmed',      color: 'bg-sky-50 border-sky-200 text-sky-800' },
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900">
              <svg className="h-7 w-7 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Repair Center</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Send us your device — we diagnose, quote, and fix.</p>
          </div>

          {/* Not logged in */}
          {status === 'unauthenticated' && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sign in to submit a repair request</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Create an account or sign in to track your repair tickets and get updates.</p>
              <button
                onClick={() => signIn(undefined, { callbackUrl: '/repairs' })}
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-8 py-3 font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                Sign In to Continue
              </button>
            </div>
          )}

          {/* Logged in */}
          {status === 'authenticated' && (
            <div className="space-y-8">

              {/* Existing tickets — shown FIRST */}
              {loadingTickets && (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
                </div>
              )}
              {!loadingTickets && tickets.length > 0 && (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Repair Tickets</h2>
                    <Link href="/account?tab=repairs" className="text-xs font-semibold text-sky-600 hover:text-sky-700 no-underline">View all →</Link>
                  </div>
                  <div className="space-y-3">
                    {tickets.map(ticket => {
                      const sm = STATUS_META[ticket.status] || { label: ticket.status, color: 'bg-slate-100 text-slate-600' };
                      const qm = QUOTE_META[ticket.quoteStatus];
                      return (
                        <div key={ticket.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{ticket.productName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{ticket.issue}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(ticket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            </div>
                            <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${sm.color}`}>{sm.label}</span>
                          </div>
                          {qm && (
                            <div className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${qm.color}`}>
                              {ticket.quoteStatus === 'quoted' && ticket.quotedCost > 0
                                ? `${qm.label}: ${format(ticket.quotedCost)} — check your account to accept or decline`
                                : qm.label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Success state */}
              {success && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">Repair Request Submitted!</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Our team will review your request and get back to you shortly.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={() => setSuccess(false)}
                      className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Submit Another
                    </button>
                    <Link href="/account?tab=repairs" className="rounded-full border border-emerald-300 px-6 py-2.5 text-sm font-semibold text-emerald-700 no-underline hover:bg-emerald-100">
                      View My Tickets
                    </Link>
                  </div>
                </div>
              )}

              {/* Form */}
              {!success && (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submit a Repair Request</h2>
                  {error && (
                    <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  <datalist id="brand-list">
                    {['Apple','Samsung','Xiaomi','Huawei','OnePlus','Google','Sony','LG','Oppo','Realme','Tecno','Infinix','Nokia','Motorola'].map(b => <option key={b} value={b} />)}
                  </datalist>
                  <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
                    {/* Device Brand + Model */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Device Brand *</label>
                        <input
                          type="text"
                          required
                          list="brand-list"
                          autoComplete="organization"
                          value={form.brand}
                          onChange={e => setForm({ ...form, brand: e.target.value })}
                          placeholder="e.g. Apple, Samsung, Xiaomi"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Device Model *</label>
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          value={form.model}
                          onChange={e => setForm({ ...form, model: e.target.value })}
                          placeholder="e.g. iPhone 15 Pro, Galaxy S24"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
                        />
                      </div>
                    </div>

                    {/* Issue Type */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Issue Type *</label>
                      <select
                        required
                        value={form.issueType}
                        onChange={e => setForm({ ...form, issueType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
                      >
                        <option value="">Select issue type…</option>
                        {ISSUE_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Describe the Problem *</label>
                      <textarea
                        required
                        rows={4}
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Please describe what's wrong with your device in detail…"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 resize-none"
                      />
                    </div>

                    {/* Urgency */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Urgency</label>
                      <select
                        value={form.urgency}
                        onChange={e => setForm({ ...form, urgency: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
                      >
                        {URGENCY_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Photos (up to 3)</label>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Upload photos of the damage to help us diagnose faster.</p>

                      {imagePreviews.length > 0 && (
                        <div className="mb-3 flex gap-3 flex-wrap">
                          {imagePreviews.map((src, i) => (
                            <div key={i} className="relative h-24 w-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                              <img src={src} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {images.length < 3 && (
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 px-4 py-4 hover:border-sky-400 transition-colors">
                          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-slate-500 dark:text-slate-400">Click to upload photos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-full bg-sky-600 py-3.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-sky-200 dark:shadow-sky-900/30"
                    >
                      {submitting ? 'Submitting…' : 'Submit Repair Request'}
                    </button>
                  </form>
                </div>
              )}

              {/* Info card */}
              <div className="rounded-3xl bg-slate-900 dark:bg-slate-800 px-6 py-6 sm:px-8">
                <h3 className="font-bold text-white mb-3">How our repair process works</h3>
                <div className="space-y-3">
                  {[
                    { step: '1', title: 'Submit Request', desc: 'Fill out the form with your device details and problem description.' },
                    { step: '2', title: 'Diagnosis & Quote', desc: "Bring your device to our store. We'll diagnose it and provide a free quote." },
                    { step: '3', title: 'Repair & Pickup', desc: 'Once approved, our technicians fix your device and you pick it up.' },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">{s.step}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{s.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-700 pt-4">
                  <p className="text-sm text-slate-300">📍 KN 74St, infront of Al madina mosque, Kigali Rwanda</p>
                  <p className="text-sm text-slate-300 mt-1">📞 +250 786 276 555</p>
                  <p className="text-xs text-slate-400 mt-1">🕒 Mon–Sat: 8:00 AM – 8:00 PM</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
