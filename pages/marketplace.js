import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useCurrency } from '../context/CurrencyContext';
import { useLang } from '../context/LanguageContext';
import TrendingInTech from '../components/TrendingInTech';
import prisma from '../lib/prisma';

const CATEGORIES = ['All', 'Phones', 'Laptops', 'Tablets', 'Audio', 'Cameras', 'Wearables', 'TVs', 'Gaming', 'Other'];

const CONDITION_COLORS = {
  like_new: 'bg-emerald-500 text-white',
  good: 'bg-sky-500 text-white',
  fair: 'bg-amber-500 text-white',
  poor: 'bg-red-500 text-white',
};

const CONDITION_LABELS = {
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const PAGE_SIZE = 20;

export async function getServerSideProps({ query }) {
  try {
    const { category, search } = query;
    const baseWhere = {
      OR: [{ status: 'approved' }, { verified: true }],
      seller: { sellerStatus: 'active' },
    };
    if (category && category !== 'All') baseWhere.category = category;
    if (search) baseWhere.AND = [{ OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]}];

    const baseWhereAll = {
      OR: [{ status: 'approved' }, { verified: true }],
      seller: { sellerStatus: 'active' },
    };
    const [listings, total, topListings] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: baseWhere,
        include: { seller: { select: { name: true, image: true } } },
        orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
        take: PAGE_SIZE,
      }),
      prisma.marketplaceListing.count({ where: baseWhere }),
      prisma.marketplaceListing.findMany({
        where: { ...baseWhereAll, views: { gt: 0 } },
        include: { seller: { select: { name: true, image: true } } },
        orderBy: { views: 'desc' },
        take: 4,
      }),
    ]);
    return { props: { listings: JSON.parse(JSON.stringify(listings)), total, query, topListings: JSON.parse(JSON.stringify(topListings)) } };
  } catch {
    return { props: { listings: [], total: 0, query } };
  }
}

export default function MarketplacePage({ listings: initialListings, total, query, topListings = [] }) {
  const { format } = useCurrency();
  const { t } = useLang();
  const [search, setSearch] = useState(query.search || '');
  const [activeCategory, setActiveCategory] = useState(query.category || 'All');
  const [allListings, setAllListings] = useState(initialListings);
  const [loadingMore, setLoadingMore] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeCategory !== 'All') params.set('category', activeCategory);
    window.location.href = `/marketplace?${params}`;
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ skip: String(allListings.length), take: '20' });
      if (query.category && query.category !== 'All') params.set('category', query.category);
      if (query.search) params.set('search', query.search);
      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      setAllListings(prev => [...prev, ...(data.listings || [])]);
    } catch {}
    setLoadingMore(false);
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-br from-violet-900 via-violet-800 to-slate-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-8">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-4">Customer Marketplace</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">{t('marketplace')}</h1>
            <p className="text-violet-200">Browse verified used electronics listed by our community. All listings reviewed by KigaliTech.</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`${t('search')}...`}
              className="flex-1 rounded-full bg-white/10 border border-white/20 px-5 py-3 text-sm text-white placeholder-violet-300 outline-none focus:bg-white/20"
            />
            <button type="submit" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-violet-900 hover:bg-violet-50">{t('search')}</button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <div className="sticky top-16 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map(cat => (
              <a
                key={cat}
                href={`/marketplace?category=${cat === 'All' ? '' : cat}${search ? `&search=${search}` : ''}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium no-underline whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {cat}
              </a>
            ))}
            <div className="ml-auto">
              <Link href="/marketplace/sell" className="no-underline">
                <button className="rounded-full bg-violet-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('sellItem')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hot & Trending — top viewed listings */}
      {topListings.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">Hot &amp; Trending</h2>
                <p className="text-xs text-slate-400">Most viewed listings right now</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {topListings.map((listing, idx) => {
              let imgs = [];
              try { imgs = JSON.parse(listing.images || '[]'); } catch {}
              return (
                <Link key={listing.id} href={`/marketplace/${listing.id}`} className="no-underline group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-amber-400">#{idx + 1}</span>
                    <span className="text-[10px] text-white/80">{listing.views} views</span>
                  </div>
                  {listing.verified && (
                    <div className="absolute top-2 right-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">✓ Verified</div>
                  )}
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {imgs[0]
                      ? <img src={imgs[0]} alt={listing.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      : <div className="flex h-full items-center justify-center text-4xl">📦</div>
                    }
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-0.5">{listing.category}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{listing.title}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">RWF {listing.price.toLocaleString()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <hr className="mt-8 border-slate-200 dark:border-slate-800" />
        </section>
      )}

      {/* Listings */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        {allListings.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-4xl">📭</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t('noResults')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Be the first to list an item for sale!</p>
            <Link href="/marketplace/sell" className="no-underline">
              <button className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">{t('listYourItem')}</button>
            </Link>
          </div>
        ) : (
          <>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{total} listing{total !== 1 ? 's' : ''} available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allListings.map(listing => {
              const images = JSON.parse(listing.images || '[]');
              return (
                <article key={listing.id} className="group rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                  {/* Condition banner */}
                  <div className={`w-full py-1.5 text-center text-xs font-bold uppercase tracking-wider ${CONDITION_COLORS[listing.condition] || 'bg-slate-400 text-white'}`}>
                    {CONDITION_LABELS[listing.condition] || listing.condition?.replace('_', ' ') || 'Unknown'}
                  </div>

                  {/* Image */}
                  <div className="relative h-52 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {images[0]
                      ? <img src={images[0]} alt={listing.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      : <div className="flex h-full items-center justify-center text-5xl">📦</div>
                    }
                    {listing.verified && (
                      <span className="absolute top-3 left-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">✓ Verified</span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-1">{listing.category}</p>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-2">{listing.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{listing.description}</p>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                        RWF {listing.price.toLocaleString()}
                      </p>
                      {listing.negotiable && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Negotiable</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/marketplace/seller/${listing.sellerId}`} className="flex items-center gap-1.5 no-underline hover:underline">
                        {listing.seller?.image
                          ? <img src={listing.seller.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                          : <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">{(listing.seller?.name || 'U')[0]}</div>
                        }
                        <span className="text-xs text-slate-500">{listing.seller?.name}</span>
                      </Link>
                    </div>

                    {listing.phone && (() => {
                      const SITE = 'https://kigalitechservices.com';
                      const sellerPrice = listing.price;
                      const msg = `Hi! I'm interested in your listing on KigaliTech Marketplace 👋\n\n*${listing.title}*\nPrice: RWF ${sellerPrice.toLocaleString()}\n\n🔗 ${SITE}/marketplace/${listing.id}\n\nIs this still available?`;
                      return (
                        <a href={`https://wa.me/${listing.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-500 py-2 text-sm font-semibold text-white no-underline hover:bg-emerald-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Contact Seller
                        </a>
                      );
                    })()}
                  </div>
                </article>
              );
            })}
          </div>
          {allListings.length < total && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border-2 border-violet-600 px-8 py-3 text-sm font-semibold text-violet-600 hover:bg-violet-600 hover:text-white disabled:opacity-50 transition"
              >
                {loadingMore ? 'Loading...' : `Load More (${total - allListings.length} remaining)`}
              </button>
            </div>
          )}
          </>
        )}
      </section>
      <TrendingInTech />
    </Layout>
  );
}
