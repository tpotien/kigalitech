import { useState, useEffect, useRef } from 'react';
import prisma from '../../lib/prisma';
import SEOMeta from '../../components/SEOMeta';
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
import { useToast } from '../../context/ToastContext';
import { useWhatsAppCtx } from '../../context/WhatsAppContext';
import TranslatedText from '../../components/TranslatedText';
import StockAlertButton from '../../components/StockAlertButton';
import ProductQA from '../../components/ProductQA';

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
  // Image upload state
  const [reviewImages, setReviewImages] = useState([]); // [{ dataUrl, url }]
  const [uploadingImg, setUploadingImg] = useState(false);
  const reviewImgRef = useRef(null);
  // Lightbox state for review images
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`).then(r => r.json()).then(setData);
  }, [productId]);

  async function handleImageAdd(e) {
    const file = e.target.files[0];
    if (!file || reviewImages.length >= 3) return;
    setUploadingImg(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const res = await fetch('/api/repairs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const result = await res.json();
      if (res.ok) setReviewImages(prev => [...prev, { dataUrl, url: result.url }]);
      setUploadingImg(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeImage(idx) {
    setReviewImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!form.rating) { setMsg('Please select a star rating'); return; }
    setSubmitting(true);
    setMsg('');
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        ...form,
        images: reviewImages.map(img => img.url),
      }),
    });
    const result = await res.json();
    if (res.ok) {
      setData(prev => ({ ...prev, reviews: [result, ...prev.reviews], count: prev.count + 1 }));
      setShowForm(false);
      setForm({ rating: 0, title: '', body: '' });
      setReviewImages([]);
      setMsg('Review submitted!');
    } else {
      setMsg(result.error || 'Failed to submit');
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-8 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
      {/* Review image lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightboxSrc} alt="Review photo" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Customer Reviews</h2>
          {data.avg && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={Math.round(Number(data.avg))} size={4} />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{data.avg} out of 5</span>
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
          <Link href="/signin" className="rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 no-underline">
            Sign in to review
          </Link>
        )}
      </div>

      {msg && (
        <p className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-medium ${msg.includes('submitted') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>{msg}</p>
      )}

      {showForm && (
        <form onSubmit={submitReview} className="mt-6 space-y-4 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Your Rating *</label>
            <StarRating rating={form.rating} onChange={r => setForm({ ...form, rating: r })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Review Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Summarize your experience" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-800" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Review *</label>
            <textarea required rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Tell other shoppers what you think..." className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-800" />
          </div>

          {/* Photo upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Add Photos <span className="font-normal text-slate-400">(optional — up to 3)</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {reviewImages.map((img, i) => (
                <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {reviewImages.length < 3 && (
                <button
                  type="button"
                  onClick={() => reviewImgRef.current?.click()}
                  disabled={uploadingImg}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all disabled:opacity-50"
                >
                  {uploadingImg
                    ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                    : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[10px] font-semibold">Add Photo</span>
                      </>
                    )
                  }
                </button>
              )}
            </div>
            <input
              ref={reviewImgRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageAdd}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting || uploadingImg} className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setReviewImages([]); }} className="rounded-full border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          </div>
        </form>
      )}

      {data.reviews.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="mt-6 space-y-5 divide-y divide-slate-50 dark:divide-slate-800">
          {data.reviews.map(review => {
            let reviewImgs = [];
            try { reviewImgs = JSON.parse(review.images || '[]'); } catch {}
            return (
              <div key={review.id} className="pt-5 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {review.user?.image
                      ? <img src={review.user.image} alt="" className="h-9 w-9 rounded-full" />
                      : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">{(review.user?.name || 'A')[0].toUpperCase()}</div>
                    }
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{review.user?.name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size={4} />
                        {review.verified && <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Verified Purchase</span>}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <h4 className="mt-2 font-semibold text-slate-800 dark:text-slate-200">{review.title}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{review.body}</p>

                {/* Review photos */}
                {reviewImgs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reviewImgs.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxSrc(src)}
                        className="group relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-sky-300 transition-all"
                        aria-label="View photo"
                      >
                        <img src={src} alt={`Review photo ${i + 1}`} className="h-full w-full object-cover group-hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity rounded-xl">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
  const { toast } = useToast();
  const { data: session } = useSession();
  const { setWhatsappCtx } = useWhatsAppCtx();
  const galleryRef = useRef(null);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setWhatsappCtx({ type: 'product', name: product.name, id: product.id });
    return () => setWhatsappCtx(null);
  }, [product.id]);

  const colors = parseField(product.colors);
  const storageOptions = parseField(product.storageOptions);
  const warrantyOptions = parseField(product.warrantyOptions);
  const specs = typeof product.specs === 'object' && !Array.isArray(product.specs)
    ? product.specs
    : (() => { try { return JSON.parse(product.specs); } catch { return {}; } })();
  const colorStock = (() => { try { return JSON.parse(product.colorStock || '{}'); } catch { return {}; } })();
  const storageStock = (() => { try { return JSON.parse(product.storageStock || '{}'); } catch { return {}; } })();

  const [color, setColor] = useState(colors[0] || '');
  // Auto-select first available storage
  const firstAvailableStorage = storageOptions.find(s => {
    const sq = (() => { try { return JSON.parse(product.storageStock || '{}'); } catch { return {}; } })();
    return sq[s] === undefined || sq[s] > 0;
  }) || storageOptions[0] || '';
  const [storage, setStorage] = useState(firstAvailableStorage);
  const storagePrices = (() => { try { return JSON.parse(product.storagePrice || '{}'); } catch { return {}; } })();
  const displayPrice = (storageOptions.length > 1 && storagePrices[storage]) ? storagePrices[storage] : product.price;

  function handleColorChange(c) {
    if (!colorAvailable(c)) return;
    setColor(c);
    // Switch to color's corresponding image by index
    const colorIdx = colors.indexOf(c);
    if (colorIdx >= 0 && colorIdx < images.length) {
      scrollToImg(colorIdx);
    }
  }
  const [warranty, setWarranty] = useState(warrantyOptions[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [recs, setRecs] = useState([]);
  const hourOfDay = new Date().getHours();
  const [viewingCount] = useState(() => Math.floor(((product.id * 7 + hourOfDay * 13) % 15) + 4));

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
    toast({ type: 'cart', title: 'Added to cart!', message: `${product.name}${color ? ` · ${color}` : ''}` });
    setTimeout(() => setAdded(false), 1500);
  }

  async function handleWishlist() {
    if (!session) { window.location.href = '/signin'; return; }
    setHeartAnim(true);
    const saved = await toggleWishlist(product.id);
    toast({ type: 'heart', title: saved ? 'Saved to wishlist ♥' : 'Removed from wishlist', message: product.name });
    setTimeout(() => setHeartAnim(false), 600);
  }

  function scrollToImg(idx) {
    setActiveImg(idx);
    if (galleryRef.current) {
      const el = galleryRef.current.children[idx];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }

  function handleGalleryScroll() {
    if (!galleryRef.current) return;
    const scrollLeft = galleryRef.current.scrollLeft;
    const width = galleryRef.current.offsetWidth;
    const idx = Math.round(scrollLeft / width);
    if (idx !== activeImg) setActiveImg(idx);
  }

  // SEO
  const metaTitle = `${product.name} — KigaliTech`;
  const metaDesc = product.description?.slice(0, 155) || `Buy ${product.name} at KigaliTech Rwanda. ${product.category} products at the best prices.`;
  const metaImage = images[0] || '';
  const canonicalUrl = `${process.env.NEXTAUTH_URL || 'https://kigalitech.com'}/products/${product.id}`;

  return (
    <Layout>
      <SEOMeta
        title={metaTitle}
        description={metaDesc}
        image={metaImage}
        url={canonicalUrl}
        type="product"
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-sky-600">Home</Link>
            <span>/</span>
            <Link href={`/products?category=${product.category}`} className="hover:text-sky-600">{product.category}</Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{product.name}</span>
          </nav>

          <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
              {/* ── Images + Video ── */}
              <div className="lg:sticky lg:top-6 lg:self-start">

                {/* Main image */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700 bg-[radial-gradient(ellipse_at_center,#f8fafc_0%,#f1f5f9_100%)] dark:bg-slate-800">
                  {product.genuine !== false && (
                    <span className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm shadow-sm">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Genuine
                    </span>
                  )}

                  {/* Zoom icon */}
                  <button
                    onClick={() => setLightbox(true)}
                    className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-slate-700/90 text-slate-500 dark:text-slate-300 shadow-sm hover:bg-white dark:hover:bg-slate-700 hover:text-sky-600 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="View full size"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>

                  {/* Swipeable on mobile, click-to-change on desktop */}
                  <div
                    ref={galleryRef}
                    onScroll={handleGalleryScroll}
                    className="gallery-scroll flex overflow-x-auto lg:overflow-x-hidden cursor-zoom-in"
                    style={{ scrollSnapType: 'x mandatory' }}
                    onClick={() => setLightbox(true)}
                  >
                    {images.map((src, i) => (
                      <div key={i} className="flex-shrink-0 w-full" style={{ scrollSnapAlign: 'start' }}>
                        <img
                          src={src}
                          alt={`${product.name} — view ${i + 1}`}
                          className="h-[340px] sm:h-[460px] w-full object-contain p-6 transition-transform duration-500 hover:scale-105"
                          style={{ display: i === activeImg ? 'block' : 'none' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Dot indicator (mobile) */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 lg:hidden">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => scrollToImg(i)}
                          className={`h-2 rounded-full transition-all ${i === activeImg ? 'w-5 bg-sky-500' : 'w-2 bg-slate-300'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Arrow buttons */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); scrollToImg(Math.max(0, activeImg - 1)); }}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-700/90 shadow-md hover:bg-white dark:hover:bg-slate-700 transition ${activeImg === 0 ? 'opacity-30 pointer-events-none' : ''}`}
                      >
                        <svg className="h-4 w-4 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); scrollToImg(Math.min(images.length - 1, activeImg + 1)); }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-700/90 shadow-md hover:bg-white dark:hover:bg-slate-700 transition ${activeImg === images.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
                      >
                        <svg className="h-4 w-4 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </>
                  )}

                  {/* Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm hidden lg:block">
                      {activeImg + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => scrollToImg(i)}
                        className={`flex-shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 bg-white dark:bg-slate-800 transition-all ${
                          activeImg === i
                            ? 'border-sky-500 ring-2 ring-sky-200 dark:ring-sky-800 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-contain p-1.5 bg-[radial-gradient(ellipse_at_center,#f8fafc_0%,#f1f5f9_100%)] dark:bg-[radial-gradient(ellipse_at_center,#1e293b_0%,#0f172a_100%)]"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Product Video */}
                {product.videoUrl && <VideoPlayer url={product.videoUrl} />}
              </div>

              {/* ── Lightbox ── */}
              {lightbox && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setLightbox(false)}>
                  <button className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <img
                    src={images[activeImg]}
                    alt={product.name}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {images.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                      {images.map((_, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                          className={`h-2 rounded-full transition-all ${i === activeImg ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Details ── */}
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TranslatedText text={product.category} as="p" className="text-xs font-bold uppercase tracking-widest text-sky-600" />
                      {product.subcategory && <span className="text-xs text-slate-400">· {product.subcategory}</span>}
                      {product.brand && <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{product.brand}</span>}
                    </div>
                    {/* Share button */}
                    <button
                      onClick={() => navigator.share ? navigator.share({ title: product.name, url: window.location.href }) : navigator.clipboard.writeText(window.location.href).then(() => toast({ type: 'info', title: 'Link copied!', message: 'Share it with friends' }))}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                    <TranslatedText text={product.name} as={null} />
                  </h1>
                  <TranslatedText
                    text={product.description}
                    as="p"
                    className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]"
                  />
                </div>

                {/* Price + stock */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Price</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{format(displayPrice)}</p>
                    {product.comparePrice && (
                      <p className="text-sm text-slate-400 line-through">{format(product.comparePrice)}</p>
                    )}
                  </div>
                  <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    product.stock === 0 ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : product.stock <= 5 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock'}
                  </div>
                </div>

                {/* Color */}
                {colors.length > 0 && (
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('color')}:{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{color}</span>
                      </p>
                      <span className="text-xs text-slate-400 dark:text-slate-500">Tap color to preview</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => {
                        const avail = colorAvailable(c);
                        const qty = colorQty(c);
                        const colorIdx = colors.indexOf(c);
                        const hasImg = colorIdx < images.length;
                        return (
                          <button
                            key={c}
                            onClick={() => handleColorChange(c)}
                            disabled={!avail}
                            title={!avail ? 'Not available' : qty !== undefined ? `${qty} in stock` : (hasImg ? 'Click to preview' : undefined)}
                            className={`relative rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                              !avail
                                ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60'
                                : color === c
                                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 shadow-md shadow-sky-100 dark:shadow-sky-900/20 scale-105'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300 hover:bg-sky-50/50 dark:hover:border-sky-700'
                            }`}
                          >
                            {!avail && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="block w-full h-[1.5px] bg-red-400/70 rotate-[-15deg] absolute" />
                              </span>
                            )}
                            {c}
                            {!avail && (
                              <span className="block text-[9px] font-semibold text-red-400 leading-tight mt-0.5">Not available</span>
                            )}
                            {avail && qty !== undefined && qty <= 3 && (
                              <span className="absolute -top-2 -right-1 rounded-full bg-amber-400 px-1.5 text-[9px] font-bold text-white shadow-sm">
                                {qty} left
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {colors.some(c => colorAvailable(c) && colors.indexOf(c) < images.length) && (
                      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        Images update when you select a color
                      </p>
                    )}
                  </div>
                )}

                {/* Storage */}
                {storageOptions.length > 1 && (
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t('storage')}</p>
                    <div className="flex flex-wrap gap-2">
                      {storageOptions.map((s) => {
                        const avail = storageAvailable(s);
                        const qty = storageQty(s);
                        const sPrice = storagePrices[s];
                        const priceDiff = sPrice && product.price ? sPrice - product.price : 0;
                        return (
                          <button
                            key={s}
                            onClick={() => avail && setStorage(s)}
                            disabled={!avail}
                            title={!avail ? 'Not available' : qty !== undefined ? `${qty} in stock` : undefined}
                            className={`relative flex flex-col items-center rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                              !avail
                                ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60'
                                : storage === s
                                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 shadow-md shadow-sky-100 dark:shadow-sky-900/20 scale-105'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300 hover:bg-sky-50/50 dark:hover:border-sky-700'
                            }`}
                          >
                            {!avail && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="block w-full h-[1.5px] bg-red-400/70 rotate-[-15deg] absolute" />
                              </span>
                            )}
                            <span>{s}</span>
                            {!avail ? (
                              <span className="text-[9px] font-semibold text-red-400 leading-tight">Not available</span>
                            ) : sPrice ? (
                              <span className={`text-[10px] font-semibold leading-tight ${storage === s ? 'text-sky-500' : 'text-slate-400'}`}>
                                {format(sPrice)}
                                {priceDiff > 0 && <span className="text-emerald-500 ml-0.5">+{format(priceDiff)}</span>}
                              </span>
                            ) : null}
                            {avail && qty !== undefined && qty <= 3 && (
                              <span className="absolute -top-2 -right-1 rounded-full bg-amber-400 px-1.5 text-[9px] font-bold text-white shadow-sm">
                                {qty} left
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Warranty */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    Warranty
                    {product.brand === 'Apple' && warranty && warranty.toLowerCase().includes('applecare') && (
                      <a href="https://www.apple.com/support/products/" target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline ml-1">See Apple pricing →</a>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {warrantyOptions.map((w) => (
                      <button key={w} onClick={() => setWarranty(w)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${warranty === w ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TV Installation callout */}
                {isTV && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">📺</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Professional Installation Available</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Add certified wall mounting & cable management at checkout. A technician comes to your address.</p>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-1">Installation fee: {format(5000)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Installments callout */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">💳</span>
                    <div>
                      <p className="text-sm font-semibold text-sky-900 dark:text-sky-300">Pay in Installments</p>
                      <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">Split into 3, 6 or 12 monthly payments — choose at checkout.</p>
                      <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">From <span className="font-bold">{format(Math.ceil(displayPrice / 3))}/mo</span> over 3 months</p>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                {Object.keys(specs).length > 0 && (
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Specifications</p>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {Object.entries(specs).map(([key, value], idx) => (
                        <div key={key} className={`flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 w-2/5">{key}</span>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-right flex-1">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trade-in callout */}
                <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">♻️</span>
                      <div>
                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Have an old device?</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">Trade it in and get a discount on this product.</p>
                      </div>
                    </div>
                    <Link href="/trade-in" className="flex-shrink-0 rounded-full border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 no-underline">
                      Trade In →
                    </Link>
                  </div>
                </div>

                {/* Social proof counter */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{viewingCount} people</span> viewing this right now
                  </span>
                </div>

                {/* Qty + CTA */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">−</button>
                    <span className="min-w-[3rem] text-center font-semibold dark:text-slate-200">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">+</button>
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

                {/* Stock alert for out-of-stock products */}
                {product.stock === 0 && (
                  <StockAlertButton productId={product.id} />
                )}

                {/* Wishlist + Compare row */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleWishlist}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-all ${
                      isWished
                        ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
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
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-purple-900/20'
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
            <div className="mt-8 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl">🛍️</span>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Frequently Bought Together</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Customers who buy this also pick these</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bundledProducts.map(bp => {
                  const bImgs = (() => { try { return JSON.parse(bp.images); } catch { return []; } })();
                  return (
                    <Link key={bp.id} href={`/products/${bp.id}`} className="group flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-700 p-3 no-underline hover:border-sky-200 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {bImgs[0] && <img src={bImgs[0]} alt={bp.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-sky-700">{bp.name}</p>
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

          {/* AI Q&A */}
          <div className="mt-8">
            <ProductQA productId={product.id} />
          </div>

          {/* AI Recommendations */}
          {recs.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">You Might Also Like</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">Similar Products</h2>
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

      {/* ── Sticky mobile Add to Cart bar ── */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 px-4 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-md px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{product.name}</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{format(displayPrice)}</p>
          </div>
          <button
            onClick={handleWishlist}
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition-all ${
              isWished ? 'border-red-200 bg-red-50 dark:bg-red-900/20 text-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-red-200 hover:text-red-400'
            } ${heartAnim ? 'scale-110' : ''}`}
          >
            <svg className="h-5 w-5" fill={isWished ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex-shrink-0 rounded-xl px-6 py-2.5 font-bold text-white text-sm transition-all ${
              product.stock === 0 ? 'bg-slate-300 cursor-not-allowed'
              : added ? 'bg-emerald-500 scale-95'
              : 'bg-sky-600 hover:bg-sky-700 active:scale-95 shadow-lg shadow-sky-200'
            }`}
          >
            {product.stock === 0 ? 'Out of Stock' : added ? '✓ Added!' : 'Add to Cart'}
          </button>
        </div>
        {product.stock === 0 && (
          <div className="mt-2 px-1">
            <StockAlertButton productId={product.id} />
          </div>
        )}
      </div>
    </Layout>
  );
}
