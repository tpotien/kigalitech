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
      className="relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden cursor-default"
      style={{
        width: '100%',
        height: 'clamp(3.5rem, 10vw, 5.5rem)',
        backgroundColor: hovered ? brand.bg : undefined,
        borderColor: hovered ? brand.bg : undefined,
        transform: hovered ? 'translateY(-6px) scale(1.07)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 18px 45px ${brand.bg}50` : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Default state: brand name text only */}
      {!hovered && (
        <span
          style={{
            fontFamily: brand.font,
            color: '#64748b',
            fontWeight: 800,
            fontSize: brand.name.length > 6 ? '13px' : '16px',
            letterSpacing: '0.02em',
            pointerEvents: 'none',
            userSelect: 'none',
            textAlign: 'center',
            padding: '0 8px',
          }}
        >
          {brand.name}
        </span>
      )}

      {/* Hover state: logo only, no text */}
      {hovered && (
        <>
          {!imgFailed ? (
            <img
              src={logoSrc}
              alt={brand.name}
              style={{ pointerEvents: 'none' }}
              className="h-10 w-auto max-w-[80%] object-contain"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span
              style={{
                fontFamily: brand.font,
                color: brand.text,
                fontWeight: 800,
                fontSize: brand.name.length > 6 ? '14px' : '18px',
                letterSpacing: brand.slug === 'jbl' ? '0.12em' : '0.04em',
                userSelect: 'none',
              }}
            >
              {brand.name}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export default function TrustBadges() {
  const { t } = useLang();

  return (
    <section className="bg-slate-50 dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800 py-5 sm:py-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <p className="mb-4 sm:mb-7 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">
          {t('trustedBy')}
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
          {BRANDS.map(brand => <BrandCard key={brand.name} brand={brand} />)}
        </div>
      </div>
    </section>
  );
}
