import { useState } from 'react';
import { useLang } from '../context/LanguageContext';

const PJS = "'Plus Jakarta Sans',sans-serif";

// Microsoft's real 4-color logo as inline SVG
const MicrosoftLogo = () => (
  <svg width="36" height="36" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

const BRANDS = [
  {
    name: 'Apple',
    slug: 'apple',
    bg: '#000000',
    text: '#ffffff',
    iconColor: 'ffffff',
    font: PJS,
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    bg: '#1428A0',
    text: '#ffffff',
    iconColor: 'ffffff',
    font: PJS,
  },
  {
    name: 'Sony',
    slug: 'sony',
    bg: '#000000',
    text: '#ffffff',
    iconColor: 'ffffff',
    font: PJS,
  },
  {
    name: 'Microsoft',
    slug: null, // uses custom SVG
    bg: '#f3f3f3',
    text: '#111111',
    customLogo: <MicrosoftLogo />,
    font: PJS,
  },
  {
    name: 'OnePlus',
    slug: 'oneplus',
    bg: '#F5010C',
    text: '#ffffff',
    iconColor: 'ffffff',
    font: PJS,
  },
];

function BrandCard({ brand }) {
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const logoSrc = brand.slug
    ? `https://cdn.simpleicons.org/${brand.slug}/${brand.iconColor}`
    : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center justify-center rounded-2xl border overflow-hidden cursor-default"
      style={{
        width: '100%',
        height: 'clamp(4rem, 12vw, 6rem)',
        backgroundColor: hovered ? brand.bg : '#ffffff',
        borderColor: hovered ? brand.bg : '#e2e8f0',
        transform: hovered ? 'translateY(-5px) scale(1.06)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 16px 40px ${brand.bg}55` : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {hovered ? (
        /* Hovered: show logo */
        brand.customLogo ? (
          <div style={{ filter: brand.bg === '#f3f3f3' ? 'none' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {brand.customLogo}
          </div>
        ) : logoSrc && !imgFailed ? (
          <img
            src={logoSrc}
            alt={brand.name}
            style={{ pointerEvents: 'none' }}
            className="h-9 w-auto max-w-[75%] object-contain"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span style={{ fontFamily: brand.font, color: brand.text, fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em' }}>
            {brand.name}
          </span>
        )
      ) : (
        /* Default: name text */
        <span style={{
          fontFamily: brand.font,
          color: '#64748b',
          fontWeight: 800,
          fontSize: brand.name.length > 6 ? '13px' : '15px',
          letterSpacing: '0.02em',
          textAlign: 'center',
          padding: '0 8px',
          userSelect: 'none',
        }}>
          {brand.name}
        </span>
      )}
    </div>
  );
}

export default function TrustBadges() {
  const { t } = useLang();

  return (
    <section className="bg-white dark:bg-slate-900 py-8 sm:py-12 border-t border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="mb-5 sm:mb-8 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
          {t('trustedBy')}
        </p>
        <div className="grid grid-cols-5 gap-3 sm:gap-4">
          {BRANDS.map(brand => <BrandCard key={brand.name} brand={brand} />)}
        </div>
      </div>
    </section>
  );
}
