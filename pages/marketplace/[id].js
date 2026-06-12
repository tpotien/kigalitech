import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ShareButton from '../../components/ShareButton';
import prisma from '../../lib/prisma';

const CONDITION_LABEL = { like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor' };
const CONDITION_COLOR = {
  like_new: 'bg-emerald-100 text-emerald-700',
  good: 'bg-sky-100 text-sky-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
};
const SITE = 'https://kigalitechservices.com';

export async function getServerSideProps({ params }) {
  const lid = Number(params.id);
  if (!Number.isFinite(lid)) return { redirect: { destination: '/', permanent: false } };
  try {
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: lid,
        OR: [{ status: 'approved' }, { verified: true }],
        seller: { sellerStatus: 'active' },
      },
      include: { seller: { select: { name: true, image: true } } },
    });
    if (!listing) return { notFound: true };
    await prisma.marketplaceListing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } });
    return { props: { listing: JSON.parse(JSON.stringify(listing)) } };
  } catch {
    return { notFound: true };
  }
}

const REPORT_REASONS = [
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'counterfeit', label: 'Counterfeit / fake item' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'overpriced', label: 'Extremely overpriced' },
  { value: 'already_sold', label: 'Item already sold' },
];

export default function ListingDetail({ listing }) {
  const images = (() => { try { return JSON.parse(listing.images) || []; } catch { return []; } })();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('scam');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  async function submitReport() {
    setReportSubmitting(true);
    await fetch('/api/marketplace/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id, reason: reportReason }),
    });
    setReportSubmitting(false);
    setReportDone(true);
    setTimeout(() => { setReportOpen(false); setReportDone(false); }, 2000);
  }

  const sellerPrice = listing.price;
  const waMsg = encodeURIComponent(
    `Hi! I'm interested in your listing on KigaliTech Marketplace 👋\n\n*${listing.title}*\nPrice: RWF ${sellerPrice.toLocaleString()}\n\n🔗 ${SITE}/marketplace/${listing.id}\n\nIs this still available?`
  );

  return (
    <Layout>
      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setReportOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-white">Report this listing</h3>
              <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
            </div>
            {reportDone ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">✓</p>
                <p className="font-semibold text-emerald-600">Report submitted</p>
                <p className="text-sm text-slate-400 mt-1">Our team will review this listing.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Why are you reporting this listing?</p>
                <div className="space-y-2 mb-6">
                  {REPORT_REASONS.map(r => (
                    <label key={r.value} className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition ${reportReason === r.value ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                      <input type="radio" value={r.value} checked={reportReason === r.value} onChange={() => setReportReason(r.value)} className="accent-violet-600" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{r.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={submitReport}
                  disabled={reportSubmitting}
                  className="w-full rounded-full bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && images[selectedIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light leading-none z-10"
            onClick={() => setLightboxOpen(false)}
          >×</button>
          <img
            src={images[selectedIdx]}
            alt={listing.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setSelectedIdx(i); }}
                  className={`h-2 rounded-full transition-all ${i === selectedIdx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/marketplace" className="hover:text-sky-600 no-underline">Marketplace</Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300 truncate">{listing.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Left: Images + Description ── */}
          <div className="space-y-4">
            {/* Main image */}
            <div
              className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3] cursor-zoom-in relative group"
              onClick={() => images[selectedIdx] && setLightboxOpen(true)}
            >
              {images[selectedIdx] ? (
                <>
                  <img
                    src={images[selectedIdx]}
                    alt={listing.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs font-semibold rounded-full px-3 py-1.5">
                      Click to zoom
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">📦</div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    className={`flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                      i === selectedIdx
                        ? 'border-sky-500 shadow-md shadow-sky-200 dark:shadow-sky-900/40 scale-105'
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100 hover:border-slate-400'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-3">About this listing</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {listing.description || 'No description provided.'}
              </p>
              {listing.location && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>📍</span> {listing.location}
                </p>
              )}
            </div>
          </div>

          {/* ── Right: Info + Actions ── */}
          <div className="space-y-4">
            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {listing.verified && (
                  <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-3 py-0.5 text-xs font-bold">
                    ✓ Verified by KigaliTech
                  </span>
                )}
                {listing.condition && (
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${CONDITION_COLOR[listing.condition] || 'bg-slate-100 text-slate-600'}`}>
                    {CONDITION_LABEL[listing.condition] || listing.condition}
                  </span>
                )}
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-0.5 text-xs font-semibold">
                  {listing.category}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {listing.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Listed {new Date(listing.createdAt).toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' })}
                {listing.views > 0 && ` · ${listing.views} view${listing.views !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Price card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Price</p>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">RWF {sellerPrice.toLocaleString()}</p>
                {listing.negotiable && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide">Negotiable</span>
                )}
              </div>
            </div>

            {/* Seller */}
            <Link href={`/marketplace/seller/${listing.sellerId}`}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex items-center gap-3 no-underline hover:border-violet-300 dark:hover:border-violet-700 transition">
              {listing.seller?.image
                ? <img src={listing.seller.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-bold text-violet-700 dark:text-violet-400 flex-shrink-0">
                    {(listing.seller?.name || 'S')[0]}
                  </div>
              }
              <div className="flex-1">
                <p className="text-xs text-slate-400">Sold by</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{listing.seller?.name || 'Member'}</p>
              </div>
              <span className="text-xs text-violet-500 font-semibold">View catalog →</span>
            </Link>

            {/* Contact seller */}
            {listing.phone ? (
              <a
                href={`https://wa.me/${listing.phone.replace(/\D/g, '')}?text=${waMsg}`}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-white no-underline hover:bg-emerald-600 transition shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contact Seller on WhatsApp
              </a>
            ) : (
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 py-3 text-center text-sm text-slate-400">
                No contact info provided
              </div>
            )}

            <ShareButton
              title={`${listing.title} — RWF ${sellerPrice.toLocaleString()} | KigaliTech`}
              url={`https://kigalitechservices.com/marketplace/${listing.id}`}
              className="justify-center"
            />

            <Link href="/marketplace" className="flex w-full items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline transition">
              ← Back to Marketplace
            </Link>

            <button
              onClick={() => setReportOpen(true)}
              className="w-full text-center text-xs text-slate-400 hover:text-red-500 transition py-1"
            >
              ⚑ Report this listing
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
