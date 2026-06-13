import { signIn, useSession, getProviders } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    getProviders().then(p => {
      if (!p) return;
      setSocialProviders(['google', 'facebook'].filter(id => p[id]));
    });
  }, []);

  useEffect(() => {
    if (magic === 'ok' && queryEmail && otp) {
      setLoading('magic');
      signIn('credentials', { email: queryEmail, magicOtp: otp, redirect: false }).then(result => {
        if (result?.error) { setError('Magic link failed or expired. Please request a new one.'); setLoading(''); }
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

  async function handleMagicLink(e) {
    e.preventDefault();
    const emailVal = magicEmail.trim().toLowerCase();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) { setError('Please enter a valid email address'); return; }
    setLoading('magic-send'); setError('');
    const res = await fetch('/api/auth/send-magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailVal }) });
    setLoading('');
    if (res.ok) setMagicSent(true);
    else { const d = await res.json(); setError(d.error || 'Failed to send link'); }
  }

  async function handleSocial(provider) {
    setLoading(provider); setError('');
    await signIn(provider, { callbackUrl: callbackUrl || '/' });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading('login'); setError('');
    const identifier = form.email || form.phone;
    const result = await signIn('credentials', { email: identifier, password: form.password, redirect: false });
    if (result?.error) {
      if (result.error.startsWith('VERIFY:')) {
        const unverifiedEmail = result.error.slice('VERIFY:'.length);
        fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: unverifiedEmail }) }).catch(() => {});
        router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
        return;
      }
      setError('Invalid email/phone or password. Please try again.');
      setLoading('');
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
      const refCode = localStorage.getItem('referralCode');
      if (refCode && data.email) { fetch('/api/referral/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: refCode, newUserEmail: data.email }) }).catch(() => {}); localStorage.removeItem('referralCode'); }
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      return;
    }
    await signIn('credentials', { email: form.email || form.phone, password: form.password, redirect: false });
  }

  const setField = k => e => setForm({ ...form, [k]: e.target.value });

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
    if (score === 4) return { score, label: 'Good', color: 'bg-primary' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  }
  const strength = mode === 'register' ? passwordStrength(form.password) : null;

  const inp = 'w-full border border-ex-border rounded px-4 py-3 text-sm text-ex-text outline-none focus:border-primary placeholder:text-ex-muted';

  /* Set password after magic link */
  if (showSetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ex-gray px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-ex-text mb-2">Signed in successfully!</h2>
          <p className="text-sm text-ex-muted mb-6">Set a password for faster login next time.</p>
          <div className="space-y-3">
            <button onClick={() => router.push('/set-password')} className="btn-primary w-full">Set a Password</button>
            <button onClick={() => router.replace(callbackUrl || '/')} className="w-full border border-ex-border rounded py-2.5 text-sm text-ex-text hover:border-primary hover:text-primary transition-colors">Skip for now</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Brand panel (Exclusive style) ── */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{ background: '#1D2026' }}>
        {/* Decorative circles */}
        <div className="absolute bottom-32 right-32 h-[320px] w-[320px] rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-44 right-44 h-[220px] w-[220px] rounded-full opacity-10 bg-white" />

        <div className="relative z-10 text-center px-12 max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-10">
            <img src="/logo.png" alt="KigaliTech" className="h-12 w-12 rounded-full object-cover" onError={e=>e.target.style.display='none'} />
            <span className="text-2xl font-bold text-white tracking-tight">KigaliTech</span>
          </Link>

          <div className="mb-10">
            <div className="h-56 w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">🛍️</div>
                <div className="flex gap-3 justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="h-2 w-2 rounded-full bg-gray-600" />
                  <div className="h-2 w-2 rounded-full bg-gray-600" />
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-semibold text-white mb-3 leading-snug">Shop the Latest<br/>Electronics in Rwanda</h2>
          <p className="text-gray-400 text-sm">100% genuine products · Fast delivery · Full warranty support</p>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex flex-col justify-center w-full lg:w-[480px] flex-shrink-0 px-8 sm:px-14 py-12 bg-white">

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <img src="/logo.png" alt="KigaliTech" className="h-8 w-8 rounded-full" onError={e=>e.target.style.display='none'} />
          <span className="text-lg font-bold text-ex-text">KigaliTech</span>
        </Link>

        {/* Mode tabs */}
        <div className="flex border-b border-ex-border mb-8">
          <button onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${mode === 'login' ? 'border-primary text-primary' : 'border-transparent text-ex-muted'}`}>
            Sign In
          </button>
          <button onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${mode === 'register' ? 'border-primary text-primary' : 'border-transparent text-ex-muted'}`}>
            Create Account
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-ex-text mb-1">
          {mode === 'login' ? 'Log in to Exclusive' : 'Create an Account'}
        </h1>
        <p className="text-sm text-ex-muted mb-7">Enter your details below</p>

        {/* Alerts */}
        {verified && (
          <div className="mb-5 rounded bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✓ Email verified! You can now sign in.
          </div>
        )}
        {error && (
          <div className="mb-5 rounded bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Login form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input required
              value={form.email || form.phone}
              onChange={e => {
                const val = e.target.value;
                const isPhone = val.startsWith('+') || /^[\d\s\-()]{3,}$/.test(val.replace(/^\+/, ''));
                setForm({ ...form, email: isPhone ? '' : val.toLowerCase(), phone: isPhone ? val : '' });
              }}
              placeholder="Email or Phone"
              className={inp}
            />
            <div>
              <input required type="password" value={form.password} onChange={setField('password')} placeholder="Password" className={inp} />
              <div className="flex justify-end mt-1">
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</Link>
              </div>
            </div>

            <button type="submit" disabled={!!loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading === 'login' ? 'Signing in…' : 'Log In'}
            </button>

            {/* Social */}
            {socialProviders.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 border-t border-ex-border" />
                  <span className="text-xs text-ex-muted">or</span>
                  <div className="flex-1 border-t border-ex-border" />
                </div>
                {socialProviders.includes('google') && (
                  <button type="button" onClick={() => handleSocial('google')} disabled={!!loading}
                    className="w-full flex items-center justify-center gap-3 border border-ex-border rounded py-3 text-sm font-medium text-ex-text hover:border-primary transition-colors disabled:opacity-60">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {loading === 'google' ? 'Connecting…' : 'Continue with Google'}
                  </button>
                )}
              </>
            )}

            {/* Magic link */}
            <div className="pt-2 border-t border-ex-border">
              <p className="text-xs text-ex-muted mb-2 text-center">No password? Use a magic link</p>
              {magicSent ? (
                <div className="rounded bg-green-50 border border-green-200 px-4 py-3 text-center text-sm text-green-700">
                  📬 Check your inbox — we sent a link to <strong>{magicEmail}</strong>
                  <button onClick={() => { setMagicSent(false); setMagicEmail(''); }} className="block mt-1 text-xs underline mx-auto">Use different email</button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="flex gap-2">
                  <input type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value.toLowerCase())}
                    placeholder="your@email.com" className={`${inp} flex-1`} />
                  <button type="submit" disabled={!!loading}
                    className="whitespace-nowrap px-4 py-3 rounded border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors disabled:opacity-60">
                    {loading === 'magic-send' ? '…' : 'Send Link'}
                  </button>
                </form>
              )}
            </div>
          </form>
        )}

        {/* Register form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input required value={form.name} onChange={setField('name')} placeholder="Full Name" className={inp} />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value.toLowerCase() })} placeholder="Email Address" className={inp} />
            <input type="tel" value={form.phone} onChange={setField('phone')} placeholder="Phone (+250 7XX XXX XXX)" className={inp} />
            <div>
              <input required type="password" value={form.password} onChange={setField('password')} placeholder="Password (min 8 chars)" className={inp} />
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-ex-border'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-ex-muted">{strength.label}</p>
                </div>
              )}
            </div>
            <input required type="password" value={form.confirmPassword} onChange={setField('confirmPassword')} placeholder="Confirm Password" className={inp} />
            <p className="text-xs text-ex-muted">Enter email, phone, or both — at least one required.</p>
            <button type="submit" disabled={!!loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading === 'register' ? 'Creating account…' : 'Create Account'}
            </button>

            {socialProviders.includes('google') && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-ex-border" />
                  <span className="text-xs text-ex-muted">or</span>
                  <div className="flex-1 border-t border-ex-border" />
                </div>
                <button type="button" onClick={() => handleSocial('google')} disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 border border-ex-border rounded py-3 text-sm font-medium text-ex-text hover:border-primary transition-colors disabled:opacity-60">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
