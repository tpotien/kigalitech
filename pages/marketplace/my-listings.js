import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

const GRACE_MONTHS = 5;

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
  sold:     'bg-slate-200 text-slate-600',
  expired:  'bg-slate-100 text-slate-500',
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://kigalitechservices.com';

export default function MyListings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [markingSold, setMarkingSold] = useState(null);
  const [payingSubscription, setPayingSubscription] = useState(false);
  const [subPayLoading, setSubPayLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const bioTimer = useRef(null);
  const [sellerStatus, setSellerStatus] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin?callbackUrl=/marketplace/my-listings');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/marketplace/my-listings')
      .then(r => r.json())
      .then(data => { setListings(data); setLoading(false); });
    fetch(`/api/marketplace/seller-profile?userId=${session.user.id}`)
      .then(r => r.json())
      .then(d => { if (d.user?.bio) setBio(d.user.bio); })
      .catch(() => {});
    fetch('/api/marketplace/my-seller-status')
      .then(r => r.json())
      .then(d => setSellerStatus(d))
      .catch(() => {});
  }, [status]);

  function shareLink(listingId) {
    return `${SITE}/marketplace/${listingId}`;
  }

  function catalogLink() {
    return `${SITE}/marketplace/seller/${session?.user?.id}`;
  }

  async function saveBio() {
    setBioSaving(true);
    try {
      await fetch('/api/marketplace/seller-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });
      setBioSaved(true);
      clearTimeout(bioTimer.current);
      bioTimer.current = setTimeout(() => setBioSaved(false), 2500);
    } catch {}
    setBioSaving(false);
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function shareWhatsApp(text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function markAsSold(listingId) {
    if (!confirm('Mark this listing as sold? It will be removed from the marketplace.')) return;
    setMarkingSold(listingId);
    try {
      const res = await fetch('/api/marketplace/my-listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listingId, action: 'mark_sold' }),
      });
      if (res.ok) setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'sold' } : l));
    } catch {}
    setMarkingSold(null);
  }

  async function paySubscription() {
    setSubPayLoading(true);
    try {
      const res = await fetch('/api/marketplace/pay-subscription', { method: 'POST' });
      const data = await res.json();
      if (data.paymentLink) window.location.href = data.paymentLink;
      else alert(data.error || 'Could not initiate payment');
    } catch {}
    setSubPayLoading(false);
  }

  if (loading) return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    </Layout>
  );

  const approvedListings = listings.filter(l => l.status === 'approved');

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Listings</h1>
            <p className="text-sm text-slate-500 mt-0.5">{listings.length} listing{listings.length !== 1 ? 's' : ''} · {approvedListings.length} live</p>
          </div>
          <Link href="/marketplace/sell"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 no-underline transition">
            + New Listing
          </Link>
        </div>

        {/* Seller status banner */}
        {sellerStatus && sellerStatus.sellerStatus === 'suspended' && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-5 py-4">
            <p className="font-bold text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <span>⛔</span> Your seller account has been suspended
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">
              Reason: <span className="capitalize">{sellerStatus.sellerSuspendedReason?.replace('_', ' ') || 'Policy violation'}</span>. Please contact support to resolve this.
            </p>
          </div>
        )}
        {sellerStatus && (sellerStatus.sellerStatus === 'inactive' || (sellerStatus.sellerStatus === 'active' && sellerStatus.graceExpired && !sellerStatus.subscriptionActive)) && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                  <span>⚠️</span> Subscription required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Your 5-month grace period has ended. Pay <strong>RWF 10,000/month</strong> to keep listing.
                </p>
              </div>
              <button onClick={paySubscription} disabled={subPayLoading}
                className="flex-shrink-0 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60 transition">
                {subPayLoading ? 'Loading...' : 'Pay Now'}
              </button>
            </div>
          </div>
        )}
        {sellerStatus && sellerStatus.sellerStatus === 'active' && sellerStatus.graceExpired && sellerStatus.subscriptionActive && sellerStatus.sellerSubscriptionExp && (
          <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-700 px-5 py-3">
            <p className="text-xs text-sky-700 dark:text-sky-300 flex items-center gap-2">
              <span>✓</span> Subscription active until <strong>{new Date(sellerStatus.sellerSubscriptionExp).toLocaleDateString()}</strong>
            </p>
          </div>
        )}
        {sellerStatus && sellerStatus.sellerStatus === 'active' && !sellerStatus.graceExpired && sellerStatus.graceDaysLeft !== null && sellerStatus.graceDaysLeft <= 30 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-5 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              ⏳ Grace period ends in <strong>{sellerStatus.graceDaysLeft} days</strong>. After that, a monthly subscription of RWF 10,000 is required to keep listing.
            </p>
          </div>
        )}

        {/* Bio editor */}
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Seller Bio</p>
              <p className="text-xs text-slate-400 mt-0.5">Shown on your public catalog page · max 300 characters</p>
            </div>
            <Link href={`/marketplace/seller/${session?.user?.id}`} target="_blank"
              className="flex-shrink-0 text-xs text-violet-600 dark:text-violet-400 hover:underline no-underline font-semibold">
              View catalog →
            </Link>
          </div>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Tell buyers about yourself — what you sell, your location, how to reach you..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm resize-none focus:outline-none focus:border-violet-400 transition"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">{bio.length}/300</span>
            <button onClick={saveBio} disabled={bioSaving}
              className="rounded-full bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition">
              {bioSaved ? '✓ Saved!' : bioSaving ? 'Saving...' : 'Save Bio'}
            </button>
          </div>
        </div>

        {/* Share full catalog */}
        {approvedListings.length > 0 && (
          <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-violet-900 dark:text-violet-300 text-sm">Share Your Full Catalog</p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 font-mono truncate">{catalogLink()}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => copyToClipboard(catalogLink(), 'catalog')}
                className="rounded-full border border-violet-300 dark:border-violet-700 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition">
                {copied === 'catalog' ? '✓ Copied!' : '⧉ Copy Link'}
              </button>
              <button onClick={() => shareWhatsApp(`Check out my electronics on KigaliTech! 📱\n${catalogLink()}`)}
                className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition">
                WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Listings */}
        {listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📦</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No listings yet</p>
            <p className="text-sm text-slate-400 mb-6">Start selling your electronics on KigaliTech</p>
            <Link href="/marketplace/sell" className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white no-underline hover:bg-violet-700">List Your First Item</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => {
              const images = (() => { try { return JSON.parse(listing.images); } catch { return []; } })();
              const isVerified = listing.verified;
              const sellerEarns = listing.price;

              return (
                <div key={listing.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {images[0]
                        ? <img src={images[0]} alt={listing.title} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-3xl">📦</div>}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{listing.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{listing.category} · {listing.condition?.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isVerified && (
                            <span className="rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 px-2 py-0.5 text-[10px] font-bold">✓ Verified</span>
                          )}
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[listing.status] || 'bg-slate-100 text-slate-600'}`}>
                            {listing.status}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span>Price: <span className="font-bold text-slate-800 dark:text-white">RWF {sellerEarns.toLocaleString()}</span></span>
                        <span className="text-slate-300">·</span>
                        <span>You receive: <span className="font-bold text-emerald-700">RWF {sellerEarns.toLocaleString()}</span></span>
                      </div>

                      {/* Admin notes if rejected */}
                      {listing.status === 'rejected' && listing.adminNotes && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5">
                          ⚠️ {listing.adminNotes}
                        </p>
                      )}

                      {/* Verified = read-only notice */}
                      {isVerified && (
                        <p className="mt-2 text-xs text-sky-600 dark:text-sky-400">
                          🔒 This listing is verified — details are locked for authenticity.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions row */}
                  {(listing.status === 'approved' || listing.status === 'expired') && (
                    <div className="border-t border-slate-50 dark:border-slate-800 px-4 py-3 flex flex-wrap gap-2">
                      {listing.status === 'approved' && (<>
                        <button onClick={() => copyToClipboard(shareLink(listing.id), listing.id)}
                          className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                          {copied === listing.id ? '✓ Copied!' : '⧉ Copy Link'}
                        </button>
                        <button onClick={() => shareWhatsApp(`Check out this listing on KigaliTech! 📱\n${listing.title} — RWF ${sellerEarns.toLocaleString()}\n${shareLink(listing.id)}`)}
                          className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-1.5 text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition">
                          WhatsApp
                        </button>
                        <button onClick={() => markAsSold(listing.id)} disabled={markingSold === listing.id}
                          className="ml-auto rounded-full bg-slate-800 dark:bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60 transition">
                          {markingSold === listing.id ? 'Marking...' : '✓ Mark as Sold'}
                        </button>
                      </>)}
                      {listing.status === 'expired' && (
                        <p className="text-xs text-slate-400 italic">This listing expired after 60 days. <a href="/marketplace/sell" className="text-violet-600 hover:underline font-semibold">Relist it →</a></p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
