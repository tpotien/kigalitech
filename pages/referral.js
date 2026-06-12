import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kigalitechservices.com';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-600 text-white hover:bg-sky-700'}`}>
      {copied ? '✓ Copied!' : 'Copy Link'}
    </button>
  );
}

export default function ReferralPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/referral/my-code')
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const referralLink = data?.code ? `${SITE_URL}/?ref=${data.code}` : '';
  const pending = data?.referrals?.filter(r => r.status === 'pending').length || 0;
  const completed = data?.referrals?.filter(r => r.status === 'rewarded').length || 0;

  function share(platform) {
    const msg = `Shop Rwanda's #1 electronics store — KigaliTech! Use my link to get the best deals: ${referralLink}`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    };
    window.open(urls[platform], '_blank');
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-700 p-8 text-white text-center mb-8">
          <div className="text-5xl mb-3">🎁</div>
          <h1 className="text-2xl font-extrabold mb-2">Invite Friends, Earn Rewards</h1>
          <p className="text-sky-100 text-sm">Share your referral link. When a friend signs up and orders, you both earn loyalty points.</p>
        </div>

        {!session ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sign in to get your referral link</p>
            <Link href="/signin" className="inline-block rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white hover:bg-sky-700 no-underline transition">Sign In</Link>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-slate-400">Loading…</div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Referred', value: data?.referrals?.length || 0, icon: '👥' },
                { label: 'Pending', value: pending, icon: '⏳' },
                { label: 'Rewarded', value: completed, icon: '🏆' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Referral link */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Your Referral Link</p>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
                <p className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{referralLink}</p>
                <CopyButton text={referralLink} />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">Your code: <span className="font-bold text-sky-600">{data?.code}</span></p>
            </div>

            {/* Share buttons */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Share Via</p>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => share('whatsapp')}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:border-[#25D366] hover:bg-[#f0fdf4] transition">
                  <span className="text-2xl">💬</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">WhatsApp</span>
                </button>
                <button onClick={() => share('twitter')}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:border-sky-400 hover:bg-sky-50 transition">
                  <span className="text-2xl">𝕏</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Twitter / X</span>
                </button>
                <button onClick={() => share('facebook')}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:border-blue-400 hover:bg-blue-50 transition">
                  <span className="text-2xl">📘</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Facebook</span>
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">How It Works</p>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Share your link', desc: 'Send your unique referral link to friends and family.' },
                  { step: '2', title: 'They sign up', desc: 'Your friend creates a KigaliTech account using your link.' },
                  { step: '3', title: 'They place an order', desc: 'When they complete their first purchase, the referral activates.' },
                  { step: '4', title: 'Both earn points', desc: 'You earn 100 loyalty points and your friend gets a welcome bonus.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-4 items-start">
                    <div className="h-8 w-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sm font-extrabold text-sky-600 flex-shrink-0">{s.step}</div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral history */}
            {data?.referrals?.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Referral History</p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.referrals.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.referredEmail}</p>
                        <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        r.status === 'rewarded' ? 'bg-emerald-100 text-emerald-700'
                        : r.status === 'pending' ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                      }`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </Layout>
  );
}
