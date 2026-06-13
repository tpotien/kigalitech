import { signIn, useSession, getProviders } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/* Google SVG icon */
const GoogleIcon = () => (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* Bottom-border-only input — the Exclusive style */
const inp = [
  'w-full bg-transparent border-0 border-b border-ex-border',
  'py-3 text-sm text-ex-text outline-none',
  'focus:border-primary focus:ring-0',
  'placeholder:text-ex-muted transition-colors',
].join(' ');

export default function SignIn() {
  const { data: session } = useSession();
  const router = useRouter();
  const { callbackUrl, verified, magic, email: queryEmail, otp } = router.query;

  /* mode: 'login' | 'register' */
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [socialProviders, setSocialProviders] = useState([]);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  useEffect(() => {
    getProviders().then(p => {
      if (!p) return;
      setSocialProviders(['google', 'facebook'].filter(id => p[id]));
    });
  }, []);

  /* Magic link auto-login */
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

  /* Redirect on session */
  useEffect(() => {
    if (!session) return;
    if (session.user.mustChangePassword) { router.push('/set-password'); return; }
    const role = session.user.role;
    router.push(role === 'admin' || role === 'staff' ? (callbackUrl || '/admin') : (callbackUrl || '/'));
  }, [session]);

  /* Handlers */
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
      if (ref && data.email) { fetch('/api/referral/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: ref, newUserEmail: data.email }) }).catch(() => {}); localStorage.removeItem('referralCode'); }
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

  const setField = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

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
    if (s === 4) return { score: s, label: 'Good',   color: 'bg-primary' };
    return           { score: s, label: 'Strong', color: 'bg-emerald-500' };
  }
  const strength = pwStrength(form.password);

  /* ── Set-password screen after magic link ── */
  if (showSetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ex-gray px-4">
        <div className="w-full max-w-sm bg-white rounded p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-ex-text mb-2">Signed in!</h2>
          <p className="text-sm text-ex-muted mb-8">Set a password for faster login next time.</p>
          <div className="space-y-3">
            <button onClick={() => router.push('/set-password')} className="btn-primary w-full">Set a Password</button>
            <button onClick={() => router.replace(callbackUrl || '/')}
              className="w-full border border-ex-border rounded py-3 text-sm text-ex-text hover:border-primary hover:text-primary transition-colors">
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main page ── */
  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* ════════════════════════════════════════
          LEFT — shopping image panel
      ════════════════════════════════════════ */}
      <div className="hidden lg:block w-1/2 flex-shrink-0 relative overflow-hidden" style={{ background: '#CBE4E8' }}>
        {/* Decorative large circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[520px] w-[520px] rounded-full opacity-20" style={{ background: '#1D2026' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[380px] w-[380px] rounded-full opacity-20" style={{ background: '#1D2026' }} />
        </div>

        {/* Product showcase */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-12 text-center">
          {/* Shopping cart icon + products */}
          <div className="mb-8 relative">
            <div className="flex items-end justify-center gap-4">
              <div className="h-28 w-28 bg-white rounded-2xl shadow-xl flex items-center justify-center text-6xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                📱
              </div>
              <div className="h-36 w-36 bg-white rounded-2xl shadow-xl flex items-center justify-center text-7xl z-10">
                💻
              </div>
              <div className="h-28 w-28 bg-white rounded-2xl shadow-xl flex items-center justify-center text-6xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
                🎧
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-ex-text mb-2">Best Tech Deals in Rwanda</h2>
          <p className="text-ex-muted text-sm max-w-xs leading-relaxed">
            100% genuine electronics · Fast delivery · Full warranty
          </p>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-8">
            <span className="h-2.5 w-6 rounded-full bg-primary" />
            <span className="h-2.5 w-2.5 rounded-full bg-ex-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-ex-border" />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — form panel
      ════════════════════════════════════════ */}
      <div className="flex flex-col justify-center flex-1 px-8 sm:px-16 lg:px-20 xl:px-28 py-16 bg-white">

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <img src="/logo.png" alt="KigaliTech" className="h-8 w-8 rounded-full object-cover" onError={e => e.target.style.display='none'} />
          <span className="text-lg font-bold text-ex-text">KigaliTech</span>
        </Link>

        {/* ── Heading ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-ex-text mb-2">
            {mode === 'login' ? 'Log in to Exclusive' : 'Create an Account'}
          </h1>
          <p className="text-sm text-ex-muted">Enter your details below</p>
        </div>

        {/* ── Alerts ── */}
        {verified && (
          <div className="mb-6 rounded bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
            ✓ Email verified! You can now sign in.
          </div>
        )}
        {error && (
          <div className="mb-6 rounded bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* ════════════════════════════════════════
            LOGIN FORM
        ════════════════════════════════════════ */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6 max-w-sm">
            {/* Email / Phone */}
            <input
              required
              value={form.email || form.phone}
              onChange={e => {
                const v = e.target.value;
                const isPhone = v.startsWith('+') || /^[\d\s\-()]{3,}$/.test(v.replace(/^\+/, ''));
                setForm(f => ({ ...f, email: isPhone ? '' : v.toLowerCase(), phone: isPhone ? v : '' }));
              }}
              placeholder="Email or Phone"
              className={inp}
            />

            {/* Password */}
            <input
              required
              type="password"
              value={form.password}
              onChange={setField('password')}
              placeholder="Password"
              className={inp}
            />

            {/* Log In + Forgot Password — same row (Exclusive layout) */}
            <div className="flex items-center gap-6 pt-1">
              <button
                type="submit"
                disabled={!!loading}
                className="btn-primary disabled:opacity-60 flex-shrink-0"
              >
                {loading === 'login' ? 'Signing in…' : 'Log In'}
              </button>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline whitespace-nowrap">
                Forgot Password?
              </Link>
            </div>

            {/* Google */}
            {socialProviders.includes('google') && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-ex-border" />
                  <span className="text-xs text-ex-muted">or</span>
                  <div className="flex-1 border-t border-ex-border" />
                </div>
                <button type="button" onClick={handleGoogle} disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 border border-ex-border rounded py-3 text-sm font-medium text-ex-text hover:border-primary transition-colors disabled:opacity-60">
                  <GoogleIcon />
                  {loading === 'google' ? 'Connecting…' : 'Sign in with Google'}
                </button>
              </>
            )}

            {/* Magic link */}
            <div className="border-t border-ex-border pt-4">
              <p className="text-xs text-ex-muted mb-3">Prefer a magic link? (no password needed)</p>
              {magicSent ? (
                <div className="rounded bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
                  📬 Check your inbox — magic link sent to <strong>{magicEmail}</strong>
                  <button type="button" onClick={() => { setMagicSent(false); setMagicEmail(''); }}
                    className="block mt-1 text-xs underline">Use different email</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value.toLowerCase())}
                    placeholder="your@email.com" className={`${inp} flex-1`} />
                  <button type="button" onClick={handleMagicLink} disabled={!!loading}
                    className="flex-shrink-0 px-4 py-2 border border-primary text-primary text-sm rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-60">
                    {loading === 'magic-send' ? '…' : 'Send'}
                  </button>
                </div>
              )}
            </div>

            {/* Switch to register */}
            <p className="text-sm text-ex-muted">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => { setMode('register'); setError(''); }}
                className="text-ex-text font-semibold underline hover:text-primary transition-colors">
                Sign Up
              </button>
            </p>
          </form>
        )}

        {/* ════════════════════════════════════════
            SIGN UP FORM
        ════════════════════════════════════════ */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-6 max-w-sm">
            {/* Name */}
            <input
              required
              value={form.name}
              onChange={setField('name')}
              placeholder="Name"
              className={inp}
            />

            {/* Email */}
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase() }))}
              placeholder="Email Address"
              className={inp}
            />

            {/* Phone */}
            <input
              type="tel"
              value={form.phone}
              onChange={setField('phone')}
              placeholder="Phone Number (+250 7XX XXX XXX)"
              className={inp}
            />

            {/* Password */}
            <div>
              <input
                required
                type="password"
                value={form.password}
                onChange={setField('password')}
                placeholder="Password"
                className={inp}
              />
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-ex-border'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-ex-muted">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={setField('confirmPassword')}
              placeholder="Confirm Password"
              className={inp}
            />

            <p className="text-xs text-ex-muted -mt-2">Provide email, phone number, or both — at least one required.</p>

            {/* Create Account button — full width */}
            <button type="submit" disabled={!!loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading === 'register' ? 'Creating account…' : 'Create Account'}
            </button>

            {/* Google */}
            {socialProviders.includes('google') && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-ex-border" />
                  <span className="text-xs text-ex-muted">or</span>
                  <div className="flex-1 border-t border-ex-border" />
                </div>
                <button type="button" onClick={handleGoogle} disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 border border-ex-border rounded py-3 text-sm font-medium text-ex-text hover:border-primary transition-colors disabled:opacity-60">
                  <GoogleIcon />
                  {loading === 'google' ? 'Connecting…' : 'Sign up with Google'}
                </button>
              </>
            )}

            {/* Switch to login */}
            <p className="text-sm text-ex-muted">
              Already have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); }}
                className="text-ex-text font-semibold underline hover:text-primary transition-colors">
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
