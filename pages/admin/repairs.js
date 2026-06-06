import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const STATUS_OPTIONS = ['open', 'in_progress', 'completed', 'closed'];

const STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function AdminRepairs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.replace('/');
  }, [status, session]);

  useEffect(() => {
    fetch('/api/admin/repairs').then(r => r.json()).then(data => { setTickets(data); setLoading(false); });
  }, []);

  async function updateTicket(id, updates) {
    setSaving(true);
    const res = await fetch(`/api/admin/repairs?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditing(null);
    }
    setSaving(false);
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/admin" className="text-slate-400 hover:text-slate-900">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Repair Tickets</h1>
        <span className="ml-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">{tickets.length}</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                filter === s ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? `All (${tickets.length})` : `${s.replace('_', ' ')} (${tickets.filter(t => t.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Tickets */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-white p-16 text-center shadow-sm text-slate-400">No tickets found</div>
          ) : filtered.map(ticket => (
            <div key={ticket.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">#{ticket.id} — {ticket.productName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${PRIORITY_COLORS[ticket.priority] || 'bg-slate-100 text-slate-600'}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-slate-600">{ticket.issue}</p>
                  {ticket.description && <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={ticket.status}
                    onChange={e => updateTicket(ticket.id, { status: e.target.value })}
                    className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-200 ${STATUS_COLORS[ticket.status] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer info */}
              <div className="mt-4 flex flex-wrap gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                {ticket.user && (
                  <>
                    <span><span className="font-semibold text-slate-700">Customer: </span>{ticket.user.name || ticket.user.email}</span>
                    <span><span className="font-semibold text-slate-700">Email: </span>{ticket.user.email}</span>
                  </>
                )}
                {ticket.orderId && <span><span className="font-semibold text-slate-700">Order: </span>#{ticket.orderId}</span>}
                <span><span className="font-semibold text-slate-700">Submitted: </span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                {ticket.updatedAt !== ticket.createdAt && (
                  <span><span className="font-semibold text-slate-700">Updated: </span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                )}
              </div>

              {/* Admin notes */}
              {ticket.adminNotes && editing !== ticket.id && (
                <div className="mt-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">
                  <span className="font-semibold">Admin note: </span>{ticket.adminNotes}
                </div>
              )}

              {editing === ticket.id ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes for this ticket..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTicket(ticket.id, { adminNotes })}
                      disabled={saving}
                      className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Notes'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(ticket.id); setAdminNotes(ticket.adminNotes || ''); }}
                  className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {ticket.adminNotes ? 'Edit Notes' : '+ Add Notes'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
