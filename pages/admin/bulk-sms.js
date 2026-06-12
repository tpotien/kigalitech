import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

const AUDIENCES = [
  { id: 'all', label: 'All registered users', desc: 'Everyone with a phone number on file' },
  { id: 'buyers', label: 'Customers who ordered', desc: 'Anyone who placed at least one order' },
  { id: 'loyalty', label: 'Loyalty members', desc: 'Users who have earned loyalty points' },
];

const MAX_SMS = 160;

export default function BulkSMS() {
  const [audience, setAudience] = useState('buyers');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setResult(null);
    fetch(`/api/admin/bulk-sms?audience=${audience}`)
      .then(r => r.json())
      .then(d => setCount(d.count))
      .catch(() => setCount(null));
  }, [audience]);

  async function send() {
    if (!message.trim()) return;
    if (!confirm(`Send SMS to ${count} recipient${count !== 1 ? 's' : ''}?\n\nMessage: "${message}"`)) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/bulk-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, audience }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: 'Network error' });
    }
    setSending(false);
  }

  const charsLeft = MAX_SMS - message.length;

  return (
    <AdminLayout title="Bulk SMS">
      <div className="max-w-2xl space-y-6">

        {/* Audience */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">1. Choose Audience</h2>
          <div className="space-y-2">
            {AUDIENCES.map(a => (
              <label key={a.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${audience === a.id ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="audience" value={a.id} checked={audience === a.id} onChange={() => setAudience(a.id)} className="mt-0.5 accent-sky-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{a.label}</p>
                  <p className="text-xs text-slate-500">{a.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {count !== null && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-700">
              <strong>{count}</strong> recipient{count !== 1 ? 's' : ''} will receive this message
            </div>
          )}
        </div>

        {/* Message */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">2. Write Message</h2>
          <textarea
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX_SMS))}
            placeholder="e.g. KigaliTech: Flash sale this weekend! 20% off all phones. Shop: kigalitechservices.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-400">Keep under 160 characters for single SMS</p>
            <span className={`text-xs font-semibold ${charsLeft < 20 ? 'text-red-500' : 'text-slate-400'}`}>{charsLeft} left</span>
          </div>

          {/* Quick templates */}
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Quick templates</p>
            <div className="flex flex-wrap gap-2">
              {[
                'KigaliTech: Flash sale today! Up to 30% off selected items. Shop: kigalitechservices.com',
                'KigaliTech: New stock just arrived! Check out the latest phones & laptops. kigalitechservices.com',
                'KigaliTech: Use code SAVE10 for 10% off your next order. Valid this week only!',
              ].map((t, i) => (
                <button key={i} onClick={() => setMessage(t.slice(0, MAX_SMS))}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-sky-50 hover:text-sky-700 transition">
                  Template {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Send */}
        <div className="flex items-center gap-4">
          <button
            onClick={send}
            disabled={sending || !message.trim() || count === 0}
            className="rounded-full bg-sky-600 px-8 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {sending ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending…</>
            ) : (
              `📤 Send to ${count ?? '…'} recipient${count !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl border px-5 py-4 ${result.error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            {result.error ? (
              <p className="text-sm font-semibold text-red-700">Error: {result.error}</p>
            ) : (
              <>
                <p className="font-semibold text-emerald-800">SMS blast complete</p>
                <p className="text-sm text-emerald-700 mt-1">
                  ✓ {result.sent} sent · {result.failed} failed · {result.total} total
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
