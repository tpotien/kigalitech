import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

const STATUS_STYLE = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
};

const TIER_ICON = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

export default function AdminLoyaltyCards() {
  const { data: session } = useSession();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState({});

  useEffect(() => {
    fetch('/api/admin/loyalty-cards')
      .then(r => r.json())
      .then(data => { setCards(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  async function updateCard(id, status) {
    const res = await fetch('/api/admin/loyalty-cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminNotes: notes[id] || '' }),
    });
    const updated = await res.json();
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  }

  const filtered = filter === 'all' ? cards : cards.filter(c => c.status === filter);

  const myCard = cards.find(c => c.user?.email === session?.user?.email);

  return (
    <AdminLayout title="Loyalty Cards">

      {/* Admin's own card status */}
      <div className="mb-6 rounded-2xl border border-violet-100 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-violet-900 dark:text-violet-300 text-sm flex items-center gap-2">
            <span>💎</span> Your Platinum Card
          </p>
          {myCard ? (
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
              Status: <span className="font-bold capitalize">{myCard.status}</span>
              {myCard.status === 'approved' && myCard.expiresAt && ` · Expires ${new Date(myCard.expiresAt).toLocaleDateString()}`}
              {' '}· #{myCard.cardNumber}
            </p>
          ) : (
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">You haven&apos;t requested your card yet.</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/account/loyalty"
            className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 no-underline transition">
            {myCard ? 'View / Print My Card' : 'Request My Card'}
          </Link>
          {myCard && myCard.status === 'approved' && (
            <button onClick={() => updateCard(myCard.id, 'approved')}
              className="rounded-full border border-violet-300 dark:border-violet-700 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition">
              Renew
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${filter === s ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}>
            {s} {s === 'all' ? `(${cards.length})` : `(${cards.filter(c => c.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-3">🪪</p>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No card requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(card => (
            <div key={card.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Card preview (mini) */}
                <div className="flex-shrink-0 w-48 h-28 rounded-xl overflow-hidden shadow-md"
                  style={{ background: card.tier === 'Platinum' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : card.tier === 'Gold' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : card.tier === 'Silver' ? 'linear-gradient(135deg,#64748b,#475569)' : 'linear-gradient(135deg,#92400e,#b45309)' }}>
                  <div className="p-3 h-full flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest opacity-80">KIGALITECH</span>
                      <span className="text-base">{TIER_ICON[card.tier]}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono opacity-70 mb-0.5">{card.cardNumber}</p>
                      <p className="text-xs font-bold truncate">{card.user?.name || 'Member'}</p>
                      <p className="text-[9px] opacity-60 uppercase tracking-widest">{card.tier} Member</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLE[card.status]}`}>
                      {card.status}
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {TIER_ICON[card.tier]} {card.tier}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">{card.user?.name || '—'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{card.user?.email}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{card.cardNumber}</p>
                  <p className="text-xs text-slate-400 mt-1">Requested: {new Date(card.createdAt).toLocaleDateString()}</p>
                  {card.approvedAt && (
                    <p className="text-xs text-emerald-600 mt-0.5">Approved: {new Date(card.approvedAt).toLocaleDateString()} · Expires: {new Date(card.expiresAt).toLocaleDateString()}</p>
                  )}
                  {card.adminNotes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">Note: {card.adminNotes}</p>
                  )}
                </div>

                {/* Actions */}
                {(card.status === 'pending' || card.status === 'approved') && (
                  <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-48">
                    {card.status === 'pending' && (
                      <textarea
                        value={notes[card.id] || ''}
                        onChange={e => setNotes(n => ({ ...n, [card.id]: e.target.value }))}
                        placeholder="Optional note to member..."
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs resize-none focus:outline-none focus:border-sky-400"
                      />
                    )}
                    <button onClick={() => updateCard(card.id, 'approved')}
                      className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                      {card.status === 'approved' ? '↻ Renew (+1 yr)' : '✓ Approve'}
                    </button>
                    {card.status === 'pending' && (
                      <button onClick={() => updateCard(card.id, 'rejected')}
                        className="w-full rounded-xl border border-red-200 dark:border-red-800 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
