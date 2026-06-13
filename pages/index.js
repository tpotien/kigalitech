import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import prisma from '../lib/prisma';
import Layout from '../components/Layout';
import SEOMeta from '../components/SEOMeta';
import ProductCard from '../components/ProductCard';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function parse(val) { try { return typeof val === 'string' ? JSON.parse(val) : (val || []); } catch { return []; } }
function firstImage(p) { try { return (JSON.parse(p.images)||[]).find(i=>i&&i.length>5&&!i.startsWith('data:'))||''; } catch { return ''; } }
function trimImages(products) { return products.map(p=>({...p,images:JSON.stringify([firstImage(p)])})); }

const SITE_DEFAULTS = {
  flashDealProductId:'',flashDealDiscount:'25',flashDealHours:'8',
  heroTitle:'Up To 10% Off\nLatest Electronics',heroSubtitle:'Phones, Laptops, Audio & More',
  heroImageUrl:'',heroPrice:'',heroPriceLabel:'Starting from',
};

export async function getStaticProps() {
  const [products, configRows] = await Promise.all([
    prisma.product.findMany({
      where:{active:true}, take:40,
      select:{id:true,name:true,price:true,comparePrice:true,images:true,
              category:true,brand:true,stock:true,featured:true,
              flashSalePrice:true,flashSaleEnd:true,lowStockThreshold:true},
    }),
    prisma.siteConfig.findMany({where:{key:{in:Object.keys(SITE_DEFAULTS)}}}),
  ]);
  const siteConfig={...SITE_DEFAULTS};
  configRows.forEach(r=>{siteConfig[r.key]=r.value;});
  return {
    props:{products:JSON.parse(JSON.stringify(trimImages(products))),siteConfig},
    revalidate:60,
  };
}

/* ── Countdown ───────────────────────────────────────────────────────────── */
function useCountdown(endMs) {
  const calc = useCallback(() => {
    if (!endMs) return null;
    const d = endMs - Date.now();
    if (d <= 0) return null;
    return {
      days: String(Math.floor(d / 86400000)).padStart(2, '0'),
      h:    String(Math.floor((d % 86400000) / 3600000)).padStart(2, '0'),
      m:    String(Math.floor((d % 3600000) / 60000)).padStart(2, '0'),
      s:    String(Math.floor((d % 60000) / 1000)).padStart(2, '0'),
    };
  }, [endMs]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    if (!endMs) return;
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [endMs, calc]);
  return t;
}

/* ── Section Label ───────────────────────────────────────────────────────── */
function SectionLabel({ sub, title, action }) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-10 rounded bg-primary block" />
          <span className="text-primary font-semibold text-sm">{sub}</span>
        </div>
        {title && <h2 className="text-3xl font-semibold text-ex-text">{title}</h2>}
      </div>
      {action}
    </div>
  );
}

/* ── Arrow button ────────────────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick }) {
  return (
    <button onClick={onClick}
      className="h-10 w-10 rounded-full border border-ex-border bg-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-colors text-ex-text flex-shrink-0">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

/* ── Data ────────────────────────────────────────────────────────────────── */
const SIDEBAR_CATS = [
  { name: "Woman's Fashion",   href: '/products?category=Fashion',     sub: true },
  { name: "Men's Fashion",     href: '/products?category=Fashion',     sub: true },
  { name: 'Electronics',       href: '/products?category=Electronics'          },
  { name: 'Home & Lifestyle',  href: '/products?category=Smart+Home'           },
  { name: 'Phones & Tablets',  href: '/products?category=Phones'               },
  { name: 'Laptops',           href: '/products?category=Laptops'              },
  { name: 'Gaming & Console',  href: '/products?category=Gaming'               },
  { name: 'Audio',             href: '/products?category=Audio'                },
  { name: 'Cameras',           href: '/products?category=Cameras'              },
  { name: 'Wearables',         href: '/products?category=Wearables'            },
  { name: 'Accessories',       href: '/products?category=Accessories'          },
];

