import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

async function doSignOut() {
  try { localStorage.removeItem('cart'); localStorage.removeItem('kt_rv'); sessionStorage.clear(); } catch {}
  await signOut({ redirect: false });
  window.location.replace('/signin');
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileRef = useRef(null);

  const [name, setName] = useState('');
  const [previewImg, setPreviewImg] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin?callbackUrl=/account/profile');
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setPreviewImg(session.user.image || null);
    }
  }, [session]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Image must be under 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setPreviewImg(ev.target.result);
      setImageDataUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name cannot be empty'); return; }
    setError('');
    setSaving(true);
    try {
      const body = { name: name.trim() };
      if (imageDataUrl) body.imageDataUrl = imageDataUrl;
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); return; }
      await update();
      setSaved(true);
      setImageDataUrl(null);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSaving(false);
  }

  if (status === 'loading' || !session) return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    </Layout>
  );

  const user = session.user;

  return (
    <Layout>
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account/loyalty" className="text-slate-400 hover:text-violet-600 no-underline">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
            <p className="text-sm text-slate-400 mt-0.5">Update your name and profile photo</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  {previewImg
                    ? <img src={previewImg} alt="" className="h-full w-full object-cover" />
                    : <span className="text-4xl font-extrabold text-white">{(name || 'U')[0].toUpperCase()}</span>
                  }
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 rounded-full bg-violet-600 p-2 text-white shadow-lg hover:bg-violet-700 transition"
                  title="Change photo"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <p className="text-xs text-slate-400">JPG, PNG, or WebP · max 3 MB</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={user.email || ''}
                readOnly
                className="w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 px-4 py-3 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed</p>
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-3 py-1 text-xs font-bold capitalize">{user.role || 'Customer'}</span>
              {user.role === 'admin' && <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 text-xs font-bold">Admin Access</span>}
            </div>

            {/* Error */}
            {error && <p className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition"
            >
              {saved ? '✓ Profile saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/account/orders" className="no-underline flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 hover:border-violet-300 transition">
            <span className="text-xl">🛍️</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">My Orders</span>
          </Link>
          <Link href="/account/wishlist" className="no-underline flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 hover:border-violet-300 transition">
            <span className="text-xl">💝</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Wishlist</span>
          </Link>
          <Link href="/account/loyalty" className="no-underline flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 hover:border-violet-300 transition">
            <span className="text-xl">⭐</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Loyalty Points</span>
          </Link>
          <button
            onClick={doSignOut}
            className="flex items-center gap-3 rounded-2xl border border-red-100 dark:border-red-900/30 bg-white dark:bg-slate-900 px-4 py-3 hover:border-red-300 text-red-500 transition"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
