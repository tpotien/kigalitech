import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

export default function HeroSection({ config = {} }) {
  const { t } = useLang();

  const badgeText = config.heroBadgeText || 'New Arrivals Just Dropped';
  const subtitle = config.heroSubtitle || 'Premium electronics — phones, laptops, audio, wearables — with fast delivery, real warranties, and zero compromise.';
  const imageUrl = config.heroImageUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=85';
  const priceLabel = config.heroPriceLabel || 'Starting from';
  const heroPrice = config.heroPrice || '$129.99';

  // Split title on \n — line[0] plain, line[1] gradient highlight, line[2] plain
  const rawTitle = config.heroTitle || 'Tech That\nElevates\nYour Life';
  const titleLines = rawTitle.split('\\n').join('\n').split('\n');
  const line1 = titleLines[0] || 'Tech That';
  const line2 = titleLines[1] || 'Elevates';
  const line3 = titleLines[2] || 'Your Life';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 min-h-[600px] lg:min-h-[680px]">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow blobs */}
      <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[600px] lg:min-h-[680px] items-center gap-8 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_560px]">

          {/* ── Left: Text ── */}
          <div className="py-16 lg:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              {badgeText}
            </span>

            <h1 className="mt-6 text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[64px]">
              {line1}
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {line2}
              </span>
              <br />
              {line3}
            </h1>

            <p className="mt-6 max-w-md text-lg text-slate-300 leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-8 py-3.5 font-semibold text-white shadow-xl shadow-sky-500/30 hover:bg-sky-400 no-underline transition-all hover:scale-105"
              >
                {t('shopNow')}
              </Link>
              <Link
                href="/deals"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur-sm hover:bg-white/20 no-underline transition-all"
              >
                View Deals
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-10">
              {[
                { label: 'Products', value: '500+' },
                { label: 'Happy Customers', value: '12K+' },
                { label: 'Brands', value: '40+' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-3xl font-extrabold text-white">{value}</p>
                  <p className="text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Product Image — radial-mask blend ── */}
          <div className="relative hidden lg:flex h-full min-h-[600px] items-stretch self-stretch overflow-hidden">

            {/* Glow orb behind phone */}
            <div className="absolute right-16 top-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full bg-sky-500/12 blur-3xl pointer-events-none" />

            {/* Radial mask — fades photo edges into the dark section bg.
                Works on any image regardless of background color. */}
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: 'radial-gradient(ellipse 82% 88% at 62% 50%, black 20%, rgba(0,0,0,0.7) 45%, transparent 75%)',
                maskImage: 'radial-gradient(ellipse 82% 88% at 62% 50%, black 20%, rgba(0,0,0,0.7) 45%, transparent 75%)',
              }}
            >
              <img
                src={imageUrl}
                alt="New Arrival"
                className="h-full w-full object-cover object-center"
                loading="eager"
                fetchpriority="high"
              />
            </div>

            {/* Hard left gradient — seals blend with text column */}
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-10" />
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none z-10" />

            {/* Floating card — price */}
            <div className="absolute bottom-14 left-6 z-20 rounded-2xl bg-white/95 backdrop-blur-sm px-5 py-3.5 shadow-2xl">
              <p className="text-xs font-medium text-slate-500">{priceLabel}</p>
              <p className="text-2xl font-extrabold text-slate-900">{heroPrice}</p>
            </div>

            {/* Floating card — rating */}
            <div className="absolute top-14 left-6 z-20 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-2xl">
              <div className="flex text-amber-400">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">4.9</span>
              <span className="text-xs text-slate-400">12K reviews</span>
            </div>

            {/* New arrival badge */}
            <div className="absolute top-1/2 left-[-16px] z-20 -translate-y-1/2 rounded-full bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-500/40 rotate-[-90deg]">
              NEW 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
