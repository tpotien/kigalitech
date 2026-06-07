import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  const masked = '*'.repeat(Math.max(local.length - 2, 2));
  return `${visible}${masked}@${domain}`;
}

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = router.query;
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  function handleDigit(idx, value) {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    setError('');
    if (cleaned && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (next.every(d => d !== '') && next.join('').length === 6) {
      handleVerify(next.join(''));
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setError('');
    const focusIdx = Math.min(text.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (text.length === 6) handleVerify(text);
  }

  async function handleVerify(code) {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid code. Please try again.');
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        setStatus('success');
        setTimeout(() => router.push('/signin?verified=1'), 2000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || !canResend) return;
    setResendLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not resend. Please try again.');
      } else {
        setCountdown(60);
        setCanResend(false);
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setResendLoading(false);
    }
  }

  const code = digits.join('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-6 pb-6 sm:px-8 sm:pt-10 sm:pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Verify your email</h1>
            <p className="text-blue-200 text-sm mt-2">
              We sent a 6-digit code to
            </p>
            <p className="text-white font-semibold text-sm">{maskEmail(email)}</p>
          </div>

          <div className="px-8 py-8">
            {status === 'success' ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Email verified!</h2>
                <p className="text-slate-500 text-sm">Redirecting you to sign in...</p>
              </div>
            ) : (
              <>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
                  Enter the 6-digit verification code below
                </p>

                {/* OTP Input */}
                <div className="flex gap-1.5 sm:gap-3 justify-center mb-6" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200
                        ${d ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white'}
                        focus:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:shadow-lg focus:shadow-blue-100
                        ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
                      `}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
                  </div>
                )}

                <button
                  onClick={() => code.length === 6 && handleVerify(code)}
                  disabled={code.length < 6 || loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Verifying...
                    </span>
                  ) : 'Verify Email'}
                </button>

                <div className="mt-5 text-center">
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline disabled:opacity-50"
                    >
                      {resendLoading ? 'Sending...' : 'Resend code'}
                    </button>
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                      Resend code in{' '}
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                        {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                      </span>
                    </p>
                  )}
                </div>

                {/* WhatsApp fallback */}
                <div className="mt-4 text-center">
                  <a
                    href={`https://wa.me/250786276555?text=${encodeURIComponent(`Hi KigaliTech, I need my email verification code for: ${email || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 transition-colors no-underline"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.882l6.197-1.624A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.876 0-3.638-.491-5.163-1.353l-.37-.22-3.677.964.98-3.582-.24-.385A9.962 9.962 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Get code on WhatsApp
                  </a>
                  <p className="text-xs text-slate-400 mt-1.5">Our team will send it instantly</p>
                </div>
              </>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                Wrong email?{' '}
                <Link href="/signin" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-4 text-center">
          <p className="text-slate-400 text-xs">
            Check your spam folder if you don't see the email within a minute.
          </p>
        </div>
      </div>
    </div>
  );
}
