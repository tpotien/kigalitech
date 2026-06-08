import Link from 'next/link';
import Layout from '../../components/Layout';
import { useCurrency } from '../../context/CurrencyContext';

const CONDITION_LABEL = {
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const CONDITION_COLOR = {
  like_new: 'bg-emerald-100 text-emerald-700',
  good: 'bg-sky-100 text-sky-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
};

const SITE = 'https://kigalitechservices.com';

export async function getServerSideProps({ params }) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: Number(params.id),
        OR: [{ status: 'approved' }, { verified: true }],
      },
      include: { seller: { select: { name: true, image: true } } },
    });

    if (!listing) return { notFound: true };

    // Increment views
    await prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { views: { increment: 1 } },
    });

    return { props: { listing: JSON.parse(JSON.stringify(listing)) } };
  } catch {
    return { notFound: true };
  } finally {
    await prisma.$disconnect();
  }
}

export default function ListingDetail({ listing }) {
  const { format } = useCurrency();

  const images = (() => { try { return JSON.parse(listing.images) || []; } catch { return []; } })();
  const sellerPrice = listing.price;
  const fee = Math.round(sellerPrice * 0.03);
  const buyerTotal = sellerPrice + fee;

  const waMsg = encodeURIComponent(
    `Hi! I'm interested in your listing on KigaliTech Marketplace 👋\n\n*${listing.title}*\nPrice: RWF ${sellerPrice.toLocaleString()}\n\n🔗 ${SITE}/marketplace/${listing.id}\n\nIs this still available?`
  );

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/marketplace" className="hover:text-sky-600 no-underline">Marketplace</Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300 truncate">{listing.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

          {/* ── Left: Images + Description ── */}
          <div className="space-y-6">

            {/* Images */}
            <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[4/3]">
              {images[0] ? (
                <img src={images[0]} alt={listing.title} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">📦</div>
              )}
            </div>

            {/* Thumbnail row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <img key={i} src={img} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
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
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">RWF {sellerPrice.toLocaleString()}</p>
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Seller price</span><span>RWF {sellerPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>+3% platform fee</span><span>RWF {fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                  <span>You pay</span><span>RWF {buyerTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex items-center gap-3">
              {listing.seller?.image
                ? <img src={listing.seller.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-bold text-violet-700 dark:text-violet-400 flex-shrink-0">
                    {(listing.seller?.name || 'S')[0]}
                  </div>
              }
              <div>
                <p className="text-xs text-slate-400">Sold by</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{listing.seller?.name || 'Member'}</p>
              </div>
            </div>

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

            <Link href="/marketplace" className="flex w-full items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline transition">
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
