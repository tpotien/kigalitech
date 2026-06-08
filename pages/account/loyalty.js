import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Link from 'next/link';

const RWF_PER_POINT = 13.4; // 100 pts = RWF 1,340

function rwfValue(points) {
  return `RWF ${Math.round(points * RWF_PER_POINT).toLocaleString()}`;
}

function TransactionRow({ tx }) {
  const isEarn = tx.points > 0;
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
          isEarn ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'
        }`}>
          {isEarn ? '↑' : '↓'}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {tx.action === 'earn' ? 'Points Earned' : tx.action === 'redeem' ? 'Points Redeemed' : 'Points Expired'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tx.reason}</p>
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">
            {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <p className={`text-sm font-extrabold tabular-nums ${isEarn ? 'text-emerald-600' : 'text-red-500'}`}>
        {isEarn ? '+' : ''}{tx.points} pts
      </p>
    </div>
  );
}

// Tier ladder by role: admin=Platinum(top), staff=Gold(top), users capped at Silver
function TierProgress({ points, role }) {
  const ALL = [
    { name: 'Bronze',   min: 0,     max: 499,  color: 'bg-amber-600',  icon: '🥉' },
    { name: 'Silver',   min: 500,   max: 999,  color: 'bg-slate-400',  icon: '🥈' },
    { name: 'Gold',     min: 1000,  max: 4999, color: 'bg-yellow-500', icon: '🥇' },
    { name: 'Platinum', min: 5000,  max: null, color: 'bg-violet-500', icon: '💎' },
  ];
  const tiers = role === 'admin'
    ? ALL
    : role === 'staff'
      ? ALL.slice(0, 3) // Bronze → Silver → Gold (top for staff)
      : ALL.slice(0, 2); // Bronze → Silver (top for regular users)

  const effectivePoints = role === 'admin'
    ? Math.max(points, 5000)
    : role === 'staff'
      ? Math.max(points, 1000)
      : points;

  const current = tiers.find(t => effectivePoints >= t.min && (t.max === null || effectivePoints <= t.max)) || tiers[tiers.length - 1];
  const next = tiers.find(t => t.min > (current?.min ?? 0));
  const pct = next ? Math.min(100, ((effectivePoints - current.min) / (next.min - current.min)) * 100) : 100;

  return (
    <div className="mt-5 pt-5 border-t border-sky-400/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-sky-200">{next ? `${next.min - points} pts to ${next.name}` : 'Top tier reached!'}</p>
        <p className="text-xs font-semibold text-sky-100">{current?.name}</p>
      </div>
      <div className="h-2 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const TIER_GRADIENT = {
  Bronze:   'from-amber-600 to-amber-800',
  Silver:   'from-slate-400 to-slate-600',
  Gold:     'from-yellow-400 to-amber-600',
  Platinum: 'from-violet-500 to-indigo-700',
};
const TIER_ICON = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

function LoyaltyCardDisplay({ card, userName }) {
  const expiry = card.expiresAt ? new Date(card.expiresAt) : null;
  const expiryStr = expiry
    ? `${String(expiry.getMonth() + 1).padStart(2, '0')}/${expiry.getFullYear().toString().slice(-2)}`
    : '';

  return (
    <div
      id="loyalty-card-print"
      style={{
        width: '340px', height: '213px',
        borderRadius: '16px',
        background: card.tier === 'Platinum'
          ? 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)'
          : card.tier === 'Gold'
            ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
            : card.tier === 'Silver'
              ? 'linear-gradient(135deg, #64748b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
        color: 'white',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
    >
      {/* Background pattern */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="KigaliTech" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: '3px' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '1px' }}>KIGALITECH</div>
            <div style={{ fontSize: '9px', opacity: 0.7, letterSpacing: '2px' }}>LOYALTY CARD</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', lineHeight: 1 }}>{TIER_ICON[card.tier]}</div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', opacity: 0.9, marginTop: '2px' }}>{card.tier.toUpperCase()}</div>
        </div>
      </div>

      {/* Card number */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '3px', opacity: 0.85 }}>
          {card.cardNumber}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '1.5px', marginBottom: '3px' }}>CARD HOLDER</div>
          <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px' }}>{(userName || 'Member').toUpperCase()}</div>
          <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '4px' }}>{card.points.toLocaleString()} points</div>
        </div>
        {expiryStr && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '1.5px', marginBottom: '3px' }}>VALID THRU</div>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{expiryStr}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin?callbackUrl=/account/loyalty');
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/loyalty/balance')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/loyalty/card')
      .then(r => r.json())
      .then(d => setCard(d.card || null))
      .catch(() => {})
      .finally(() => setCardLoading(false));
  }, [status]);

  async function requestCard() {
    setRequesting(true);
    try {
      const res = await fetch('/api/loyalty/card', { method: 'POST' });
      const d = await res.json();
      if (d.card) setCard(d.card);
    } catch {}
    setRequesting(false);
  }

  function printCard() {
    window.print();
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!session) return null;

  const points = data?.points ?? 0;
  const transactions = data?.transactions ?? [];
  const role = session?.user?.role;
  // Tier by role: admin=Platinum, staff=Gold, others capped at Silver
  const tier = role === 'admin' ? 'Platinum' : role === 'staff' ? 'Gold' : (points >= 500 ? 'Silver' : 'Bronze');

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-600 no-underline mb-4">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Account
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Loyalty Points</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Earn points on every purchase and redeem for discounts</p>
        </div>

        {/* Points Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-6 mb-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-100 uppercase tracking-widest">Your Balance</p>
              <p className="text-5xl font-extrabold mt-2 tabular-nums">{points.toLocaleString()}</p>
              <p className="text-sky-200 text-sm mt-1">points</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold">
                <span>{tier === 'Platinum' ? '💎' : tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : '🥉'}</span>
                {tier}
              </div>
              <p className="mt-2 text-xs text-sky-200 text-right">≈ {rwfValue(points)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-sky-400/30 flex items-center justify-between">
            <p className="text-sm text-sky-100">Redeemable value</p>
            <p className="text-lg font-extrabold">{rwfValue(points)}</p>
          </div>
          <TierProgress points={points} role={role} />
        </div>

        {/* Loyalty Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🪪</span> Loyalty Card
          </h2>

          {cardLoading ? (
            <div className="h-12 flex items-center text-slate-400 text-sm">Loading card status...</div>
          ) : card?.status === 'approved' ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Your card is active ✓</p>
              <div className="overflow-x-auto">
                <LoyaltyCardDisplay card={card} userName={session?.user?.name} />
              </div>
              <button onClick={printCard}
                className="flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Download / Print Card
              </button>
              <p className="text-xs text-slate-400">
                Card #{card.cardNumber} · {card.tier} · Expires {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : '—'}
              </p>
            </div>
          ) : card?.status === 'pending' ? (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Request pending review</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Our team will review and approve your loyalty card shortly. You&apos;ll be able to download it once approved.</p>
              <p className="text-xs text-amber-500 mt-2 font-mono">Card #: {card.cardNumber}</p>
            </div>
          ) : card?.status === 'rejected' ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-4">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Request not approved</p>
                {card.adminNotes && <p className="text-xs text-red-600 dark:text-red-500 mt-1">{card.adminNotes}</p>}
              </div>
              <button onClick={requestCard} disabled={requesting}
                className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition">
                {requesting ? 'Requesting...' : 'Request Again'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">Get a physical loyalty card showing your tier and membership details. Present it in-store or share digitally.</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <li>✓ Shows your name, tier &amp; card number</li>
                <li>✓ Valid for 1 year from approval</li>
                <li>✓ Download, print, or save as PDF</li>
              </ul>
              <button onClick={requestCard} disabled={requesting}
                className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition">
                {requesting ? 'Requesting...' : 'Request My Loyalty Card'}
              </button>
            </div>
          )}
        </div>

        {/* How to earn */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⭐</span> How to Earn Points
          </h2>
          <div className="space-y-3">
            {[
              { icon: '🛒', label: 'Purchase',        desc: 'Earn 1.5 points per RWF 1,475 spent on any order', pts: '1.5 pts / RWF 1,475' },
              { icon: '⭐', label: 'Write a Review',   desc: 'Leave a verified product review',               pts: '10 pts' },
              { icon: '👥', label: 'Refer a Friend',   desc: 'Your friend places their first order',           pts: '50 pts' },
              { icon: '🎂', label: 'Birthday Bonus',   desc: 'Points bonus on your birthday month',           pts: '100 pts' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-3 py-1 text-xs font-bold whitespace-nowrap">
                  {item.pts}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
            <strong>Redeem:</strong> 100 points = RWF 1,340 discount at checkout. Minimum redemption: 100 points.
          </p>
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="px-6">
            {transactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-3">🎯</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No transactions yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start shopping to earn your first points!</p>
                <Link href="/products"
                  className="mt-4 inline-block rounded-xl bg-sky-600 text-white text-sm font-bold px-5 py-2.5 no-underline hover:bg-sky-700 transition-colors">
                  Shop Now
                </Link>
              </div>
            ) : (
              transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
            )}
          </div>
        </div>

      </div>

      <style global jsx>{`
        @media print {
          body > * { display: none !important; }
          #loyalty-card-print {
            display: flex !important;
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 340px !important;
            height: 213px !important;
          }
        }
      `}</style>
    </Layout>
  );
}
