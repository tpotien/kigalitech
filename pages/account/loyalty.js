import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Link from 'next/link';

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

export default function LoyaltyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [status]);

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
  const dollarsValue = (points / 100).toFixed(2);

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
              <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold">
                <span>🏆</span>
                {points >= 1000 ? 'Gold' : points >= 500 ? 'Silver' : 'Bronze'}
              </div>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-sky-400/30 flex items-center justify-between">
            <p className="text-sm text-sky-100">Redeemable value</p>
            <p className="text-lg font-extrabold">${dollarsValue}</p>
          </div>
        </div>

        {/* How to earn */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⭐</span> How to Earn Points
          </h2>
          <div className="space-y-3">
            {[
              { icon: '🛒', label: 'Purchase', desc: 'Earn 1 point per $1 spent on any order', pts: '1 pt / $1' },
              { icon: '⭐', label: 'Write a Review', desc: 'Leave a verified product review', pts: '10 pts' },
              { icon: '👥', label: 'Refer a Friend', desc: 'Your friend places their first order', pts: '50 pts' },
              { icon: '🎂', label: 'Birthday Bonus', desc: 'Points bonus on your birthday month', pts: '100 pts' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-3 py-1 text-xs font-bold">
                  {item.pts}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
            <strong>Redeem:</strong> 100 points = $1.00 discount at checkout. Minimum redemption: 100 points.
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
    </Layout>
  );
}
