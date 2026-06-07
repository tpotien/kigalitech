import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import { useLang } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

const CATEGORIES = ['All', 'Phones', 'Laptops', 'TVs', 'Audio', 'Wearables', 'Gaming', 'Tablets', 'Cameras', 'Accessories', 'Smart Home'];
function getSortOptions(t) {
  return [
    { value: 'default', label: t('featured') },
    { value: 'price_asc', label: t('priceLow') },
    { value: 'price_desc', label: t('priceHigh') },
    { value: 'name_asc', label: t('nameAZ') },
    { value: 'newest', label: t('newest') },
  ];
}

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLang();
  const { format } = useCurrency();
  const SORT_OPTIONS = getSortOptions(t);
  const { category: qCat, sub: qSub, search: qSearch } = router.query;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to 'Phones'; only 'All' when explicitly chosen via the tab
  const [activeCategory, setActiveCategory] = useState('Phones');
  const [sort, setSort] = useState('default');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Sync from URL query params on load
  useEffect(() => {
    if (!router.isReady) return;
    if (qCat) setActiveCategory(qCat);          // URL category wins
    else if (!qSearch) setActiveCategory('Phones'); // default when no query
    if (qSearch) { setSearch(qSearch); setActiveCategory('All'); } // search shows all
  }, [router.isReady, qCat, qSearch]);

  // Update URL when category changes so tabs are deep-linkable
  function selectCategory(cat) {
    setActiveCategory(cat);
    const q = {};
    if (cat !== 'All') q.category = cat;
    if (search) q.search = search;
    router.replace({ pathname: '/products', query: q }, undefined, { shallow: true });
  }

  useEffect(() => {
    if (!router.isReady) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
    if (search) params.set('search', search);
    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router.isReady, activeCategory, search]);

  let filtered = [...products];
  if (inStockOnly) filtered = filtered.filter(p => p.stock > 0);
  if (maxPrice < 500000) filtered = filtered.filter(p => p.price <= maxPrice);
  if (qSub) filtered = filtered.filter(p => p.subcategory === qSub);

  filtered.sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'name_asc') return a.name.localeCompare(b.name);
    if (sort === 'newest') return b.id - a.id;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  function handleSearch(e) {
    e.preventDefault();
    const q = e.target.querySelector('input').value;
    setSearch(q);
  }

  return (
    <Layout>
      {/* Hero bar */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-900 py-8 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-extrabold text-white mb-4">
            {activeCategory === 'All' ? t('allProducts') : activeCategory}
            {qSub && <span className="text-sky-300 text-lg font-semibold ml-2">· {qSub}</span>}
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
            <input
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

      {/* Category tabs */}
      <div className="sticky top-16 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map(cat => {
              const isAll = cat === 'All';
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-sky-600 text-white'
                      : isAll
                        ? 'border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {isAll ? 'Show All' : cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* In-stock filter */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} className="accent-sky-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('inStockOnly')}</span>
            </label>

            {/* Max price */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">{t('maxPrice')}: {format(maxPrice)}</span>
              <input
                type="range"
                min={1000}
                max={500000}
                step={1000}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-28 accent-sky-600"
              />
            </div>
          </div>

          {/* Sort + count */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{filtered.length} products</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-white dark:placeholder-slate-400 outline-none focus:border-sky-400"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 text-5xl">🔍</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('noResults')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{t('tryDifferent')}</p>
            <button onClick={() => { selectCategory('Phones'); setSearch(''); setInStockOnly(false); setMaxPrice(500000); }} className="mt-6 rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
              {t('clearFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </Layout>
  );
}
