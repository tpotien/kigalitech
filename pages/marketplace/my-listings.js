import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://kigalitechservices.com';

export default function MyListings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin?callbackUrl=/marketplace/my-listings');
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/marketplace/my-listings')
      .then(r => r.json())
      .then(data => { setListings(data); setLoading(false); });
  }, [status]);

  function shareLink(listingId) {
    return `${SITE}/marketplace/${listingId}`;
  }

  function catalogLink() {
    return `${SITE}/marketplace?seller=${session?.user?.id}`;
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function shareWhatsApp(text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
              const fee = Math.round(listing.price * 0.03);
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

                      {/* Price breakdown */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span>Your price: <span className="font-bold text-slate-800 dark:text-white">RWF {sellerEarns.toLocaleString()}</span></span>
                        <span>+3% fee: <span className="font-medium">RWF {fee.toLocaleString()}</span></span>
                        <span>Buyer pays: <span className="font-bold text-emerald-700">RWF {(sellerEarns + fee).toLocaleString()}</span></span>
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

                  {/* Share actions (only for approved listings) */}
                  {listing.status === 'approved' && (
                    <div className="border-t border-slate-50 dark:border-slate-800 px-4 py-3 flex gap-2">
                      <button onClick={() => copyToClipboard(shareLink(listing.id), listing.id)}
                        className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        {copied === listing.id ? '✓ Copied!' : '⧉ Copy Link'}
                      </button>
                      <button onClick={() => shareWhatsApp(`Check out this listing on KigaliTech! 📱\n${listing.title} — RWF ${sellerEarns.toLocaleString()}\n${shareLink(listing.id)}`)}
                        className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-1.5 text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition">
                        Share on WhatsApp
                      </button>
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
