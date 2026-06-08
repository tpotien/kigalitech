import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

export default function HeroSection({ config = {} }) {
  const { t } = useLang();

  const badgeText = config.heroBadgeText || 'New Arrivals Just Dropped';
  const subtitle = config.heroSubtitle || 'Premium electronics — phones, laptops, audio, wearables — with fast delivery, real warranties, and zero compromise.';
  const imageUrl = config.heroImageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85';
  const rawTitle = config.heroTitle || 'Tech That\nElevates\nYour Life';
  const titleLines = rawTitle.split('\\n').join('\n').split('\n');
  const line1 = titleLines[0] || 'Tech That';
  const line2 = titleLines[1] || 'Elevates';
  const line3 = titleLines[2] || 'Your Life';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 min-h-[520px] sm:min-h-[600px] lg:min-h-[680px]">

      {/* Subtle grid overlay */}
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

      {/* ── Full-bleed image — mobile: tighter fade, desktop: wider fade ── */}
      {/* Both use the same absolute layer; CSS mask differs via inline style per breakpoint via wrapper classes */}

      {/* Mobile — image right half visible, fades to transparent over text */}
      <div className="lg:hidden absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.3) 60%, transparent 82%)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.3) 60%, transparent 82%)',
          }}
        >
          <img src={imageUrl} alt="" className="w-full h-full object-cover object-center" loading="eager" />
        </div>
      </div>

      {/* Desktop — full-section image, strongly visible right side, fades behind text */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 0%, black 30%, rgba(0,0,0,0.75) 52%, rgba(0,0,0,0.2) 68%, transparent 82%)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 0%, black 30%, rgba(0,0,0,0.75) 52%, rgba(0,0,0,0.2) 68%, transparent 82%)',
          }}
        >
          <img
            src={imageUrl}
            alt="New Arrival"
            className="w-full h-full object-cover object-right"
            loading="eager"
            fetchpriority="high"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[520px] sm:min-h-[600px] lg:min-h-[680px] items-center lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_500px]">

          {/* ── Left: Text ── */}
          <div className="py-10 sm:py-16 lg:py-20 relative z-10">
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

            {/* Trust strip */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 w-fit backdrop-blur-sm">
              <div className="flex -space-x-1">
                {['📱','💻','🎧','📺','⌚'].map((e, i) => (
                  <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm border border-white/10">{e}</span>
                ))}
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white/80">Global · Secure · Guaranteed</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-10 sm:mt-12 flex items-center gap-6 sm:gap-10 flex-nowrap overflow-x-auto scrollbar-none pb-1">
              {[
                { label: 'Products', value: '500+' },
                { label: 'Happy Customers', value: '12K+' },
                { label: 'Brands', value: '40+' },
              ].map(({ label, value }) => (
                <div key={label} className="flex-shrink-0">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white whitespace-nowrap">{value}</p>
                  <p className="text-xs sm:text-sm text-slate-400 whitespace-nowrap">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — empty spacer so the image shows through */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
