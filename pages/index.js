import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLang } from '../context/LanguageContext';
import prisma from '../lib/prisma';
import Layout from '../components/Layout';
import SEOMeta from '../components/SEOMeta';
import FlashSaleBanner from '../components/FlashSaleBanner';
import MarqueeBanner from '../components/MarqueeBanner';
import HeroSection from '../components/HeroSection';
import FeaturedCategories from '../components/FeaturedCategories';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import CountdownTimer from '../components/CountdownTimer';
import TrustBadges from '../components/TrustBadges';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';

function parse(val) { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; } }

const SITE_DEFAULTS = {
  flashDealProductId: '', flashDealDiscount: '25', flashDealHours: '8', flashDealLabel: 'Flash Deal — Ends Soon',
  heroBadgeText: 'New Arrivals Just Dropped', heroTitle: 'Tech That\nElevates\nYour Life',
  heroSubtitle: 'Premium electronics — phones, laptops, audio, wearables — with fast delivery, real warranties, and zero compromise.',
  heroImageUrl: '', heroProductId: '', heroPriceLabel: 'Starting from', heroPrice: '$129.99',
};

export async function getStaticProps() {
  const [products, configRows] = await Promise.all([
    prisma.product.findMany({ where: { active: true } }),
    prisma.siteConfig.findMany(),
  ]);
  const siteConfig = { ...SITE_DEFAULTS };
  configRows.forEach(r => { siteConfig[r.key] = r.value; });
  return {
    props: { products: JSON.parse(JSON.stringify(products)), siteConfig },
    revalidate: 15,
  };
}

export default function Home({ products, siteConfig = {} }) {
  const { t } = useLang();
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeColor, setActiveColor] = useState('All');

  // Capture referral code from ?ref= query param
  useEffect(() => {
    const { ref } = router.query;
    if (ref) localStorage.setItem('referralCode', ref);
  }, [router.query]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  // Default to first real category; 'All' is an explicit opt-in
  const [activeCategory, setActiveCategory] = useState(categories[1] || 'All');

  const allColors = useMemo(() => {
    const set = new Set();
    products.forEach((p) => parse(p.colors).forEach((c) => set.add(c)));
    return ['All', ...Array.from(set)].slice(0, 12);
  }, [products]);

  // Flash deal: admin-configured product, or fall back to XM6 / first discounted
  const dealProduct = (siteConfig.flashDealProductId
    ? products.find(p => p.id === Number(siteConfig.flashDealProductId))
    : null)
    || products.find(p => p.name?.includes('XM6'))
    || products.find(p => p.comparePrice && p.comparePrice > p.price)
    || products[0];

  const filtered = useMemo(() => products.filter((p) => {
    const catOk = activeCategory === 'All' || p.category === activeCategory;
    const colorOk = activeColor === 'All' || parse(p.colors).includes(activeColor);
    return catOk && colorOk;
  }), [products, activeCategory, activeColor]);

  return (
    <Layout>
      <SEOMeta
        title="KigaliTech — Premium Electronics in Rwanda"
        url="https://electronics-shop-amber.vercel.app"
      />
      <FlashSaleBanner />
      <MarqueeBanner />
      <HeroSection config={siteConfig} />
      <TrustBadges />
      <FeaturedCategories />

      <CountdownTimer
        product={dealProduct}
        discount={Number(siteConfig.flashDealDiscount) || 25}
        hours={Number(siteConfig.flashDealHours) || 8}
        label={siteConfig.flashDealLabel || 'Flash Deal — Ends Soon'}
      />

      {/* Product Grid */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">{t('categories')}</p>
              <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">{t('featuredProducts')}</h2>
            </div>
            <p className="text-sm text-slate-500">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => {
              const isAll = cat === 'All';
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-200'
                      : isAll
                        ? 'border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-300 hover:text-sky-700'
                  }`}
                >
                  {isAll ? 'Show All' : cat}
                </button>
              );
            })}
          </div>

          {/* Color filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">{t('color')}:</span>
            {allColors.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeColor === color
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                {color !== 'All' && (
                  <span className="h-3 w-3 rounded-full border border-slate-200 dark:border-slate-700 inline-block flex-shrink-0" style={{ backgroundColor: colorHex(color) }} />
                )}
                {color}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-slate-400">{t('noResults')}</div>
        )}
      </section>

      {/* Reviews */}
      <section className="bg-white dark:bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">{t('reviews')}</p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">{t('customersReviews')}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.name} className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-6">
                <div className="flex text-amber-400">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-3 text-slate-700 dark:text-slate-300 leading-relaxed">"{r.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sm font-bold text-sky-600 dark:text-sky-400">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.product}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </Layout>
  );
}

const REVIEWS = [
  { name: 'Alex M.', stars: 5, text: 'MacBook Pro arrived perfectly packaged. The M3 chip is insanely fast — my whole workflow changed overnight.', product: 'Apple MacBook Pro 14"' },
  { name: 'Sarah K.', stars: 5, text: 'The Sony WH-1000XM5 noise canceling is on another level. I can finally work from home without distractions.', product: 'Sony WH-1000XM5 Headphones' },
  { name: 'James O.', stars: 5, text: 'Galaxy S24 Ultra camera blew me away. The S Pen is a bonus I didn\'t know I needed. Delivery was same day!', product: 'Samsung Galaxy S24 Ultra' },
];

function colorHex(name) {
  const map = { black: '#1e293b', white: '#f8fafc', silver: '#cbd5e1', blue: '#3b82f6', red: '#ef4444', gold: '#f59e0b', 'rose gold': '#fb7185', 'space gray': '#475569', 'space black': '#1e293b', green: '#22c55e', purple: '#a855f7', yellow: '#eab308', pink: '#ec4899', gray: '#6b7280', 'midnight blue': '#1e3a5f', natural: '#d4a76a', violet: '#7c3aed', titanium: '#9ca3af' };
  return map[name.toLowerCase()] || '#94a3b8';
}
