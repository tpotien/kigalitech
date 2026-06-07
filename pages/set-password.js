import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function SetPassword() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin');
  }, [status]);

  function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }

  const str = strength(password);
  const strColor = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-600'][str];
  const strLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][str];

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Refresh session so mustChangePassword clears
        await update({ mustChangePassword: false });
        router.replace('/account');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">

            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 text-center">Set New Password</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-7">
              {session?.user?.mustChangePassword
                ? 'You signed in with a temporary password. Set your permanent password now.'
                : 'Choose a new password for your account.'}
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
                  />
                  <button type="button" onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strColor}`} style={{ width: `${(str / 4) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{strLabel}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full rounded-xl border px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 transition-colors ${
                    confirm && confirm !== password
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:border-sky-400'
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {loading ? 'Saving…' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
