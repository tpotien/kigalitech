import { useState, useEffect, useCallback, useMemo } from 'react';
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
  heroTitle:'Premium Tech\nfor Rwanda',heroSubtitle:'Phones, Laptops, Audio & More',
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

/* ── Countdown hook ──────────────────────────────────────────────────────── */
function useCountdown(endMs) {
  const calc=useCallback(()=>{
    if(!endMs) return null;
    const d=endMs-Date.now();
    if(d<=0) return null;
    return {
      h:String(Math.floor(d/3600000)).padStart(2,'0'),
      m:String(Math.floor((d%3600000)/60000)).padStart(2,'0'),
      s:String(Math.floor((d%60000)/1000)).padStart(2,'0'),
    };
  },[endMs]);
  const [t,setT]=useState(calc);
  useEffect(()=>{if(!endMs) return; const id=setInterval(()=>setT(calc()),1000); return()=>clearInterval(id);},[endMs,calc]);
  return t;
}

/* ── Section label component ─────────────────────────────────────────────── */
function SectionLabel({sub,title}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-5 h-10 rounded bg-primary block"/>
        <span className="text-primary font-semibold text-sm">{sub}</span>
      </div>
      {title && <h2 className="text-3xl font-semibold text-ex-text">{title}</h2>}
    </div>
  );
}

/* ── Category icon grid data ─────────────────────────────────────────────── */
const CATEGORY_ICONS = [
  {name:'Phones',     href:'/products?category=Phones',    emoji:'📱'},
  {name:'Computers',  href:'/products?category=Laptops',   emoji:'💻'},
  {name:'Wearables',  href:'/products?category=Wearables', emoji:'⌚'},
  {name:'Cameras',    href:'/products?category=Cameras',   emoji:'📷'},
  {name:'Headphones', href:'/products?category=Headphones',emoji:'🎧'},
  {name:'Gaming',     href:'/products?category=Gaming',    emoji:'🎮'},
];

const EXPLORE_CATS = ['All','Phones','Laptops','TVs','Audio','Gaming'];

