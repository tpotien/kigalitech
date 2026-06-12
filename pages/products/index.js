import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Footer from '../../components/Footer';
import TrendingInTech from '../../components/TrendingInTech';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import { useLang } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

// Categories are loaded dynamically from the DB — see useEffect below

function getSortOptions(t) {
  return [
    { value: 'default',    label: t('featured') },
    { value: 'price_asc',  label: t('priceLow') },
    { value: 'price_desc', label: t('priceHigh') },
    { value: 'name_asc',   label: t('nameAZ') },
    { value: 'newest',     label: t('newest') },
  ];
}

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLang();
  const { format } = useCurrency();
  const SORT_OPTIONS = getSortOptions(t);
  const { category: qCat, sub: qSub, search: qSearch } = router.query;

  const [categories, setCategories]     = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  // null = not yet synced from URL (prevents premature fetch)
  const [activeCategory, setActiveCategory] = useState(null);
  const [sort, setSort]                 = useState('default');
  const [search, setSearch]             = useState('');
  // null = no price cap (slider sits at max)
  const [maxPrice, setMaxPrice]         = useState(null);
  const [inStockOnly, setInStockOnly]   = useState(false);
  const initialized = useRef(false);

  // Natural display order for category tabs
  const PREFERRED_ORDER = ['Phones','Laptops','TVs','Audio','Wearables','Gaming','Tablets','Cameras','Smart Home','Headphones','Routers','Storage','Accessories','Others'];

  // ── 0. Load categories from DB in preferred display order ─────────────────
  useEffect(() => {
    fetch('/api/products/categories')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const names = data.map(d => d.name);
        const sorted = [
          ...PREFERRED_ORDER.filter(c => names.includes(c)),
          ...names.filter(c => !PREFERRED_ORDER.includes(c)),
        ];
        setCategories(sorted);
      })
      .catch(() => {});
  }, []);

  // ── 1. Sync from URL ONCE on initial mount only ───────────────────────────
  //    Do NOT add qCat/qSearch to deps — tab clicks update the URL via
  //    router.replace, which would re-fire this effect and overwrite
  //    the local activeCategory state (causing the "always Accessories" bug).
  useEffect(() => {
    if (!router.isReady || initialized.current) return;
    if (qCat) {
      setActiveCategory(qCat);
    } else if (qSearch) {
      setSearch(qSearch);
      setActiveCategory('All');
    } else {
      setActiveCategory('All');
    }
    initialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // ── 2. Reset price filter whenever category changes ───────────────────────
  useEffect(() => {
    setMaxPrice(null);
  }, [activeCategory]);

  // ── 3. Fetch products — only after activeCategory is known ────────────────
  //    AbortController cancels any in-flight request so the last
  //    requested category always wins, regardless of response order.
  useEffect(() => {
    if (!router.isReady || activeCategory === null) return;

    setLoading(true);
    const controller = new AbortController();

    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
    if (search) params.set('search', search);

    fetch(`/api/products?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false);
      });

    return () => controller.abort();
  }, [router.isReady, activeCategory, search]);

  // ── Derived: max price in current category's products ────────────────────
  const categoryMax = useMemo(
    () => products.length > 0 ? Math.ceil(Math.max(...products.map(p => p.price)) / 1000) * 1000 : 500000,
    [products]
  );
  const categoryMin = useMemo(
    () => products.length > 0 ? Math.floor(Math.min(...products.map(p => p.price)) / 1000) * 1000 : 0,
    [products]
  );

  // Effective price ceiling (null means no filter → show all)
  const effectiveMax = maxPrice ?? categoryMax;

  // ── Filtering + sorting ───────────────────────────────────────────────────
  let filtered = [...products];
  if (inStockOnly) filtered = filtered.filter(p => p.stock > 0);
  if (effectiveMax < categoryMax) filtered = filtered.filter(p => p.price <= effectiveMax);
  if (qSub) filtered = filtered.filter(p => p.subcategory === qSub);

  filtered.sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'name_asc')   return a.name.localeCompare(b.name);
    if (sort === 'newest')     return b.id - a.id;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // ── Navigation helpers ────────────────────────────────────────────────────
  function selectCategory(cat) {
    setActiveCategory(cat);
    const q = {};
    if (cat !== 'All') q.category = cat;
    if (search) q.search = search;
    router.replace({ pathname: '/products', query: q }, undefined, { shallow: true });
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = e.target.querySelector('input').value.trim();
    setSearch(q);
    if (!q) {
      const query = {};
      if (activeCategory && activeCategory !== 'All') query.category = activeCategory;
      router.replace({ pathname: '/products', query }, undefined, { shallow: true });
    } else {
      router.replace({ pathname: '/products', query: { search: q } }, undefined, { shallow: true });
    }
  }

  function clearAllFilters() {
    selectCategory('All');
    setSearch('');
    setInStockOnly(false);
    setMaxPrice(null);
  }

  return (
    <Layout>
      {/* Hero bar */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-900 py-8 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-extrabold text-white mb-4">
            {activeCategory === 'All' ? t('allProducts') : (activeCategory || t('allProducts'))}
            {qSub && <span className="text-sky-300 text-lg font-semibold ml-2">· {qSub}</span>}
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
            <input
              key={search}
              defaultValue={search}
              placeholder={`${t('search')}...`}
              className="flex-1 rounded-full bg-white/10 border border-white/20 px-5 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:bg-white/20"
            />
            <button type="submit" className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-400">
              {t('search')}
            </button>
          </form>
        </div>
      </div>

      {/* Category tabs — full-width scroll container (no max-w constraint) */}
      <div className="sticky top-16 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 min-w-max">
            {/* Show All tab */}
            <button
              onClick={() => selectCategory('All')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'All'
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400'
              }`}
            >
              Show All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* In-stock filter */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="accent-sky-600"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('inStockOnly')}</span>
            </label>

            {/* Price range slider */}
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">
                <span className="text-slate-500 dark:text-slate-400">{t('maxPrice')}: </span>
                <span className={`font-semibold tabular-nums ${maxPrice !== null ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {format(effectiveMax)}
                </span>
              </span>
              <input
                type="range"
                min={categoryMin}
                max={categoryMax}
                step={Math.max(1000, Math.round((categoryMax - categoryMin) / 50 / 1000) * 1000)}
                value={effectiveMax}
                onChange={e => {
                  const v = Number(e.target.value);
                  if (v >= categoryMax) {
                    setMaxPrice(null);
                  } else {
                    setMaxPrice(v);
                    setSort('price_asc');
                  }
                }}
                disabled={loading || products.length === 0}
                className="w-32 accent-sky-600 cursor-pointer"
              />
              {maxPrice !== null && (
                <button
                  onClick={() => { setMaxPrice(null); setSort('default'); }}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  title="Reset price filter"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Sort + count */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{loading ? '…' : `${filtered.length} products`}</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-white outline-none focus:border-sky-400"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-4xl">🔍</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('noResults')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{t('tryDifferent')}</p>
            <button
              onClick={clearAllFilters}
              className="mt-6 rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              {t('clearFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <TrendingInTech />
      <Footer />
    </Layout>
  );
}
