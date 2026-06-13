import { signIn, useSession, getProviders } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const GoogleIcon = () => (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* Exclusive-style input: bottom border only, no box */
const Field = ({ label, type = 'text', value, onChange, placeholder, required, autoComplete }) => (
  <div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder || label}
      required={required}
      autoComplete={autoComplete}
      className="w-full bg-transparent border-0 border-b border-gray-300 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-red-500 transition-colors"
    />
  </div>
);

export default function SignIn() {
  const { data: session } = useSession();
  const router = useRouter();
  const { callbackUrl, verified, magic, email: queryEmail, otp } = router.query;

  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [socialProviders, setSocialProviders] = useState([]);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    getProviders().then(p => {
      if (!p) return;
      setSocialProviders(['google', 'facebook'].filter(id => p[id]));
    });
  }, []);

  useEffect(() => {
    if (magic === 'ok' && queryEmail && otp) {
      setLoading('magic');
      signIn('credentials', { email: queryEmail, magicOtp: otp, redirect: false }).then(r => {
        if (r?.error) { setError('Magic link expired. Please request a new one.'); setLoading(''); }
        else { setShowSetPassword(true); setLoading(''); }
      });
    }
    if (magic === 'expired') setError('That magic link has expired. Please request a new one.');
    if (magic === 'invalid') setError('Invalid magic link. Please try again.');
  }, [magic, queryEmail, otp]);

  useEffect(() => {
    if (!session) return;
    if (session.user.mustChangePassword) { router.push('/set-password'); return; }
    const role = session.user.role;
    router.push(role === 'admin' || role === 'staff' ? (callbackUrl || '/admin') : (callbackUrl || '/'));
  }, [session]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading('login'); setError('');
    const id = form.email || form.phone;
    const r = await signIn('credentials', { email: id, password: form.password, redirect: false });
    if (r?.error) {
      if (r.error.startsWith('VERIFY:')) {
        const em = r.error.slice('VERIFY:'.length);
        fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em }) }).catch(() => {});
        router.push(`/verify-email?email=${encodeURIComponent(em)}`); return;
      }
      setError('Incorrect email/phone or password.'); setLoading('');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading('register'); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); setLoading(''); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); setLoading(''); return; }
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(''); return; }
    if (data.requiresVerification) {
      const ref = localStorage.getItem('referralCode');
      if (ref && data.email) {
        fetch('/api/referral/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: ref, newUserEmail: data.email }) }).catch(() => {});
        localStorage.removeItem('referralCode');
      }
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`); return;
    }
    await signIn('credentials', { email: form.email || form.phone, password: form.password, redirect: false });
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    const em = magicEmail.trim().toLowerCase();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { setError('Please enter a valid email'); return; }
    setLoading('magic-send'); setError('');
    const res = await fetch('/api/auth/send-magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em }) });
    setLoading('');
    if (res.ok) setMagicSent(true);
    else { const d = await res.json(); setError(d.error || 'Failed to send link'); }
  }

  async function handleGoogle() {
    setLoading('google'); setError('');
    await signIn('google', { callbackUrl: callbackUrl || '/' });
  }

  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function pwStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '' };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[a-z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 2) return { score: s, label: 'Weak',   color: 'bg-red-500' };
    if (s === 3) return { score: s, label: 'Fair',   color: 'bg-amber-500' };
    if (s === 4) return { score: s, label: 'Good',   color: 'bg-[#DB4444]' };
    return           { score: s, label: 'Strong', color: 'bg-emerald-500' };
  }
  const strength = pwStrength(form.password);

  const eyeIcon = (show) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {show
        ? <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
        : <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></>
      }
    </svg>
  );

  /* ── Set-password after magic link ── */
  if (showSetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="w-full max-w-sm bg-white rounded p-10 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Signed in!</h2>
          <p className="text-sm text-gray-500 mb-8">Set a password for faster login next time.</p>
          <div className="space-y-3">
            <button onClick={() => router.push('/set-password')}
              className="w-full bg-[#DB4444] hover:bg-[#c73e3e] text-white font-medium py-3 rounded text-sm transition-colors">
              Set a Password
            </button>
            <button onClick={() => router.replace(callbackUrl || '/')}
              className="w-full border border-gray-200 rounded py-3 text-sm text-gray-600 hover:border-[#DB4444] hover:text-[#DB4444] transition-colors">
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* ══════════════════════════════════════════════════════
          LEFT — Exclusive shopping image panel
      ══════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex items-center justify-center w-1/2 flex-shrink-0 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #FFF2E7 0%, #FFE0CC 50%, #FFDAB9 100%)' }}
      >
        {/* Large circle decoration (like Exclusive) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        h-[480px] w-[480px] rounded-full opacity-30 bg-white" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        h-[320px] w-[320px] rounded-full opacity-25 bg-white" />

        {/* Shopping cart illustration */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Large cart icon + floating product cards */}
          <div className="relative mb-6">
            {/* Main cart */}
            <div className="h-48 w-48 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
                {/* Cart body */}
                <rect x="40" y="80" width="120" height="80" rx="8" fill="#DB4444" opacity="0.15"/>
                <path d="M30 50 L50 50 L70 130 L150 130 L165 75 L60 75" stroke="#DB4444" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="80" cy="148" r="10" fill="#1D2026"/>
                <circle cx="140" cy="148" r="10" fill="#1D2026"/>
                {/* Items in cart */}
                <rect x="80" y="85" width="30" height="35" rx="4" fill="#DB4444" opacity="0.6"/>
                <rect x="118" y="88" width="28" height="32" rx="4" fill="#1D2026" opacity="0.4"/>
                {/* Stars */}
                <text x="95" y="175" textAnchor="middle" fontSize="16" fill="#FFAD33">★★★★★</text>
              </svg>
            </div>

            {/* Floating mini product cards */}
            <div className="absolute -top-4 -right-16 bg-white rounded-xl shadow-lg p-3 w-28 text-center transform rotate-6 hover:rotate-3 transition-transform">
              <div className="text-3xl mb-1">📱</div>
              <p className="text-xs font-semibold text-gray-700 truncate">Latest Phone</p>
              <p className="text-xs text-[#DB4444] font-bold">-25%</p>
            </div>
            <div className="absolute -bottom-4 -left-14 bg-white rounded-xl shadow-lg p-3 w-28 text-center transform -rotate-6 hover:-rotate-3 transition-transform">
              <div className="text-3xl mb-1">💻</div>
              <p className="text-xs font-semibold text-gray-700 truncate">Top Laptop</p>
              <p className="text-xs text-[#DB4444] font-bold">-15%</p>
            </div>
            <div className="absolute top-1/2 -right-20 bg-white rounded-xl shadow-lg p-3 w-24 text-center transform rotate-3">
              <div className="text-2xl mb-1">🎧</div>
              <p className="text-xs font-semibold text-gray-700">Audio</p>
              <p className="text-xs text-[#DB4444] font-bold">New</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-2xl font-bold text-gray-800 text-center px-8 leading-snug">
            Rwanda&apos;s Best<br/>Tech Store
          </h2>
          <p className="text-sm text-gray-500 mt-2 text-center px-12">
            100% genuine · Fast delivery · Full warranty
          </p>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-6">
            <span className="h-2.5 w-6 rounded-full bg-[#DB4444]" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT — Form panel (exact Exclusive layout)
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col justify-center flex-1 px-8 sm:px-14 lg:px-20 xl:px-28 py-14 bg-white overflow-y-auto">

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <img src="/logo.png" alt="KigaliTech" className="h-8 w-8 rounded-full object-cover" onError={e => e.target.style.display='none'} />
          <span className="text-lg font-bold text-gray-900">KigaliTech</span>
        </Link>

        <div className="max-w-[370px] w-full">

          {/* Heading */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            {mode === 'login' ? 'Log in to Exclusive' : 'Create an Account'}
          </h1>
          <p className="text-sm text-gray-500 mb-8">Enter your details below</p>

          {/* Alerts */}
          {verified && (
            <div className="mb-5 text-sm text-green-600 bg-green-50 border border-green-100 rounded px-4 py-2.5">
              ✓ Email verified! You can now sign in.
            </div>
          )}
          {error && (
            <div className="mb-5 text-sm text-red-500 bg-red-50 border border-red-100 rounded px-4 py-2.5">{error}</div>
          )}

          {/* ═══════════════════════════
              LOG IN FORM
          ═══════════════════════════ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-7">

              {/* Email / Phone */}
              <Field
                value={form.email || form.phone}
                onChange={e => {
                  const v = e.target.value;
                  const isPhone = v.startsWith('+') || /^[\d\s\-()]{3,}$/.test(v.replace(/^\+/, ''));
                  setForm(f => ({ ...f, email: isPhone ? '' : v.toLowerCase(), phone: isPhone ? v : '' }));
                }}
                placeholder="Email or Phone Number"
                required
              />

              {/* Password with show/hide */}
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={sf('password')}
                  placeholder="Password"
                  required
                  className="w-full bg-transparent border-0 border-b border-gray-300 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#DB4444] transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {eyeIcon(showPw)}
                </button>
              </div>

              {/* Log In + Forgot — same row, exact Exclusive layout */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <button
                  type="submit"
                  disabled={!!loading}
                  className="bg-[#DB4444] hover:bg-[#c73e3e] text-white font-medium px-10 py-3.5 rounded text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {loading === 'login' ? 'Signing in…' : 'Log In'}
                </button>
                <Link href="/forgot-password" className="text-sm text-[#DB4444] hover:underline whitespace-nowrap">
                  Forgot Password?
                </Link>
              </div>

              {/* Google */}
              {socialProviders.includes('google') && (
                <button type="button" onClick={handleGoogle} disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded py-3.5 text-sm font-medium text-gray-700 hover:border-[#DB4444] hover:text-[#DB4444] transition-colors disabled:opacity-60">
                  <GoogleIcon />
                  {loading === 'google' ? 'Connecting…' : 'Sign in with Google'}
                </button>
              )}

              {/* Magic link */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-400 mb-3">No password? Get a magic link instead</p>
                {magicSent ? (
                  <div className="rounded bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
                    📬 Magic link sent to <strong>{magicEmail}</strong>
                    <button type="button" onClick={() => { setMagicSent(false); setMagicEmail(''); }}
                      className="block mt-1 text-xs underline">Try different email</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value.toLowerCase())}
                      placeholder="your@email.com"
                      className="flex-1 bg-transparent border-0 border-b border-gray-300 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#DB4444] transition-colors" />
                    <button type="button" onClick={handleMagicLink} disabled={!!loading}
                      className="flex-shrink-0 px-4 py-2 border border-[#DB4444] text-[#DB4444] text-sm rounded hover:bg-[#DB4444] hover:text-white transition-colors disabled:opacity-60">
                      {loading === 'magic-send' ? '…' : 'Send'}
                    </button>
                  </div>
                )}
              </div>

              {/* Switch to register */}
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); form.password && setForm(f => ({ ...f, password: '', confirmPassword: '' })); }}
                  className="font-semibold text-gray-900 underline hover:text-[#DB4444] transition-colors">
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* ═══════════════════════════
              SIGN UP FORM
          ═══════════════════════════ */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-7">

              <Field value={form.name} onChange={sf('name')} placeholder="Name" required />

              <Field
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase() }))}
                placeholder="Email Address"
              />

              <Field type="tel" value={form.phone} onChange={sf('phone')} placeholder="Phone Number (+250 7XX XXX XXX)" />

              {/* Password with strength */}
              <div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={sf('password')}
                    placeholder="Password"
                    required
                    className="w-full bg-transparent border-0 border-b border-gray-300 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#DB4444] transition-colors pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {eyeIcon(showPw)}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={sf('confirmPassword')}
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-transparent border-0 border-b border-gray-300 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#DB4444] transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {eyeIcon(showConfirmPw)}
                </button>
              </div>

              <p className="text-xs text-gray-400 -mt-3">Provide email, phone, or both — at least one required.</p>

              {/* Create Account — full width */}
              <button type="submit" disabled={!!loading}
                className="w-full bg-[#DB4444] hover:bg-[#c73e3e] text-white font-medium py-3.5 rounded text-sm transition-colors disabled:opacity-60">
                {loading === 'register' ? 'Creating account…' : 'Create Account'}
              </button>

              {/* Google */}
              {socialProviders.includes('google') && (
                <button type="button" onClick={handleGoogle} disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded py-3.5 text-sm font-medium text-gray-700 hover:border-[#DB4444] hover:text-[#DB4444] transition-colors disabled:opacity-60">
                  <GoogleIcon />
                  {loading === 'google' ? 'Connecting…' : 'Sign up with Google'}
                </button>
              )}

              {/* Switch to login */}
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }}
                  className="font-semibold text-gray-900 underline hover:text-[#DB4444] transition-colors">
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
