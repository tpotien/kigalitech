import Link from 'next/link';
import Layout from '../../../components/Layout';
import prisma from '../../../lib/prisma';

const CONDITION_LABEL = { like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor' };
const CONDITION_COLOR = {
  like_new: 'bg-emerald-100 text-emerald-700',
  good: 'bg-sky-100 text-sky-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://kigalitechservices.com';

export async function getServerSideProps({ params }) {
  const sid = Number(params.id);
  if (!Number.isFinite(sid)) return { redirect: { destination: '/', permanent: false } };
  try {
    const user = await prisma.user.findUnique({
      where: { id: sid },
      select: { id: true, name: true, image: true, bio: true, createdAt: true, sellerStatus: true },
    });
    if (!user) return { notFound: true };

    const listings = user.sellerStatus === 'active'
      ? await prisma.marketplaceListing.findMany({
          where: {
            sellerId: Number(params.id),
            OR: [{ status: 'approved' }, { verified: true }],
          },
          orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
        })
      : [];

    return {
      props: {
        seller: JSON.parse(JSON.stringify(user)),
        listings: JSON.parse(JSON.stringify(listings)),
        suspended: user.sellerStatus !== 'active',
      },
    };
  } catch {
    return { notFound: true };
  }
}

export default function SellerCatalog({ seller, listings, suspended }) {
  const memberSince = new Date(seller.createdAt).toLocaleDateString('en-RW', { month: 'long', year: 'numeric' });
  const catalogUrl = `${SITE}/marketplace/seller/${seller.id}`;

  function copyLink() {
    navigator.clipboard.writeText(catalogUrl);
  }

  function shareWhatsApp() {
    const msg = `Check out ${seller.name || 'this seller'}'s electronics on KigaliTech Marketplace! 🛒\n${catalogUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href="/marketplace" className="hover:text-violet-600 no-underline">Marketplace</Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300">{seller.name || 'Seller'}</span>
        </div>

        {/* Suspended banner */}
        {suspended && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-6 py-5 flex items-start gap-4">
            <span className="text-2xl">⛔</span>
            <div>
              <p className="font-bold text-red-700 dark:text-red-400">This seller account has been suspended</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">Their listings are not available at this time. Please browse other sellers in the <Link href="/marketplace" className="underline font-semibold">marketplace</Link>.</p>
            </div>
          </div>
        )}

        {/* Seller profile card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            {seller.image
              ? <img src={seller.image} alt="" className="h-20 w-20 rounded-2xl object-cover flex-shrink-0" />
              : <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white flex-shrink-0">
                  {(seller.name || 'S')[0].toUpperCase()}
                </div>
            }

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{seller.name || 'Seller'}</h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Member since {memberSince}
                    {!suspended && ` · ${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {!suspended && (
                  <div className="flex gap-2">
                    <button onClick={copyLink}
                      className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      ⧉ Copy catalog link
                    </button>
                    <button onClick={shareWhatsApp}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition">
                      WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* Bio */}
              {seller.bio && !suspended && (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  {seller.bio}
                </p>
              )}

              {/* Stats */}
              {!suspended && (
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
                    <span>📦</span> {listings.length} listing{listings.length !== 1 ? 's' : ''}
                  </div>
                  {listings.some(l => l.verified) && (
                    <div className="flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-900/20 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
                      <span>✓</span> Verified seller
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listings grid */}
        {!suspended && (
          listings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📭</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No active listings</p>
              <p className="text-sm text-slate-400">This seller has no approved listings yet.</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                All Listings <span className="text-slate-400 font-normal text-sm">({listings.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map(listing => {
                  const images = (() => { try { return JSON.parse(listing.images) || []; } catch { return []; } })();
                  const waMsg = encodeURIComponent(
                    `Hi! I'm interested in your listing on KigaliTech Marketplace 👋\n\n*${listing.title}*\nPrice: RWF ${listing.price.toLocaleString()}\n\n🔗 ${SITE}/marketplace/${listing.id}\n\nIs this still available?`
                  );

                  return (
                    <article key={listing.id} className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <Link href={`/marketplace/${listing.id}`} className="block no-underline">
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {images[0]
                            ? <img src={images[0]} alt={listing.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <div className="flex h-full items-center justify-center text-5xl">📦</div>
                          }
                          {listing.verified && (
                            <span className="absolute top-3 left-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">✓ Verified</span>
                          )}
                          {listing.condition && (
                            <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${CONDITION_COLOR[listing.condition] || 'bg-slate-100 text-slate-600'}`}>
                              {CONDITION_LABEL[listing.condition] || listing.condition}
                            </span>
                          )}
                        </div>

                        <div className="p-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-1">{listing.category}</p>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-2 line-clamp-2">{listing.title}</h3>
                          <p className="text-lg font-extrabold text-slate-900 dark:text-white">RWF {listing.price.toLocaleString()}</p>
                        </div>
                      </Link>

                      {listing.phone && (
                        <div className="px-4 pb-4">
                          <a
                            href={`https://wa.me/${listing.phone.replace(/\D/g, '')}?text=${waMsg}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-500 py-2 text-xs font-bold text-white no-underline hover:bg-emerald-600 transition"
                          >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Contact Seller
                          </a>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>
    </Layout>
  );
}
