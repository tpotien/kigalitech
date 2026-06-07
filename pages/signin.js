import { signIn, useSession, getProviders } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SOCIAL = {
  google: {
    label: 'Google',
    bg: 'bg-white hover:bg-slate-50 border border-slate-200',
    text: 'text-slate-700',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    bg: 'bg-[#1877F2] hover:bg-[#166fe5] border border-[#1877F2]',
    text: 'text-white',
    icon: (
      <svg className="h-5 w-5" fill="white" viewBox="0 0 24 24">
        <path d="M24 12.073C24 5.41 18.627 0 12 0S0 5.41 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
  apple: {
    label: 'Apple',
    bg: 'bg-black hover:bg-slate-900 border border-black',
    text: 'text-white',
    icon: (
      <svg className="h-5 w-5" fill="white" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
};

export default function SignIn() {
  const { data: session } = useSession();
  const router = useRouter();
  const { callbackUrl, verified, magic, email: queryEmail, otp } = router.query;
  const { t } = useLang();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [socialProviders, setSocialProviders] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  useEffect(() => {
    getProviders().then(p => {
      if (!p) return;
      const order = ['google', 'facebook', 'apple'];
      setSocialProviders(order.filter(id => p[id]));
    });
  }, []);

  // Auto-login after magic link click
  useEffect(() => {
    if (magic === 'ok' && queryEmail && otp) {
      setLoading('magic');
      signIn('credentials', { email: queryEmail, magicOtp: otp, redirect: false }).then(result => {
        if (result?.error) setError('Magic link failed. Please try again.');
        setLoading('');
      });
    }
    if (magic === 'expired') setError('That magic link has expired. Please request a new one.');
    if (magic === 'invalid') setError('Invalid magic link. Please try again.');
  }, [magic, queryEmail, otp]);

  useEffect(() => {
    if (!session) return;
    if (session.user.mustChangePassword) { router.push('/set-password'); return; }
    const role = session.user.role;
    if (role === 'admin' || role === 'staff') router.push(callbackUrl || '/admin');
    else router.push(callbackUrl || '/');
  }, [session]);

  async function handleMagicLink(e) {
    e.preventDefault();
    const emailVal = magicEmail.trim().toLowerCase();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading('magic-send');
    setError('');
    const res = await fetch('/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailVal }),
    });
    setLoading('');
    if (res.ok) {
      setMagicSent(true);
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to send link');
    }
  }

  async function handleSocial(provider) {
    setLoading(provider);
    setError('');
    await signIn(provider, { callbackUrl: callbackUrl || '/' });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading('login');
    setError('');
    if (form.email && !isValidEmail(form.email)) {
      setError('Please enter a valid email address');
      setLoading('');
      return;
    }
    const identifier = form.email || form.phone;
    const result = await signIn('credentials', { email: identifier, password: form.password, redirect: false });
    if (result?.error) {
      if (result.error.startsWith('VERIFY:')) {
        const unverifiedEmail = result.error.slice('VERIFY:'.length);
        fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: unverifiedEmail }),
        }).catch(() => {});
        router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
        return;
      }
      setError('Invalid credentials. Please check your email/phone and password.');
      setLoading('');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading('register');
    setError('');
    if (form.email && !isValidEmail(form.email)) {
      setError('Please enter a valid email address');
      setLoading('');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading('');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading('');
      return;
    }
    const str = passwordStrength(form.password);
    if (str.score < 3) {
      setError('Password is too weak — add uppercase letters, numbers, or symbols');
      setLoading('');
      return;
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Registration failed');
      setLoading('');
      return;
    }
    if (data.requiresVerification) {
      const refCode = localStorage.getItem('referralCode');
      if (refCode && data.email) {
        fetch('/api/referral/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: refCode, newUserEmail: data.email }) }).catch(() => {});
        localStorage.removeItem('referralCode');
      }
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      return;
    }
    const refCode = localStorage.getItem('referralCode');
    if (refCode && (form.email || form.phone)) {
      fetch('/api/referral/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: refCode, newUserEmail: form.email || form.phone }) }).catch(() => {});
      localStorage.removeItem('referralCode');
    }
    await signIn('credentials', { email: form.phone, password: form.password, redirect: false });
  }

  const setField = (k) => (e) => setForm({ ...form, [k]: k === 'email' ? e.target.value.toLowerCase() : e.target.value });

  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email); }

  function passwordStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 3) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score === 4) return { score, label: 'Good', color: 'bg-sky-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  }
  const strength = mode === 'register' ? passwordStrength(form.password) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Language + Back */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-slate-400 hover:text-sky-300 text-sm flex items-center gap-1.5 no-underline transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to store
          </Link>
          <LanguageSwitcher compact />
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="KigaliTech" className="h-20 w-20 rounded-full object-cover border-2 border-orange-400/40 shadow-xl mb-4" />
          <h1 className="text-2xl font-extrabold text-white">KigaliTech</h1>
          <p className="text-slate-400 text-sm mt-1">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl">
          {verified && (
            <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Email verified! You can now sign in.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700">{success}</div>
          )}

          {/* ── Magic Link — fastest option ── */}
          {magic === 'ok' && loading === 'magic' ? (
            <div className="mb-5 rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-5 py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sky-700 dark:text-sky-300 font-semibold text-sm">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Signing you in…
              </div>
            </div>
          ) : magicSent ? (
            <div className="mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-5 text-center">
              <div className="text-3xl mb-2">📬</div>
              <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Check your inbox!</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">We sent a sign-in link to <strong>{magicEmail}</strong></p>
              <p className="text-emerald-500 text-xs mt-1">Click the link in the email — you'll be logged in instantly.</p>
              <button onClick={() => { setMagicSent(false); setMagicEmail(''); }} className="mt-3 text-xs text-emerald-600 underline">Use a different email</button>
            </div>
          ) : (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center uppercase tracking-wide">Fastest — no password needed</p>
              <form onSubmit={handleMagicLink} className="flex gap-2">
                <input
                  type="email"
                  value={magicEmail}
                  onChange={e => setMagicEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800"
                />
                <button
                  type="submit"
                  disabled={!!loading}
                  className="flex-shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-sky-200 whitespace-nowrap"
                >
                  {loading === 'magic-send' ? '…' : '✨ Send Link'}
                </button>
              </form>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">We'll email you a magic sign-in link · Works for new &amp; existing accounts</p>
            </div>
          )}

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
            <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">or use email &amp; password</span></div>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-5">
            <button onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              Sign In
            </button>
            <button onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${mode === 'register' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              Create Account
            </button>
          </div>

          {/* Social login buttons — shown on BOTH tabs when providers are configured */}
          {socialProviders.length > 0 && (
            <>
              <div className="space-y-2.5 mb-5">
                {socialProviders.map(id => {
                  const p = SOCIAL[id];
                  return (
                    <button
                      key={id}
                      onClick={() => handleSocial(id)}
                      disabled={!!loading}
                      className={`w-full flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-all ${p.bg} ${p.text}`}
                    >
                      {p.icon}
                      {loading === id
                        ? 'Connecting…'
                        : mode === 'login'
                          ? `Continue with ${p.label}`
                          : `Sign up with ${p.label}`}
                    </button>
                  );
                })}
              </div>
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">or continue with email</span></div>
              </div>
            </>
          )}

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3" autoComplete="on">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email / Phone</label>
                <input
                  required
                  value={form.email || form.phone}
                  onChange={e => {
                    const val = e.target.value;
                    const isPhone = val.startsWith('+') || /^[\d\s\-()]{3,}$/.test(val.replace(/^\+/, ''));
                    setForm({ ...form, email: isPhone ? '' : val.toLowerCase(), phone: isPhone ? val : '' });
                  }}
                  placeholder="+250 7XX XXX XXX or email@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800 focus:border-sky-400"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-500">Password</label>
                  <Link href="/forgot-password" className="text-xs font-medium text-sky-600 hover:text-sky-700 no-underline">Forgot password?</Link>
                </div>
                <input required type="password" autoComplete="current-password" value={form.password} onChange={setField('password')} placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800 focus:border-sky-400" />
              </div>
              <button type="submit" disabled={!!loading}
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-sky-200">
                {loading === 'login' ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name *</label>
                <input required value={form.name} onChange={setField('name')} placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email (or use phone below)</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value.toLowerCase() })} placeholder="email@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone (any country)</label>
                <input type="tel" value={form.phone} onChange={setField('phone')} placeholder="+250 7XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Password *</label>
                <input required type="password" value={form.password} onChange={setField('password')} placeholder="Min 8 chars · Uppercase · Number · Symbol"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800" />
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold ${strength.score <= 2 ? 'text-red-500' : strength.score === 3 ? 'text-amber-500' : strength.score === 4 ? 'text-sky-600' : 'text-emerald-600'}`}>{strength.label}</p>
                      <p className="text-[10px] text-slate-400">Use A–Z · 0–9 · !@#$ for Strong</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Confirm Password *</label>
                <input required type="password" value={form.confirmPassword} onChange={setField('confirmPassword')} placeholder="Repeat password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800" />
              </div>
              <p className="text-xs text-slate-400">Enter email, phone, or both — at least one required.</p>
              <button type="submit" disabled={!!loading}
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-all shadow-lg shadow-sky-200">
                {loading === 'register' ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
