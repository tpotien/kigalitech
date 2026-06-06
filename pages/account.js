import { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useLang } from '../context/LanguageContext';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const REPAIR_STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const { t } = useLang();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [form, setForm] = useState({ productName: '', issue: '', description: '', priority: 'normal', orderId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profileImageDataUrl, setProfileImageDataUrl] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', ok: false });
  const photoRef = useRef();

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoadingOrders(true);
    fetch('/api/account/orders').then(r => r.json()).then(data => { setOrders(data); setLoadingOrders(false); });
    setProfileName(session?.user?.name || '');
    setProfileImagePreview(session?.user?.image || null);
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated' || tab !== 'repairs') return;
    setLoadingTickets(true);
    fetch('/api/repairs').then(r => r.json()).then(data => { setTickets(data); setLoadingTickets(false); });
  }, [status, tab]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfileImageDataUrl(ev.target.result);
      setProfileImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', ok: false });
    const payload = {};
    if (profileName !== (session?.user?.name || '')) payload.name = profileName;
    if (profileImageDataUrl) payload.imageDataUrl = profileImageDataUrl;
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setProfileImageDataUrl(null);
      if (data.image) setProfileImagePreview(data.image);
      setProfileMsg({ text: 'Profile updated! Name and picture changes appear on next sign-in.', ok: true });
    } else {
      setProfileMsg({ text: data.error || 'Failed to update', ok: false });
    }
    setSavingProfile(false);
  }

  async function submitRepair(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    const res = await fetch('/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmitMsg('Repair ticket submitted successfully!');
      setTickets(prev => [data, ...prev]);
      setForm({ productName: '', issue: '', description: '', priority: 'normal', orderId: '' });
    } else {
      setSubmitMsg(data.error || 'Failed to submit ticket');
    }
    setSubmitting(false);
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

  if (!session) {
    return (
      <Layout>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
              <svg className="h-8 w-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sign in to your account</h1>
            <p className="mt-2 text-slate-500">Access your orders, repair tickets, and profile</p>
          </div>
          <button
            onClick={() => signIn()}
            className="rounded-full bg-sky-600 px-8 py-3 font-semibold text-white shadow-lg shadow-sky-200 hover:bg-sky-700"
          >
            Sign In
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Profile header */}
          <div className="mb-8 flex items-center gap-5 rounded-3xl bg-white p-6 shadow-sm">
            {session.user.image
              ? <img src={session.user.image} alt="" className="h-16 w-16 rounded-full" />
              : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white">{(session.user.name || 'U')[0].toUpperCase()}</div>
            }
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{session.user.name || 'Customer'}</h1>
              <p className="text-slate-500">{session.user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-700 capitalize">{session.user.role || 'customer'}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
            {[
              { id: 'orders', label: t('myOrders') },
              { id: 'repairs', label: t('repairTickets') },
              { id: 'profile', label: 'Profile' },
            ].map(tab_ => (
              <button
                key={tab_.id}
                onClick={() => setTab(tab_.id)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  tab === tab_.id ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab_.label}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
                  <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="mt-4 text-slate-500">{t('noOrders')}</p>
                  <Link href="/products" className="mt-4 inline-block rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">{t('shopNow')}</Link>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">Order #{order.id}</p>
                        <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {order.status}
                        </span>
                        <p className="font-bold text-slate-900">${(order.total / 100).toFixed(2)}</p>
                      </div>
                    </div>
                    {order.items?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.items.map((item, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 no-underline"
                      >
                        {t('viewDetails')}
                      </Link>
                      {order.billPrintable && (
                        <Link
                          href={`/orders/${order.id}#print`}
                          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 no-underline"
                        >
                          {t('printReceipt')}
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Profile Tab */}
          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-5">
              {/* Profile picture */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-slate-900">Profile Picture</h2>
                <div className="flex items-center gap-5">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-sky-200 shadow" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white">
                      {(session.user.name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => photoRef.current?.click()}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Change Photo
                    </button>
                    <p className="mt-1.5 text-xs text-slate-400">JPG, PNG or WebP — max 5 MB</p>
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                </div>
              </div>

              {/* Display name */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Your Info</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Display Name</label>
                    <input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      value={session.user.email || ''}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {profileMsg.text && (
                <p className={`rounded-xl px-4 py-3 text-sm font-medium ${profileMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {profileMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-full bg-sky-600 px-7 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* Repair Tickets Tab */}
          {tab === 'repairs' && (
            <div className="space-y-6">
              {/* Submit form */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-slate-900">{t('submitRepair')}</h2>
                <form onSubmit={submitRepair} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('productName')} *</label>
                      <input
                        required
                        value={form.productName}
                        onChange={e => setForm({ ...form, productName: e.target.value })}
                        placeholder="e.g. iPhone 15 Pro"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Order ID (optional)</label>
                      <input
                        value={form.orderId}
                        onChange={e => setForm({ ...form, orderId: e.target.value })}
                        placeholder="e.g. 12"
                        type="number"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('issue')} *</label>
                      <input
                        required
                        value={form.issue}
                        onChange={e => setForm({ ...form, issue: e.target.value })}
                        placeholder="e.g. Screen not working"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('priority')}</label>
                      <select
                        value={form.priority}
                        onChange={e => setForm({ ...form, priority: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('description')}</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the problem in detail..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  {submitMsg && (
                    <p className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                      submitMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>{submitMsg}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {submitting ? t('loading') : t('submitRequest')}
                  </button>
                </form>
              </div>

              {/* Existing tickets */}
              {loadingTickets ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                </div>
              ) : tickets.length > 0 && (
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-lg font-bold text-slate-900">My Repair Tickets</h2>
                  <div className="space-y-4">
                    {tickets.map(ticket => (
                      <div key={ticket.id} className="rounded-2xl border border-slate-100 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">#{ticket.id} — {ticket.productName}</p>
                            <p className="text-sm text-slate-500">{ticket.issue}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${REPAIR_STATUS_COLORS[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                              {ticket.status?.replace('_', ' ')}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${PRIORITY_COLORS[ticket.priority] || 'bg-slate-100 text-slate-600'}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                        {ticket.description && <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>}
                        {ticket.adminNotes && (
                          <div className="mt-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">
                            <span className="font-semibold">Admin note: </span>{ticket.adminNotes}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
