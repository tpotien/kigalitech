import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_parts', 'completed', 'cancelled'];

const STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_parts: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const QUOTE_COLORS = {
  pending: 'bg-slate-100 text-slate-500',
  quoted: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-500',
  confirmed: 'bg-blue-100 text-blue-700',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-500',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

function ImageLightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <img src={images[idx]} alt="" className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-4 flex gap-2">
            {images.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-2 bg-white/40'}`} />)}
          </div>
        </>
      )}
    </div>
  );
}

function RepairCard({ ticket, onUpdate }) {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [quotedCost, setQuotedCost] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const images = (() => { try { return JSON.parse(ticket.deviceImages || '[]'); } catch { return []; } })();

  async function patch(body) {
    setSaving(true);
    const res = await fetch(`/api/admin/repairs?id=${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { onUpdate(data); return true; }
    return false;
  }

  async function handleQuote(e) {
    e.preventDefault();
    const cents = Math.round(parseFloat(quotedCost) * 100);
    if (!cents || cents <= 0) return;
    const ok = await patch({ action: 'set_quote', quotedCost: cents, quoteNotes });
    if (ok) { setShowQuoteForm(false); setQuotedCost(''); setQuoteNotes(''); }
  }

  async function handleConfirm() {
    await patch({ action: 'confirm' });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
            <h3 className="font-bold text-slate-900">{ticket.productName}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${PRIORITY_COLORS[ticket.priority] || 'bg-slate-100 text-slate-500'}`}>
              {ticket.priority}
            </span>
            {ticket.quoteStatus !== 'pending' && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${QUOTE_COLORS[ticket.quoteStatus] || 'bg-slate-100 text-slate-500'}`}>
                Quote: {ticket.quoteStatus}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-slate-600">{ticket.issue}</p>
          {ticket.description && <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>}
        </div>
        <select
          value={ticket.status}
          onChange={e => patch({ status: e.target.value })}
          className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer ${STATUS_COLORS[ticket.status] || 'bg-slate-100 text-slate-600'}`}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Device photos */}
      {images.length > 0 && (
        <div className="px-5 pt-4">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-400">Device Photos ({images.length})</p>
          <div className="flex gap-2 flex-wrap">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-sky-300 hover:shadow-md transition-all"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                  <svg className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quote area */}
      <div className="px-5 pt-4">
        {ticket.quotedCost > 0 && (
          <div className={`rounded-xl p-4 mb-3 ${
            ticket.quoteStatus === 'accepted' ? 'bg-emerald-50 border border-emerald-100'
            : ticket.quoteStatus === 'rejected' ? 'bg-red-50 border border-red-100'
            : ticket.quoteStatus === 'confirmed' ? 'bg-blue-50 border border-blue-100'
            : 'bg-amber-50 border border-amber-100'
          }`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Repair Quote</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">${(ticket.quotedCost / 100).toFixed(2)}</p>
                {ticket.quoteNotes && <p className="text-sm text-slate-600 mt-1">{ticket.quoteNotes}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${QUOTE_COLORS[ticket.quoteStatus]}`}>
                  {ticket.quoteStatus === 'quoted' ? 'Awaiting customer' : ticket.quoteStatus}
                </span>
                {ticket.quoteStatus === 'accepted' && (
                  <button onClick={handleConfirm} disabled={saving}
                    className="mt-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {saving ? 'Confirming...' : '✓ Confirm & Start Repair'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quote form */}
        {!showQuoteForm && ticket.quoteStatus !== 'confirmed' && ticket.quoteStatus !== 'rejected' && (
          <button
            onClick={() => { setShowQuoteForm(true); setQuotedCost(ticket.quotedCost ? (ticket.quotedCost / 100).toFixed(2) : ''); setQuoteNotes(ticket.quoteNotes || ''); }}
            className="mb-3 flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-sky-300 hover:text-sky-700 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {ticket.quotedCost ? 'Revise Quote' : 'Set Repair Quote'}
          </button>
        )}

        {showQuoteForm && (
          <form onSubmit={handleQuote} className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-bold text-slate-800">Set Repair Cost Quote</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Cost (USD) *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-sky-400">
                  <span className="pl-3 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={quotedCost}
                    onChange={e => setQuotedCost(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent px-2 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Note to Customer (optional)</label>
              <textarea
                rows={2}
                value={quoteNotes}
                onChange={e => setQuoteNotes(e.target.value)}
                placeholder="e.g. Screen replacement + labor. Turnaround: 2-3 days."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="rounded-full bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors">
                {saving ? 'Sending...' : 'Send Quote to Customer'}
              </button>
              <button type="button" onClick={() => setShowQuoteForm(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Customer info + meta */}
      <div className="mx-5 mb-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 flex flex-wrap gap-x-5 gap-y-1.5">
        {ticket.user && (
          <>
            <span><span className="font-bold text-slate-700">Customer: </span>{ticket.user.name || '—'}</span>
            <span><span className="font-bold text-slate-700">Email: </span>{ticket.user.email}</span>
            {ticket.user.phoneNumber && <span><span className="font-bold text-slate-700">Phone: </span>{ticket.user.phoneNumber}</span>}
          </>
        )}
        <span><span className="font-bold text-slate-700">Submitted: </span>{new Date(ticket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        {ticket.orderId && <span><span className="font-bold text-slate-700">Order: </span>#{ticket.orderId}</span>}
      </div>

      {/* Admin notes */}
      <div className="px-5 pb-5">
        {!showNotesForm && (
          <button onClick={() => { setShowNotesForm(true); setAdminNotes(ticket.adminNotes || ''); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            {ticket.adminNotes ? `Internal note: "${ticket.adminNotes.slice(0, 40)}${ticket.adminNotes.length > 40 ? '...' : ''}"` : 'Add internal note'}
          </button>
        )}
        {showNotesForm && (
          <div className="space-y-2">
            <textarea rows={2} value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal notes (not visible to customer)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 resize-none" />
            <div className="flex gap-2">
              <button onClick={async () => { await patch({ adminNotes }); setShowNotesForm(false); }} disabled={saving}
                className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Note'}
              </button>
              <button onClick={() => setShowNotesForm(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {lightbox !== null && <ImageLightbox images={images} startIdx={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default function AdminRepairs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.replace('/');
  }, [status, session]);

  useEffect(() => {
    fetch('/api/admin/repairs')
      .then(r => r.json())
      .then(d => { setTickets(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setTickets([]); setLoading(false); });
  }, []);

  function updateTicket(updated) {
    setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
  }

  const FILTER_TABS = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'waiting_parts', label: 'Waiting Parts' },
    { id: 'completed', label: 'Completed' },
    { id: 'quote_pending', label: 'Needs Quote' },
    { id: 'accepted', label: 'Quote Accepted' },
  ];

  const filtered = tickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'quote_pending') return t.quoteStatus === 'pending' && t.status !== 'cancelled' && t.status !== 'completed';
    if (filter === 'accepted') return t.quoteStatus === 'accepted';
    return t.status === filter;
  });

  const needsAction = tickets.filter(t => t.quoteStatus === 'pending' && t.status !== 'cancelled' && t.status !== 'completed').length
    + tickets.filter(t => t.quoteStatus === 'accepted').length;

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Repair Requests</h1>
            <p className="text-sm text-slate-500 mt-0.5">{tickets.length} total · {needsAction > 0 ? `${needsAction} need attention` : 'all up to date'}</p>
          </div>
          {needsAction > 0 && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">{needsAction}</span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(f => {
            const count = f.id === 'all' ? tickets.length
              : f.id === 'quote_pending' ? tickets.filter(t => t.quoteStatus === 'pending' && t.status !== 'cancelled' && t.status !== 'completed').length
              : f.id === 'accepted' ? tickets.filter(t => t.quoteStatus === 'accepted').length
              : tickets.filter(t => t.status === f.id).length;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  filter === f.id ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}>
                {f.label}
                {count > 0 && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${filter === f.id ? 'bg-white/20 text-white' : (f.id === 'quote_pending' || f.id === 'accepted') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-100 p-16 text-center shadow-sm">
            <p className="text-slate-400 font-medium">No repair tickets in this category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(ticket => (
              <RepairCard key={ticket.id} ticket={ticket} onUpdate={updateTicket} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
