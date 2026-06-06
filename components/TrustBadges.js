import { useState } from 'react';
import { useLang } from '../context/LanguageContext';

// slug = SimpleIcons CDN slug  |  iconColor = hex without # for the logo fill
// bg = brand's official background color  |  text = text/icon color over bg
const PJS = "'Plus Jakarta Sans',sans-serif";

const BRANDS = [
  { name: 'Apple',    slug: 'apple',       bg: '#000000', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'Samsung',  slug: 'samsung',     bg: '#1428A0', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'Sony',     slug: 'sony',        bg: '#000000', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'LG',       slug: 'lg',          bg: '#A50034', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'ASUS',     slug: 'asus',        bg: '#0066CC', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'HP',       slug: 'hp',          bg: '#0096D6', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'OnePlus',  slug: 'oneplus',     bg: '#F5010C', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'Lenovo',   slug: 'lenovo',      bg: '#E2231A', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'Xiaomi',   slug: 'xiaomi',      bg: '#FF6900', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'Huawei',   slug: 'huawei',      bg: '#CF0A2C', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'JBL',      slug: 'jbl',         bg: '#F76C00', text: '#000000', iconColor: '000000', font: PJS },
  { name: 'Bose',     slug: 'bose',        bg: '#000000', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'Beats',    slug: 'beatsbydre',  bg: '#DD0000', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'Anker',    slug: 'anker',       bg: '#0070F0', text: '#ffffff', iconColor: 'ffffff', font: PJS },
  { name: 'GoPro',    slug: 'gopro',       bg: '#00B4D8', text: '#000000', iconColor: '000000', font: PJS },
  { name: 'Canon',    slug: 'canon',       bg: '#CC0000', text: '#ffffff', iconColor: 'ffffff', font: PJS },
];

function BrandCard({ brand }) {
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // SimpleIcons CDN returns a clean SVG in the exact color requested
  const logoSrc = `https://cdn.simpleicons.org/${brand.slug}/${brand.iconColor}`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center justify-center rounded-2xl border overflow-hidden cursor-default"
      style={{
        width: '9rem',
        height: '6rem',
        backgroundColor: hovered ? brand.bg : '#ffffff',
        borderColor: hovered ? brand.bg : '#e2e8f0',
        transform: hovered ? 'translateY(-6px) scale(1.07)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 18px 45px ${brand.bg}50` : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* DEFAULT: brand name text */}
      <span
        style={{
          fontFamily: brand.font,
          color: '#64748b',
          fontWeight: 800,
          fontSize: brand.name.length > 6 ? '13px' : '16px',
          letterSpacing: '0.02em',
          position: 'absolute',
          opacity: hovered ? 0 : 1,
          transform: hovered ? 'translateY(6px) scale(0.85)' : 'translateY(0) scale(1)',
          transition: 'all 0.22s ease',
          pointerEvents: 'none',
          userSelect: 'none',
          textAlign: 'center',
          padding: '0 8px',
        }}
      >
        {brand.name}
      </span>

      {/* HOVER: official brand logo */}
      {!imgFailed ? (
        <img
          src={logoSrc}
          alt={brand.name}
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.82)',
            transition: 'all 0.28s ease',
            pointerEvents: 'none',
          }}
          className="absolute h-10 w-auto max-w-[80%] object-contain"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        /* Fallback: brand name in brand color/style */
        <span
          style={{
            fontFamily: brand.font,
            color: hovered ? brand.text : 'transparent',
            fontWeight: 800,
            fontSize: brand.name.length > 6 ? '14px' : '18px',
            letterSpacing: brand.slug === 'jbl' ? '0.12em' : '0.04em',
            position: 'absolute',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(-6px)',
            transition: 'all 0.28s ease',
            userSelect: 'none',
          }}
        >
          {brand.name}
        </span>
      )}

      {/* Brand name label at bottom on hover */}
      <span
        style={{
          fontFamily: brand.font,
          color: hovered ? (brand.text === '#ffffff' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)') : 'transparent',
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          position: 'absolute',
          bottom: '8px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s ease 0.05s',
          userSelect: 'none',
          textTransform: 'uppercase',
        }}
      >
        {brand.name}
      </span>
    </div>
  );
}

export default function TrustBadges() {
  const { t } = useLang();

  return (
    <section className="bg-slate-50 border-y border-slate-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          {t('trustedBy')}
        </p>
        <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-none">
          <div className="flex flex-col gap-3 w-fit mx-auto px-4 sm:px-0">
            <div className="flex gap-3">
              {BRANDS.slice(0, 8).map(brand => <BrandCard key={brand.name} brand={brand} />)}
            </div>
            <div className="flex gap-3">
              {BRANDS.slice(8).map(brand => <BrandCard key={brand.name} brand={brand} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
