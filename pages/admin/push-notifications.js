import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function AdminPushNotifications() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ title: '', body: '', url: '/' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [subCount, setSubCount] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin');
    if (session && !['admin', 'staff'].includes(session.user?.role)) router.push('/');
  }, [session, status, router]);

  useEffect(() => {
    fetch('/api/push/stats').then(r => r.ok ? r.json() : null).then(d => d && setSubCount(d.count)).catch(() => {});
  }, []);

  async function send(e) {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setSending(true);
    setResult(null);
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
  }

  const inp = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500';

  const QUICK = [
    { title: '🔥 Flash Sale Live!', body: 'Limited-time deals are now active. Shop before they expire!', url: '/deals' },
    { title: '📦 New Arrivals', body: 'Fresh products just dropped — be the first to shop them.', url: '/products' },
    { title: '🎁 Exclusive Deal', body: 'A special offer just for KigaliTech customers. Tap to see!', url: '/deals' },
  ];

  return (
    <AdminLayout title="Push Notifications">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Stats */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-2xl">🔔</div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{subCount ?? '—'}</p>
            <p className="text-sm text-slate-500">Active subscribers</p>
          </div>
        </div>

        {/* Quick templates */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Templates</p>
          <div className="grid gap-2">
            {QUICK.map((t, i) => (
              <button key={i} onClick={() => setForm({ title: t.title, body: t.body, url: t.url })}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 hover:border-sky-400 transition">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.body}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Compose */}
        <form onSubmit={send} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Compose Notification</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
            <input className={inp} placeholder="Notification title" maxLength={60}
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Message</label>
            <textarea className={`${inp} resize-none`} rows={3} placeholder="Notification body text" maxLength={200}
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tap-to-open URL</label>
            <input className={inp} placeholder="/products or /deals"
              value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <button type="submit" disabled={sending}
            className="w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50 transition">
            {sending ? 'Sending…' : `Send to All Subscribers`}
          </button>
          {result && (
            <div className={`rounded-xl p-3 text-sm text-center font-semibold ${result.sent > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {result.sent > 0 ? `✓ Sent to ${result.sent} / ${result.total} subscribers` : 'No subscribers received the notification'}
              {result.failed > 0 && ` · ${result.failed} failed`}
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
