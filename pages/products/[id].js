import { useState, useEffect } from 'react';
import Head from 'next/head';
import prisma from '../../lib/prisma';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useSession } from 'next-auth/react';
import { useLang } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';

export async function getStaticPaths() {
  const products = await prisma.product.findMany({ where: { active: true } });
  return { paths: products.map((p) => ({ params: { id: String(p.id) } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const product = await prisma.product.findUnique({ where: { id: Number(params.id) } });
  if (!product) return { notFound: true };

  // Fetch bundled products
  let bundledProducts = [];
  try {
    const bundledIds = JSON.parse(product.bundledWith || '[]');
    if (bundledIds.length) {
      bundledProducts = await prisma.product.findMany({
        where: { id: { in: bundledIds.map(Number) }, active: true },
        select: { id: true, name: true, price: true, comparePrice: true, images: true, category: true, brand: true, stock: true, featured: true, description: true, colors: true, storageOptions: true, genuine: true, lowStockThreshold: true },
      });
    }
  } catch {}

  return {
    props: {
      product: JSON.parse(JSON.stringify(product)),
      bundledProducts: JSON.parse(JSON.stringify(bundledProducts)),
    },
    revalidate: 60,
  };
}

function parseField(val) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoPlayer({ url }) {
  const [show, setShow] = useState(false);
  const ytId = getYouTubeId(url);

  if (!ytId && !url) return null;

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
      {!show ? (
        <button
          onClick={() => setShow(true)}
          className="relative w-full group"
        >
          <img
            src={ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined}
            alt="Product video"
            className="h-48 w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-slate-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            ▶ Product Video
          </div>
        </button>
      ) : (
        <div className="relative">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="h-56 w-full"
            />
          ) : (
            <video src={url} controls autoPlay className="h-56 w-full object-cover" />
          )}
          <button
            onClick={() => setShow(false)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function StarRating({ rating, onChange, size = 5 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={onChange ? 'button' : 'span'}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`text-${size === 5 ? 'xl' : 'base'} transition ${
            star <= (hover || rating) ? 'text-amber-400' : 'text-slate-200'
          } ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ productId }) {
  const { data: session } = useSession();
  const [data, setData] = useState({ reviews: [], avg: null, count: 0 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`).then(r => r.json()).then(setData);
  }, [productId]);

  async function submitReview(e) {
    e.preventDefault();
    if (!form.rating) { setMsg('Please select a star rating'); return; }
    setSubmitting(true);
    setMsg('');
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, ...form }),
    });
    const result = await res.json();
    if (res.ok) {
      setData(prev => ({ ...prev, reviews: [result, ...prev.reviews], count: prev.count + 1 }));
      setShowForm(false);
      setForm({ rating: 0, title: '', body: '' });
      setMsg('Review submitted!');
    } else {
      setMsg(result.error || 'Failed to submit');
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Reviews</h2>
          {data.avg && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={Math.round(Number(data.avg))} size={4} />
              <span className="text-sm font-semibold text-slate-700">{data.avg} out of 5</span>
              <span className="text-sm text-slate-400">({data.count} reviews)</span>
            </div>
          )}
        </div>
        {session && !showForm && (
          <button onClick={() => setShowForm(true)} className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Write a Review
          </button>
        )}
        {!session && (
          <Link href="/signin" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 no-underline">
            Sign in to review
          </Link>
        )}
      </div>

      {msg && (
        <p className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-medium ${msg.includes('submitted') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{msg}</p>
      )}

      {showForm && (
        <form onSubmit={submitReview} className="mt-6 space-y-4 rounded-2xl border border-slate-100 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Your Rating *</label>
            <StarRating rating={form.rating} onChange={r => setForm({ ...form, rating: r })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Review Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Summarize your experience" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Review *</label>
            <textarea required rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Tell other shoppers what you think..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {data.reviews.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="mt-6 space-y-5 divide-y divide-slate-50">
          {data.reviews.map(review => (
            <div key={review.id} className="pt-5 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {review.user?.image
                    ? <img src={review.user.image} alt="" className="h-9 w-9 rounded-full" />
                    : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">{(review.user?.name || 'A')[0].toUpperCase()}</div>
                  }
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.user?.name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={4} />
                      {review.verified && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Verified Purchase</span>}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <h4 className="mt-2 font-semibold text-slate-800">{review.title}</h4>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductPage({ product, bundledProducts = [] }) {
  const { addItem } = useCart();
  const { t } = useLang();
  const { format } = useCurrency();
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const { add: addCompare, remove: removeCompare, has: inCompare } = useCompare();
  const { data: session } = useSession();

  const colors = parseField(product.colors);
  const storageOptions = parseField(product.storageOptions);
  const warrantyOptions = parseField(product.warrantyOptions);
  const specs = typeof product.specs === 'object' && !Array.isArray(product.specs)
    ? product.specs
    : (() => { try { return JSON.parse(product.specs); } catch { return {}; } })();
  const colorStock = (() => { try { return JSON.parse(product.colorStock || '{}'); } catch { return {}; } })();
  const storageStock = (() => { try { return JSON.parse(product.storageStock || '{}'); } catch { return {}; } })();

  const [color, setColor] = useState(colors[0] || '');
  const [storage, setStorage] = useState(storageOptions[0] || '');
  const [warranty, setWarranty] = useState(warrantyOptions[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [recs, setRecs] = useState([]);

  const colorAvailable = (c) => colorStock[c] === undefined || colorStock[c] > 0;
  const storageAvailable = (s) => storageStock[s] === undefined || storageStock[s] > 0;
  const colorQty = (c) => colorStock[c];
  const storageQty = (s) => storageStock[s];

  const images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
  const isTV = product.category === 'TVs' || product.hasTvInstall;
  const isWished = wishlistIds.has(product.id);
  const isCompared = inCompare(product.id);

  useEffect(() => {
    fetch(`/api/recommendations?productId=${product.id}&category=${encodeURIComponent(product.category)}&priceMin=${product.price * 0.5}&priceMax=${product.price * 1.5}`)
      .then(r => r.json()).then(setRecs).catch(() => {});
  }, [product.id]);

  function handleAddToCart() {
    addItem({ id: product.id, name: product.name, price: product.price, image: images[0], color, storage, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  async function handleWishlist() {
    if (!session) { window.location.href = '/signin'; return; }
    setHeartAnim(true);
    await toggleWishlist(product.id);
    setTimeout(() => setHeartAnim(false), 600);
  }

  // SEO
  const metaTitle = `${product.name} — KigaliTech`;
  const metaDesc = product.description?.slice(0, 155) || `Buy ${product.name} at KigaliTech Rwanda. ${product.category} products at the best prices.`;
  const metaImage = images[0] || '';
  const canonicalUrl = `${process.env.NEXTAUTH_URL || 'https://kigalitech.com'}/products/${product.id}`;

  return (
    <Layout>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:price:amount" content={(product.price / 100).toFixed(2)} />
        <meta property="og:price:currency" content="USD" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={metaImage} />
      </Head>
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-sky-600">Home</Link>
            <span>/</span>
            <Link href={`/products?category=${product.category}`} className="hover:text-sky-600">{product.category}</Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">{product.name}</span>
          </nav>

          <div className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.9fr]">
              {/* Images + Video */}
              <div>
                <div className="overflow-hidden rounded-3xl bg-slate-100 relative">
                  {product.genuine !== false && (
                    <span className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Original / Genuine
                    </span>
                  )}
                  <img
                    src={images[activeImg]}
                    alt={product.name}
                    className="h-96 w-full object-cover transition-opacity duration-300"
                  />
                </div>

                {images.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`overflow-hidden rounded-2xl border-2 transition ${activeImg === i ? 'border-sky-500' : 'border-transparent'}`}
                      >
                        <img src={src} alt="" className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Product Video */}
                {product.videoUrl && <VideoPlayer url={product.videoUrl} />}
              </div>

              {/* Details */}
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">{product.category}</p>
                    {product.subcategory && <span className="text-xs text-slate-400">· {product.subcategory}</span>}
                  </div>
                  <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{product.name}</h1>
                  <p className="mt-3 text-slate-600 leading-relaxed">{product.description}</p>
                </div>

                {/* Price + stock */}
                <div className="rounded-2xl bg-slate-50 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Price</p>
                    <p className="text-3xl font-extrabold text-slate-900">{format(product.price)}</p>
                    {product.comparePrice && (
                      <p className="text-sm text-slate-400 line-through">{format(product.comparePrice)}</p>
                    )}
                  </div>
                  <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    product.stock === 0 ? 'bg-red-100 text-red-600'
                    : product.stock <= 5 ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock'}
                  </div>
                </div>

                {/* Color */}
                {colors.length > 0 && (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm text-slate-500 mb-3">{t('color')}: <span className="font-semibold text-slate-700">{color}</span></p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => {
                        const avail = colorAvailable(c);
                        const qty = colorQty(c);
                        return (
                          <button key={c} onClick={() => avail && setColor(c)} disabled={!avail}
                            title={!avail ? 'Out of stock' : qty !== undefined ? `${qty} in stock` : undefined}
                            className={`relative rounded-full border px-4 py-2 text-sm font-medium transition ${
                              !avail ? 'border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed'
                              : color === c ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400'
                            }`}
                          >
                            {c}
                            {avail && qty !== undefined && qty <= 3 && <span className="absolute -top-2 -right-1 rounded-full bg-amber-400 px-1 text-[9px] font-bold text-white">{qty}</span>}
                            {!avail && <span className="absolute -top-2 -right-2 rounded-full bg-red-400 px-1 text-[9px] font-bold text-white">0</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Storage */}
                {storageOptions.length > 1 && (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm text-slate-500 mb-3">{t('storage')}</p>
                    <div className="flex flex-wrap gap-2">
                      {storageOptions.map((s) => {
                        const avail = storageAvailable(s);
                        const qty = storageQty(s);
                        return (
                          <button key={s} onClick={() => avail && setStorage(s)} disabled={!avail}
                            title={!avail ? 'Out of stock' : qty !== undefined ? `${qty} in stock` : undefined}
                            className={`relative rounded-full border px-4 py-2 text-sm font-medium transition ${
                              !avail ? 'border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed'
                              : storage === s ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400'
                            }`}
                          >
                            {s}
                            {avail && qty !== undefined && qty <= 3 && <span className="absolute -top-2 -right-1 rounded-full bg-amber-400 px-1 text-[9px] font-bold text-white">{qty}</span>}
                            {!avail && <span className="absolute -top-2 -right-2 rounded-full bg-red-400 px-1 text-[9px] font-bold text-white">0</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Warranty */}
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm text-slate-500 mb-3">Warranty</p>
                  <div className="flex flex-wrap gap-2">
                    {warrantyOptions.map((w) => (
                      <button key={w} onClick={() => setWarranty(w)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${warranty === w ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TV Installation callout */}
                {isTV && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">📺</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Professional Installation Available</p>
                        <p className="text-xs text-amber-700 mt-0.5">Add certified wall mounting & cable management at checkout. A technician comes to your address.</p>
                        <p className="text-xs font-bold text-amber-800 mt-1">Installation fee: {format(5000)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Installments callout */}
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">💳</span>
                    <div>
                      <p className="text-sm font-semibold text-sky-900">Pay in Installments</p>
                      <p className="text-xs text-sky-700 mt-0.5">Split into 3, 6 or 12 monthly payments — choose at checkout.</p>
                      <p className="text-xs text-sky-600 mt-1">From <span className="font-bold">{format(Math.ceil(product.price / 3))}/mo</span> over 3 months</p>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm text-slate-500 mb-3">Specifications</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-widest text-slate-400">{key}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade-in callout */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">♻️</span>
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">Have an old device?</p>
                        <p className="text-xs text-emerald-700">Trade it in and get a discount on this product.</p>
                      </div>
                    </div>
                    <Link href="/trade-in" className="flex-shrink-0 rounded-full border border-emerald-300 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 no-underline">
                      Trade In →
                    </Link>
                  </div>
                </div>

                {/* Qty + CTA */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-slate-200">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-slate-500 hover:text-slate-900">−</button>
                    <span className="min-w-[3rem] text-center font-semibold">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-slate-500 hover:text-slate-900">+</button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 rounded-full py-3.5 font-semibold text-white transition-all ${
                      product.stock === 0 ? 'bg-slate-300 cursor-not-allowed'
                      : added ? 'bg-emerald-500'
                      : 'bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-lg shadow-sky-200'
                    }`}
                  >
                    {product.stock === 0 ? 'Out of Stock' : added ? '✓ Added to Cart' : 'Add to Cart'}
                  </button>
                </div>

                {/* Wishlist + Compare row */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleWishlist}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-all ${
                      isWished
                        ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                        : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                    } ${heartAnim ? 'scale-105' : ''}`}
                  >
                    <svg className="h-4 w-4" fill={isWished ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isWished ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={() => isCompared ? removeCompare(product.id) : addCompare(product)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-all ${
                      isCompared
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {isCompared ? '✓ Comparing' : 'Compare'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bundled / Frequently Bought Together */}
          {bundledProducts.length > 0 && (
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl">🛍️</span>
                <div>
                  <h2 className="font-bold text-slate-900">Frequently Bought Together</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Customers who buy this also pick these</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bundledProducts.map(bp => {
                  const bImgs = (() => { try { return JSON.parse(bp.images); } catch { return []; } })();
                  return (
                    <Link key={bp.id} href={`/products/${bp.id}`} className="group flex items-center gap-4 rounded-2xl border border-slate-100 p-3 no-underline hover:border-sky-200 hover:bg-sky-50 transition-all">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {bImgs[0] && <img src={bImgs[0]} alt={bp.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-sky-700">{bp.name}</p>
                        <p className="text-sm font-bold text-sky-600 mt-0.5">{format(bp.price)}</p>
                      </div>
                      <span className="text-slate-300 group-hover:text-sky-400">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ReviewsSection productId={product.id} />

          {/* AI Recommendations */}
          {recs.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">You Might Also Like</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Similar Products</h2>
                </div>
                <Link href={`/products?category=${product.category}`} className="text-sm font-medium text-sky-600 hover:text-sky-800 no-underline">
                  View all {product.category} →
                </Link>
              </div>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {recs.slice(0, 6).map(rec => (
                  <ProductCard key={rec.id} product={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
