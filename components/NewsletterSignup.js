import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [code, setCode] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      } else {
        setCode(data.code || '');
        setStatus('success');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 py-16 px-4">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/20 ring-2 ring-sky-400/40">
            <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white">You&rsquo;re in!</h2>
          <p className="mt-2 text-sky-200">Check your email for your discount code!</p>
          {code && (
            <div className="mt-6 rounded-2xl bg-white/10 px-6 py-5 ring-1 ring-white/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-2">Your 10% off code</p>
              <p className="font-mono text-2xl font-extrabold tracking-widest text-white">{code}</p>
              <p className="mt-1 text-xs text-slate-400">One use · No minimum order</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 py-16 px-4">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-2">Exclusive offer</p>
        <h2 className="text-3xl font-extrabold text-white leading-tight">
          Get 10% off your first order
        </h2>
        <p className="mt-3 text-base text-sky-200/80">
          Join thousands of KigaliTech subscribers and get an instant discount code delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-sky-300/60 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition-all"
          />
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-sky-300/60 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition-all"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex-shrink-0 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 px-6 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-sky-900/40 active:scale-95"
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Joining…
                </span>
              ) : 'Subscribe'}
            </button>
          </div>

          {status === 'error' && (
            <p className="text-sm font-medium text-red-400">{errorMsg}</p>
          )}
        </form>

        <p className="mt-4 text-xs text-sky-400/60">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
