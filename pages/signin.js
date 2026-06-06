import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function SignIn() {
  const { data: session } = useSession();
  const router = useRouter();
  const { callbackUrl } = router.query;
  const { t } = useLang();
  const [mode, setMode] = useState('login'); // login | register
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  useEffect(() => {
    if (!session) return;
    const role = session.user.role;
    if (role === 'admin' || role === 'staff') router.push(callbackUrl || '/admin');
    else router.push(callbackUrl || '/');
  }, [session]);

  async function handleSocial(provider) {
    setLoading(provider);
    await signIn(provider, { callbackUrl: callbackUrl || '/' });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading('login');
    setError('');
    const identifier = form.email || form.phone;
    const result = await signIn('credentials', { email: identifier, password: form.password, redirect: false });
    if (result?.error) {
      setError('Invalid credentials. Please check your email/phone and password.');
      setLoading('');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading('register');
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading('');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
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
    // Auto sign in after register
    const identifier = form.email || form.phone;
    await signIn('credentials', { email: identifier, password: form.password, redirect: false });
  }

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 mb-4 shadow-lg shadow-sky-900/50">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white">KigaliTech</h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'login' ? t('signIn') : t('createAccount')}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">{success}</div>
          )}

          {/* Mode tabs */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t('signIn')}
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${mode === 'register' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t('createAccount')}
            </button>
          </div>

          {/* Social login */}
          <div className="space-y-3 mb-5">
            <button
              onClick={() => handleSocial('google')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading === 'google' ? t('loading') : 'Google'}
            </button>
            <button
              onClick={() => handleSocial('github')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              {loading === 'github' ? t('loading') : 'GitHub'}
            </button>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">{t('orContinueWith')}</span></div>
          </div>

          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('email')} / {t('phone')}</label>
                <input
                  required
                  value={form.email || form.phone}
                  onChange={e => {
                    const val = e.target.value;
                    const isPhone = val.startsWith('+') || /^[\d\s\-()]{3,}$/.test(val.replace(/^\+/, ''));
                    setForm({ ...form, email: isPhone ? '' : val, phone: isPhone ? val : '' });
                  }}
                  placeholder="+250 7XX XXX XXX or email@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
              </div>
              <button
                type="submit"
                disabled={!!loading}
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-sky-200"
              >
                {loading === 'login' ? t('loading') : t('signIn')}
              </button>
            </form>
          )}

          {/* Register form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('name')} *</label>
                <input
                  required
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('email')} (or use phone below)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('phone')} (any country)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={setField('phone')}
                  placeholder="+250 7XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Password *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Confirm Password *</label>
                <input
                  required
                  type="password"
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <p className="text-xs text-slate-400">Enter email, phone number, or both. At least one is required.</p>
              <button
                type="submit"
                disabled={!!loading}
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-all shadow-lg shadow-sky-200"
              >
                {loading === 'register' ? t('loading') : t('createAccount')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
