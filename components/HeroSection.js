import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

export default function HeroSection({ config = {} }) {
  const { t } = useLang();

  const badgeText  = config.heroBadgeText || 'New Arrivals Just Dropped';
  const subtitle   = config.heroSubtitle  || 'Premium electronics — phones, laptops, audio, wearables — with fast delivery, real warranties, and zero compromise.';
  const imageUrl   = config.heroImageUrl  || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85';

  const rawTitle   = config.heroTitle || 'Tech That\nElevates\nYour Life';
  const titleLines = rawTitle.split('\\n').join('\n').split('\n');
  const line1 = titleLines[0] || 'Tech That';
  const line2 = titleLines[1] || 'Elevates';
  const line3 = titleLines[2] || 'Your Life';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950">

      {/* Subtle grid decoration */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow blobs */}
      <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* ── Content grid ── */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[520px] sm:min-h-[580px] lg:min-h-[660px] items-center lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_520px]">

          {/* ── Left: Text — completely separate from image on all sizes ── */}
          <div className="py-12 sm:py-16 lg:py-20 relative z-10 max-w-xl">

            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              {badgeText}
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[58px]">
              {line1}
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {line2}
              </span>
              <br />
              {line3}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-7 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 no-underline transition-all hover:scale-105"
              >
                {t('shopNow')}
              </Link>
              <Link
                href="/deals"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 font-semibold text-white backdrop-blur-sm hover:bg-white/20 no-underline transition-all"
              >
                View Deals
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 w-fit backdrop-blur-sm">
              <div className="flex -space-x-1">
                {['📱','💻','🎧','📺','⌚'].map((e, i) => (
                  <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm border border-white/10">{e}</span>
                ))}
              </div>
              <div className="w-px h-5 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white/80">Global · Secure · Guaranteed</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 flex items-center gap-8 flex-nowrap overflow-x-auto scrollbar-none pb-1">
              {[
                { label: 'Products',        value: '500+' },
                { label: 'Happy Customers', value: '12K+' },
                { label: 'Brands',          value: '40+'  },
              ].map(({ label, value }) => (
                <div key={label} className="flex-shrink-0">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">{value}</p>
                  <p className="text-xs sm:text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Image — desktop only, fully contained in this column ── */}
          <div className="relative hidden lg:block h-full self-stretch overflow-hidden" style={{ minHeight: '660px' }}>
            <img
              src={imageUrl}
              alt="Premium electronics"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
              fetchpriority="high"
            />
            {/* Blend left edge into dark section background */}
            <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
            {/* Blend top + bottom edges */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/70 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}
