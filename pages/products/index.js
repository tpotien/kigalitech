import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';

const PREFERRED_ORDER = ['Phones','Laptops','TVs','Audio','Wearables','Gaming','Tablets','Cameras','Smart Home','Headphones','Routers','Storage','Accessories','Others'];

const SORT_OPTIONS = [
  { value: 'default',    label: 'Featured' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc',   label: 'Name A–Z' },
  { value: 'newest',     label: 'Newest' },
];

export default function ProductsPage() {
  const router = useRouter();
  const { category: qCat, search: qSearch } = router.query;

  const [categories, setCategories]         = useState([]);
  const [products, setProducts]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sort, setSort]                     = useState('default');
  const [search, setSearch]                 = useState('');
  const [maxPrice, setMaxPrice]             = useState(null);
  const [inStockOnly, setInStockOnly]       = useState(false);
  const initialized = useRef(false);

  // Load categories
  useEffect(() => {
    fetch('/api/products/categories')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const names = data.map(d => d.name);
        const sorted = [...PREFERRED_ORDER.filter(c => names.includes(c)), ...names.filter(c => !PREFERRED_ORDER.includes(c))];
        setCategories(sorted);
      }).catch(() => {});
  }, []);

  // Sync from URL once on mount
  useEffect(() => {
    if (!router.isReady || initialized.current) return;
    if (qCat) setActiveCategory(qCat);
    else if (qSearch) { setSearch(qSearch); setActiveCategory('All'); }
    else setActiveCategory('All');
    initialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Fetch products
  useEffect(() => {
    if (!router.isReady || activeCategory === null) return;
    setLoading(true);
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
    if (search) params.set('search', search);
    fetch(`/api/products?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { if (err.name !== 'AbortError') setLoading(false); });
    return () => controller.abort();
  }, [router.isReady, activeCategory, search]);

  useEffect(() => { setMaxPrice(null); }, [activeCategory]);

  const categoryMax = useMemo(() => products.length > 0 ? Math.ceil(Math.max(...products.map(p => p.price)) / 1000) * 1000 : 500000, [products]);
  const categoryMin = useMemo(() => products.length > 0 ? Math.floor(Math.min(...products.map(p => p.price)) / 1000) * 1000 : 0, [products]);
  const effectiveMax = maxPrice ?? categoryMax;

  let filtered = [...products];
  if (inStockOnly) filtered = filtered.filter(p => p.stock > 0);
  if (effectiveMax < categoryMax) filtered = filtered.filter(p => p.price <= effectiveMax);
  filtered.sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'name_asc')   return a.name.localeCompare(b.name);
    if (sort === 'newest')     return b.id - a.id;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

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
    router.replace({ pathname: '/products', query: q ? { search: q } : {} }, undefined, { shallow: true });
  }

  return (
    <Layout>
      {/* Breadcrumb + header */}
      <div className="max-w-container mx-auto px-4 lg:px-6 py-6">
        <nav className="text-sm text-ex-muted flex gap-2 mb-6">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <span>/</span>
          <span className="text-ex-text">{activeCategory === 'All' ? 'All Products' : (activeCategory || 'Products')}</span>
        </nav>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mb-8">
          <input
            key={search}
            defaultValue={search}
            placeholder="Search products…"
            className="flex-1 border border-ex-border rounded px-4 py-2.5 text-sm text-ex-text outline-none focus:border-primary"
          />
          <button type="submit" className="bg-primary text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-primary-hover transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-8">

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="mb-8">
              <h3 className="font-semibold text-ex-text mb-4 text-sm">Categories</h3>
              <ul className="space-y-2">
                {['All', ...categories].map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => selectCategory(cat)}
                      className={`flex w-full items-center justify-between text-sm py-1.5 transition-colors ${
                        activeCategory === cat ? 'text-primary font-semibold' : 'text-ex-muted hover:text-primary'
                      }`}
                    >
                      {cat === 'All' ? 'All Products' : cat}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price filter */}
            <div className="mb-8">
              <h3 className="font-semibold text-ex-text mb-4 text-sm">Price</h3>
              <input
                type="range"
                min={categoryMin} max={categoryMax}
                step={Math.max(1000, Math.round((categoryMax - categoryMin) / 50 / 1000) * 1000)}
                value={effectiveMax}
                onChange={e => {
                  const v = Number(e.target.value);
                  setMaxPrice(v >= categoryMax ? null : v);
                }}
                disabled={loading || products.length === 0}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-ex-muted mt-2">
                <span>RWF 0</span>
                <span className={maxPrice !== null ? 'text-primary font-semibold' : ''}>
                  RWF {effectiveMax.toLocaleString()}
                </span>
              </div>
              {maxPrice !== null && (
                <button onClick={() => setMaxPrice(null)} className="mt-2 text-xs text-primary underline">Reset</button>
              )}
            </div>

            {/* In stock */}
            <label className="flex items-center gap-2 cursor-pointer text-sm text-ex-text">
              <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} className="accent-primary" />
              In Stock Only
            </label>
          </aside>

          {/* ── Main ── */}
          <div className="flex-1 min-w-0">
            {/* Mobile category scroll */}
            <div className="lg:hidden overflow-x-auto scrollbar-none mb-6 -mx-4 px-4">
              <div className="flex gap-2 min-w-max">
                {['All', ...categories].map(cat => (
                  <button key={cat} onClick={() => selectCategory(cat)}
                    className={`px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap border transition-colors ${
                      activeCategory === cat
                        ? 'bg-primary text-white border-primary'
                        : 'border-ex-border text-ex-muted hover:border-primary hover:text-primary'
                    }`}>
                    {cat === 'All' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort + count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-ex-muted">
                {loading ? 'Loading…' : `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
              </p>
              <select
                value={sort} onChange={e => setSort(e.target.value)}
                className="border border-ex-border rounded px-3 py-2 text-sm text-ex-text outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton aspect-square rounded"/>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-semibold text-ex-text text-lg mb-2">No products found</h3>
                <p className="text-ex-muted text-sm mb-6">Try a different category or search term.</p>
                <button onClick={() => selectCategory('All')} className="btn-primary">View All Products</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