/* ── Services bar ────────────────────────────────────────────────────────── */
const SERVICES = [
  {icon:'🚚',title:'FREE AND FAST DELIVERY',desc:'Free delivery for all orders over RWF 75,000'},
  {icon:'🎧',title:'24/7 CUSTOMER SERVICE',desc:'Friendly 24/7 customer support'},
  {icon:'🔒',title:'MONEY BACK GUARANTEE',desc:'We return money within 30 days'},
  {icon:'✅',title:'100% GENUINE',desc:'Every product is 100% original with warranty'},
];

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Home({products=[],siteConfig={}}) {
  const router=useRouter();

  useEffect(()=>{
    const{ref}=router.query; if(ref) localStorage.setItem('referralCode',ref);
  },[router.query]);

  /* hero countdown */
  const dealProduct=
    (siteConfig.flashDealProductId ? products.find(p=>p.id===Number(siteConfig.flashDealProductId)) : null)
    || products.find(p=>p.flashSaleEnd)
    || products.find(p=>p.comparePrice&&p.comparePrice>p.price)
    || products[0];

  const flashEndMs=useMemo(()=>{
    const h=Number(siteConfig.flashDealHours)||8;
    return Date.now()+h*3600000;
  },[siteConfig.flashDealHours]);

  const timer=useCountdown(flashEndMs);

  /* featured/best/new */
  const featured = useMemo(()=>products.filter(p=>p.featured).slice(0,8),[products]);
  const bestSelling = useMemo(()=>[...products].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)).slice(0,4),[products]);
  const newArrivals = useMemo(()=>[...products].sort((a,b)=>b.id-a.id).slice(0,4),[products]);
  const flashItems = useMemo(()=>products.filter(p=>p.comparePrice&&p.comparePrice>p.price).slice(0,5),[products]);

  /* explore filter */
  const [exploreTab,setExploreTab]=useState('All');
  const exploreProd=useMemo(()=>{
    const base=exploreTab==='All'?products:products.filter(p=>p.category===exploreTab||p.category.toLowerCase()===exploreTab.toLowerCase());
    return base.slice(0,8);
  },[products,exploreTab]);

  /* hero image */
  const heroImg=siteConfig.heroImageUrl||(dealProduct?firstImage(dealProduct):'');
  const heroProduct=dealProduct;

  return (
    <Layout>
      <SEOMeta title="KigaliTech — Premium Electronics in Rwanda" url="https://kigalitechservices.com"/>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{background:'#1D2026'}} className="text-white">
        <div className="max-w-container mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row items-center min-h-[400px] lg:min-h-[500px] py-12 lg:py-0 gap-10 lg:gap-16">

            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              {heroProduct && (
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-4 text-gray-400 text-sm">
                  <img
                    src={firstImage(heroProduct)||'/logo.png'}
                    alt="" className="h-6 w-6 rounded-full object-cover"
                    onError={e=>e.target.style.display='none'}
                  />
                  <span>{heroProduct.brand||'KigaliTech'}</span>
                </div>
              )}
              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight mb-4" style={{whiteSpace:'pre-line'}}>
                {siteConfig.heroTitle||'Premium Tech\nfor Rwanda'}
              </h1>
              <p className="text-gray-400 mb-6 text-sm max-w-sm mx-auto lg:mx-0">{siteConfig.heroSubtitle||'Phones, Laptops, Audio & More — with fast delivery and real warranties.'}</p>
              {siteConfig.heroPrice && (
                <p className="text-sm text-gray-400 mb-2">{siteConfig.heroPriceLabel||'Starting from'} <span className="text-white font-bold text-lg">{siteConfig.heroPrice}</span></p>
              )}
              <div className="flex gap-4 justify-center lg:justify-start flex-wrap">
                <Link href="/products" className="btn-primary inline-block text-center">Shop Now →</Link>
                <Link href="/deals" className="btn-outline inline-block text-center" style={{borderColor:'#fff',color:'#fff'}}>View Deals</Link>
              </div>
            </div>

            {/* Right: hero image */}
            {heroImg && (
              <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md">
                <img src={heroImg} alt={heroProduct?.name||'Featured'} className="w-full object-contain max-h-80 mx-auto"/>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-container mx-auto px-4 lg:px-6">

        {/* ══════════════════════════════════════════════════════════════════
            FLASH SALES
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-5 h-10 rounded bg-primary block"/>
                <span className="text-primary font-semibold text-sm">Today's</span>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <h2 className="text-3xl font-semibold text-ex-text">Flash Sales</h2>
                {timer && (
                  <div className="flex items-center gap-2">
                    {[{label:'Hours',val:timer.h},{label:'Minutes',val:timer.m},{label:'Seconds',val:timer.s}].map((u,i)=>(
                      <div key={u.label} className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="text-[10px] text-ex-muted mb-1">{u.label}</div>
                          <div className="text-2xl font-bold text-ex-text w-14 h-14 flex items-center justify-center rounded" style={{background:'#fff',border:'1px solid #E9E9E9'}}>
                            {u.val}
                          </div>
                        </div>
                        {i<2&&<span className="text-primary text-2xl font-bold mb-2">:</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Link href="/products" className="text-sm font-medium border border-ex-text text-ex-text px-6 py-2 rounded hover:bg-ex-text hover:text-white transition-colors whitespace-nowrap self-start sm:self-end">
              View All
            </Link>
          </div>

          {/* Flash product scroll */}
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-2 px-2">
            {(flashItems.length>0?flashItems:products.slice(0,5)).map(p=>(
              <div key={p.id} className="flex-shrink-0 w-[220px]">
                <ProductCard product={p}/>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            BROWSE BY CATEGORY
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <SectionLabel sub="Categories" title="Browse By Category"/>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {CATEGORY_ICONS.map(cat=>(
              <Link key={cat.name} href={cat.href}
                className="flex flex-col items-center justify-center gap-3 py-6 rounded border border-ex-border hover:border-primary hover:bg-primary hover:text-white transition-all group text-ex-text">
                <span className="text-4xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-center group-hover:text-white">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            BEST SELLING PRODUCTS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <div className="flex items-end justify-between mb-0">
            <SectionLabel sub="This Month" title="Best Selling Products"/>
            <Link href="/products?sort=popular" className="btn-primary text-sm mb-10 self-start mt-14 hidden sm:inline-block">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bestSelling.map(p=><ProductCard key={p.id} product={p}/>)}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            PROMOTIONAL BANNER
        ══════════════════════════════════════════════════════════════════ */}
        {products[0] && (
          <section className="py-14 border-b border-ex-border">
            <div className="rounded-lg overflow-hidden relative flex items-center" style={{background:'#1D2026',minHeight:300}}>
              <div className="flex-1 p-10 lg:p-14 z-10">
                <p className="text-primary font-semibold text-sm mb-3">Rwanda's #1 Tech Store</p>
                <h2 className="text-white text-3xl lg:text-4xl font-semibold mb-4 leading-tight">
                  Enhance Your Tech<br/>Experience
                </h2>
                <div className="flex gap-4 mb-6">
                  {[{c:'#00FF66',label:'Genuine'},{c:'#DB4444',label:'Warranty'},{c:'#55ACEE',label:'Fast Delivery'}].map(b=>(
                    <div key={b.label} className="flex flex-col items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full" style={{background:b.c}}/>
                      <span className="text-xs text-gray-300">{b.label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/products" className="btn-primary inline-block">Shop Now</Link>
              </div>
              {firstImage(products[0]) && (
                <div className="hidden sm:block flex-shrink-0 pr-10">
                  <img src={firstImage(products[0])} alt={products[0].name} className="h-64 object-contain mix-blend-luminosity opacity-80"/>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            EXPLORE OUR PRODUCTS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-14 border-b border-ex-border">
          <SectionLabel sub="Our Products" title="Explore Our Products"/>

          {/* Category tabs */}
          <div className="flex gap-6 mb-8 overflow-x-auto scrollbar-none -mx-1 px-1">
            {EXPLORE_CATS.map(cat=>(
              <button key={cat} onClick={()=>setExploreTab(cat)}
                className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors ${
                  exploreTab===cat ? 'border-primary text-primary' : 'border-transparent text-ex-muted hover:text-ex-text'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {exploreProd.map(p=><ProductCard key={p.id} product={p}/>)}
          </div>
          <div className="text-center">
            <Link href="/products" className="btn-primary inline-block">View All Products</Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            NEW ARRIVAL
        ══════════════════════════════════════════════════════════════════ */}
        {newArrivals.length>=2 && (
          <section className="py-14 border-b border-ex-border">
            <SectionLabel sub="Featured" title="New Arrival"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{minHeight:400}}>
              {/* Large left card */}
              <Link href={`/products/${newArrivals[0].id}`}
                className="group relative rounded-lg overflow-hidden flex items-end p-8"
                style={{background:'#1D2026',minHeight:400}}>
                {firstImage(newArrivals[0])&&(
                  <img src={firstImage(newArrivals[0])} alt={newArrivals[0].name}
                    className="absolute inset-0 w-full h-full object-contain p-8 opacity-80 group-hover:scale-105 transition-transform duration-500"/>
                )}
                <div className="relative z-10 text-white">
                  <h3 className="font-semibold text-xl">{newArrivals[0].name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{newArrivals[0].brand}</p>
                  <p className="text-sm mt-2 font-medium underline">Shop Now</p>
                </div>
              </Link>
              {/* Right: 2 stacked */}
              <div className="grid grid-rows-2 gap-4">
                {newArrivals.slice(1,3).map(p=>(
                  <Link key={p.id} href={`/products/${p.id}`}
                    className="group relative rounded-lg overflow-hidden flex items-end p-6"
                    style={{background:'#F5F5F5'}}>
                    {firstImage(p)&&(
                      <img src={firstImage(p)} alt={p.name}
                        className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"/>
                    )}
                    <div className="relative z-10">
                      <h3 className="font-semibold text-ex-text">{p.name}</h3>
                      <p className="text-sm mt-1 font-medium text-primary underline">Shop Now</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SERVICES BAR
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map(s=>(
              <div key={s.title} className="flex flex-col items-center text-center gap-3">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl ring-8 ring-gray-100">
                  {s.icon}
                </div>
                <h4 className="font-semibold text-ex-text text-sm">{s.title}</h4>
                <p className="text-ex-muted text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