const CATEGORY_ICONS = [
  { name: 'Phones',      href: '/products?category=Phones',      emoji: '📱' },
  { name: 'Computers',   href: '/products?category=Laptops',     emoji: '💻' },
  { name: 'Smart Home',  href: '/products?category=Smart+Home',  emoji: '🏠' },
  { name: 'Cameras',     href: '/products?category=Cameras',     emoji: '📷' },
  { name: 'Headphones',  href: '/products?category=Headphones',  emoji: '🎧' },
  { name: 'Gaming',      href: '/products?category=Gaming',      emoji: '🎮' },
  { name: 'Wearables',   href: '/products?category=Wearables',   emoji: '⌚' },
  { name: 'Accessories', href: '/products?category=Accessories', emoji: '🔌' },
];

const EXPLORE_CATS = ['All', 'Phones', 'Laptops', 'TVs', 'Audio', 'Gaming'];

const SERVICES = [
  { icon: '🚚', title: 'FREE AND FAST DELIVERY',  desc: 'Free delivery for all orders over RWF 75,000' },
  { icon: '🎧', title: '24/7 CUSTOMER SERVICE',   desc: 'Friendly 24/7 customer support' },
  { icon: '🔒', title: 'MONEY BACK GUARANTEE',    desc: 'We return money within 30 days' },
  { icon: '✅', title: '100% GENUINE',             desc: 'Every product is 100% original with warranty' },
];

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function Home({ products = [], siteConfig = {} }) {
  const router = useRouter();

  useEffect(() => {
    const { ref } = router.query;
    if (ref) localStorage.setItem('referralCode', ref);
  }, [router.query]);

  /* Flash sale countdown */
  const flashEndMs = useMemo(() => {
    const h = Number(siteConfig.flashDealHours) || 8;
    return Date.now() + h * 3600000;
  }, [siteConfig.flashDealHours]);
  const timer = useCountdown(flashEndMs);

  /* Product slices */
  const bestSelling = useMemo(() => [...products].sort((a, b) => (b.featured?1:0)-(a.featured?1:0)).slice(0, 4), [products]);
  const newArrivals = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 4).filter(p => firstImage(p)), [products]);
  const flashItems  = useMemo(() => products.filter(p => p.comparePrice && p.comparePrice > p.price).slice(0, 8), [products]);

  /* Hero slider */
  const heroSlides = useMemo(() => {
    const slides = [];
    if (siteConfig.heroImageUrl) {
      slides.push({ img: siteConfig.heroImageUrl, name: siteConfig.heroTitle || 'KigaliTech', brand: 'KigaliTech', id: null });
    }
    const pool = [...products].filter(p => firstImage(p)).slice(0, 5);
    pool.forEach(p => slides.push({ img: firstImage(p), name: p.name, brand: p.brand, id: p.id }));
    return slides.slice(0, 5);
  }, [products, siteConfig]);

  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const id = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 4500);
    return () => clearInterval(id);
  }, [heroSlides.length]);
  const prevSlide = () => setHeroSlide(s => (s - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setHeroSlide(s => (s + 1) % heroSlides.length);
  const currentSlide = heroSlides[heroSlide] || {};

  /* Explore tab */
  const [exploreTab, setExploreTab] = useState('All');
  const exploreProd = useMemo(() => {
    const base = exploreTab === 'All' ? products : products.filter(p =>
      p.category === exploreTab || p.category.toLowerCase() === exploreTab.toLowerCase()
    );
    return base.slice(0, 8);
  }, [products, exploreTab]);

  /* Flash sale scroll */
  const flashRef = useRef(null);
  const scrollFlash = (dir) => {
    if (flashRef.current) flashRef.current.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' });
  };

  /* Category scroll */
  const catRef = useRef(null);
  const scrollCat = (dir) => {
    if (catRef.current) catRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <Layout>
      <SEOMeta title="KigaliTech — Premium Electronics in Rwanda" url="https://kigalitechservices.com" />

      {/* ══════════════════════════════════════════════════════════════════
          HERO — Category sidebar + Banner
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#1D2026' }} className="text-white">
        <div className="max-w-container mx-auto px-4 lg:px-6">
          <div className="flex min-h-[460px]">

            {/* Left: Category sidebar (desktop only) */}
            <nav className="hidden lg:flex flex-col justify-center w-56 flex-shrink-0 border-r border-gray-700 py-10 pr-8 gap-0.5">
              {SIDEBAR_CATS.map(cat => (
                <Link key={cat.name + cat.href} href={cat.href}
                  className="flex items-center justify-between py-2 px-1 text-sm text-gray-300 hover:text-white transition-colors group rounded">
                  <span>{cat.name}</span>
                  {cat.sub && (
                    <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              ))}
            </nav>

            {/* Right: Hero slider */}
            <div className="flex-1 relative flex items-center py-10 pl-0 lg:pl-10 overflow-hidden min-h-[300px]">
              <div className="flex flex-col sm:flex-row items-center gap-8 w-full">
                {/* Text */}
                <div className="flex-1 text-center sm:text-left z-10">
                  {currentSlide.brand && (
                    <div className="flex items-center gap-2 justify-center sm:justify-start mb-4 text-gray-400 text-sm">
                      <span className="h-1.5 w-6 bg-primary rounded" />
                      <span>{currentSlide.brand}</span>
                    </div>
                  )}
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight mb-5 line-clamp-3">
                    {currentSlide.name || siteConfig.heroTitle}
                  </h1>
                  <Link
                    href={currentSlide.id ? `/products/${currentSlide.id}` : '/products'}
                    className="inline-flex items-center gap-2 text-white border-b-2 border-white pb-0.5 text-sm font-semibold hover:border-primary hover:text-primary transition-colors">
                    Shop Now
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>

                {/* Slide image */}
                {currentSlide.img && (
                  <div className="flex-shrink-0 w-[240px] sm:w-[280px] lg:w-[320px]">
                    <img
                      key={heroSlide}
                      src={currentSlide.img}
                      alt={currentSlide.name || 'Featured'}
                      className="w-full max-h-72 object-contain mx-auto animate-fadeIn"
                    />
                  </div>
                )}
              </div>

              {/* Slider arrows */}
              {heroSlides.length > 1 && (
                <>
                  <button onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {heroSlides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {heroSlides.map((_, i) => (
                    <button key={i} onClick={() => setHeroSlide(i)}
                      className={`rounded-full transition-all ${i === heroSlide ? 'w-5 h-2.5 bg-primary' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-container mx-auto px-4 lg:px-6">

        {/* ══════════════════════════════════════════════════════════════
            FLASH SALES
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-5 h-10 rounded bg-primary block" />
                <span className="text-primary font-semibold text-sm">Today's</span>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <h2 className="text-3xl font-semibold text-ex-text">Flash Sales</h2>
                {timer && (
                  <div className="flex items-end gap-1">
                    {[
                      { label: 'Days',    val: timer.days },
                      { label: 'Hours',   val: timer.h },
                      { label: 'Minutes', val: timer.m },
                      { label: 'Seconds', val: timer.s },
                    ].map((u, i) => (
                      <div key={u.label} className="flex items-end gap-1">
                        <div className="text-center">
                          <div className="text-[10px] text-ex-muted mb-1 font-medium">{u.label}</div>
                          <div className="text-2xl font-bold text-ex-text tabular-nums w-12 h-12 flex items-center justify-center">
                            {u.val}
                          </div>
                        </div>
                        {i < 3 && <span className="text-primary text-xl font-bold pb-1">:</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-end">
              <ArrowBtn dir="left" onClick={() => scrollFlash('left')} />
              <ArrowBtn dir="right" onClick={() => scrollFlash('right')} />
            </div>
          </div>

          {/* Flash product scroll */}
          <div ref={flashRef} className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-2 px-2">
            {(flashItems.length > 0 ? flashItems : products.slice(0, 8)).map(p => (
              <div key={p.id} className="flex-shrink-0 w-[230px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/products" className="btn-primary inline-block px-16">View All Products</Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            BROWSE BY CATEGORY
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-5 h-10 rounded bg-primary block" />
                <span className="text-primary font-semibold text-sm">Categories</span>
              </div>
              <h2 className="text-3xl font-semibold text-ex-text">Browse By Category</h2>
            </div>
            <div className="flex items-center gap-3">
              <ArrowBtn dir="left" onClick={() => scrollCat('left')} />
              <ArrowBtn dir="right" onClick={() => scrollCat('right')} />
            </div>
          </div>

          <div ref={catRef} className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-2 px-2 lg:overflow-visible lg:grid lg:grid-cols-8">
            {CATEGORY_ICONS.map(cat => (
              <Link key={cat.name} href={cat.href}
                className="flex-shrink-0 w-[130px] lg:w-auto flex flex-col items-center justify-center gap-3 py-6 rounded border border-ex-border hover:border-primary hover:bg-primary hover:text-white transition-all group text-ex-text">
                <span className="text-4xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            BEST SELLING PRODUCTS
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <SectionLabel
            sub="This Month"
            title="Best Selling Products"
            action={
              <Link href="/products" className="btn-primary text-sm mb-0.5">View All</Link>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bestSelling.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            PROMOTIONAL BANNER
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <div className="rounded-lg overflow-hidden relative flex flex-col sm:flex-row items-center" style={{ background: '#1D2026', minHeight: 280 }}>
            {/* Decorative circles */}
            <div className="absolute right-40 top-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full opacity-10" style={{ background: 'white' }} />
            <div className="absolute right-52 top-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full opacity-10" style={{ background: 'white' }} />

            <div className="flex-1 p-10 lg:p-14 z-10">
              <p className="text-primary font-semibold text-sm mb-3 tracking-wide">Rwanda's #1 Tech Store</p>
              <h2 className="text-white text-3xl lg:text-4xl font-semibold mb-6 leading-snug">
                Enhance Your Tech<br />Experience
              </h2>
              <div className="flex gap-5 mb-8">
                {[
                  { c: '#00FF66', label: 'Genuine' },
                  { c: '#DB4444', label: 'Warranty' },
                  { c: '#55ACEE', label: 'Fast Delivery' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5">
                    <span className="h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white/20" style={{ background: b.c }} />
                    <span className="text-xs text-gray-300 font-medium">{b.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/products" className="btn-primary inline-block">Shop Now</Link>
            </div>

            {products[0] && firstImage(products[0]) && (
              <div className="hidden sm:flex flex-shrink-0 pr-14 items-center">
                <img src={firstImage(products[0])} alt="" className="h-56 object-contain" />
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            EXPLORE OUR PRODUCTS
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-5 h-10 rounded bg-primary block" />
                <span className="text-primary font-semibold text-sm">Our Products</span>
              </div>
              <h2 className="text-3xl font-semibold text-ex-text">Explore Our Products</h2>
            </div>
            {/* Category tabs */}
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {EXPLORE_CATS.map(cat => (
                <button key={cat} onClick={() => setExploreTab(cat)}
                  className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors ${
                    exploreTab === cat ? 'border-primary text-primary' : 'border-transparent text-ex-muted hover:text-ex-text'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {exploreProd.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          <div className="text-center">
            <Link href="/products" className="btn-primary inline-block px-16">View All Products</Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            NEW ARRIVAL
        ══════════════════════════════════════════════════════════════ */}
        {newArrivals.length >= 2 && (
          <section className="py-14 border-b border-ex-border">
            <SectionLabel sub="Featured" title="New Arrival" />

            {/*
              Exclusive grid layout:
              ┌─────────────────┬──────────────────────┐
              │                 │   Top-right (wide)   │
              │   Left (large)  ├───────────┬──────────┤
              │                 │ Bot-left  │ Bot-right│
              └─────────────────┴───────────┴──────────┘
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── Left large card (dark) ── */}
              <Link
                href={`/products/${newArrivals[0].id}`}
                className="group relative overflow-hidden rounded flex items-end"
                style={{ background: '#1D2026', minHeight: 560 }}
              >
                {firstImage(newArrivals[0]) && (
                  <img
                    src={firstImage(newArrivals[0])}
                    alt={newArrivals[0].name}
                    className="absolute inset-0 w-full h-full object-contain p-10 group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {/* Text overlay */}
                <div className="relative z-10 p-8 text-white">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">
                    {newArrivals[0].brand || newArrivals[0].category}
                  </p>
                  <h3 className="font-semibold text-2xl mb-3 leading-snug line-clamp-2">
                    {newArrivals[0].name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium border-b border-white pb-0.5 hover:border-primary hover:text-primary transition-colors">
                    Shop Now
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>

              {/* ── Right column: top wide + bottom two ── */}
              <div className="flex flex-col gap-4">

                {/* Top-right card (light) */}
                {newArrivals[1] && (
                  <Link
                    href={`/products/${newArrivals[1].id}`}
                    className="group relative overflow-hidden rounded flex items-end flex-1"
                    style={{ background: '#F5F5F5', minHeight: 272 }}
                  >
                    {firstImage(newArrivals[1]) && (
                      <img
                        src={firstImage(newArrivals[1])}
                        alt={newArrivals[1].name}
                        className="absolute inset-0 w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="relative z-10 p-6">
                      <p className="text-xs text-ex-muted mb-1 uppercase tracking-widest">
                        {newArrivals[1].brand || newArrivals[1].category}
                      </p>
                      <h3 className="font-semibold text-lg text-ex-text mb-2 line-clamp-1">
                        {newArrivals[1].name}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ex-text border-b border-ex-text pb-0.5 hover:border-primary hover:text-primary transition-colors">
                        Shop Now
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                )}

                {/* Bottom: two side-by-side cards */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {/* Bot-left (dark) */}
                  {newArrivals[2] && (
                    <Link
                      href={`/products/${newArrivals[2].id}`}
                      className="group relative overflow-hidden rounded flex items-end"
                      style={{ background: '#1D2026', minHeight: 272 }}
                    >
                      {firstImage(newArrivals[2]) && (
                        <img
                          src={firstImage(newArrivals[2])}
                          alt={newArrivals[2].name}
                          className="absolute inset-0 w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="relative z-10 p-5 text-white">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">
                          {newArrivals[2].brand || newArrivals[2].category}
                        </p>
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                          {newArrivals[2].name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium border-b border-white pb-0.5 hover:border-primary hover:text-primary transition-colors">
                          Shop Now
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Bot-right (light) */}
                  {newArrivals[3] && (
                    <Link
                      href={`/products/${newArrivals[3].id}`}
                      className="group relative overflow-hidden rounded flex items-end"
                      style={{ background: '#F5F5F5', minHeight: 272 }}
                    >
                      {firstImage(newArrivals[3]) && (
                        <img
                          src={firstImage(newArrivals[3])}
                          alt={newArrivals[3].name}
                          className="absolute inset-0 w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="relative z-10 p-5">
                        <p className="text-xs text-ex-muted mb-1 uppercase tracking-widest">
                          {newArrivals[3].brand || newArrivals[3].category}
                        </p>
                        <h3 className="font-semibold text-sm text-ex-text mb-2 line-clamp-2">
                          {newArrivals[3].name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-ex-text border-b border-ex-text pb-0.5 hover:border-primary hover:text-primary transition-colors">
                          Shop Now
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  )}
                </div>

              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SERVICES BAR
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            {SERVICES.map(s => (
              <div key={s.title} className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-black flex items-center justify-center text-2xl ring-[6px] ring-gray-300 flex-shrink-0">
                  {s.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-ex-text text-sm mb-1">{s.title}</h4>
                  <p className="text-ex-muted text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
