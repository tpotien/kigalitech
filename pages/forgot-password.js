import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">

            {/* Icon */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/40">
              <svg className="h-7 w-7 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>

            {sent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  If <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> matches an account, we sent a temporary password. Check your inbox and spam folder.
                </p>
                <Link href="/signin" className="inline-block w-full rounded-full bg-sky-600 py-3 text-sm font-semibold text-white text-center hover:bg-sky-700 no-underline">
                  Go to Sign In
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 text-center">Forgot Password?</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-7">
                  Enter the email you signed up with and we'll send you a temporary password.
                </p>

                {error && (
                  <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Sending…' : 'Send Temporary Password'}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                  Remember it?{' '}
                  <Link href="/signin" className="font-semibold text-sky-600 hover:text-sky-700 no-underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
