import { useState, useEffect } from 'react';

const SITE_URL = 'https://kigalitechservices.com';

export default function ReferralCard() {
  const [code, setCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referral/my-code')
      .then(r => r.json())
      .then(data => {
        if (data.code) setCode(data.code);
        if (Array.isArray(data.referrals)) setReferrals(data.referrals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shareLink = `${SITE_URL}/?ref=${code}`;
  const whatsappText = encodeURIComponent(
    `Join KigaliTech and get 10% off! Use my referral: ${code} — ${shareLink}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const completed = referrals.filter(r => r.status === 'completed').length;
  const pending = referrals.filter(r => r.status === 'pending').length;
  const earnings = completed * 2000; // 2000 pts per referral

  return (
    <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 border border-sky-200 dark:border-sky-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white text-lg">
          🎁
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Referral Program</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Invite friends, earn 100 loyalty points per referral</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Referral code box */}
          <div className="mb-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-700 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <span className="flex-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-widest">
                {code || '—'}
              </span>
              <button
                onClick={copyCode}
                disabled={!code}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40 transition-all"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400 break-all">{shareLink}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{referrals.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Invited</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">{completed}</p>
              <p className="text-xs text-slate-400 mt-0.5">Completed</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-indigo-600">{earnings.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">Pts Earned</p>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { navigator.clipboard.writeText(shareLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              disabled={!code}
              className="flex-1 rounded-full border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/40 disabled:opacity-40 transition-all"
            >
              {copied ? '✓ Link Copied!' : 'Copy Share Link'}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20bf5b] transition-all ${!code ? 'pointer-events-none opacity-40' : ''}`}
            >
              <svg viewBox="0 0 32 32" className="h-4 w-4 fill-white flex-shrink-0">
                <path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2zm7.414 19.878c-.316.886-1.564 1.622-2.56 1.836-.68.144-1.568.258-4.552-1.004C12.624 21.162 9.98 17.6 9.778 17.338c-.198-.26-1.664-2.21-1.664-4.222 0-2.012 1.048-2.992 1.42-3.402.37-.412.808-.514 1.078-.514.27 0 .542.002.78.014.248.012.584-.096.914.696l1.31 3.184c.13.314.216.682.04 1.098-.174.414-.26.67-.522.99-.258.32-.546.716-.778.962-.258.272-.526.566-.228 1.11.3.544 1.33 2.192 2.858 3.55 1.964 1.75 3.62 2.29 4.13 2.548.512.258.81.216 1.108-.13.298-.344 1.276-1.492 1.616-2.006.34-.512.68-.43 1.146-.258.466.174 2.974 1.4 3.484 1.656.51.258.85.386.974.6.126.214.126 1.104-.19 1.99z"/>
              </svg>
              Share via WhatsApp
            </a>
          </div>

          {/* How it works */}
          <div className="mt-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-sky-100 dark:border-sky-900 px-4 py-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">How it works</p>
            <ol className="space-y-0.5 text-xs text-slate-500 dark:text-slate-400 list-decimal list-inside">
              <li>Share your code or link with friends</li>
              <li>They register using your referral link</li>
              <li>When they place their first order, you earn 100 loyalty points — the highest reward</li>
            </ol>
          </div>

          {/* Pending referrals */}
          {pending > 0 && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
              {pending} pending referral{pending > 1 ? 's' : ''} — points awarded after their first order
            </p>
          )}
        </>
      )}
    </div>
  );
}
