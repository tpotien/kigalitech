import { useState } from 'react';
import { useLang } from '../context/LanguageContext';

const BRANDS = [
  { name: 'Apple',   domain: 'apple.com',     bg: '#000000', text: '#ffffff', font: "system-ui,-apple-system,'SF Pro Display',sans-serif", dark: true },
  { name: 'Samsung', domain: 'samsung.com',    bg: '#1428A0', text: '#ffffff', font: "'Montserrat',sans-serif",        dark: true },
  { name: 'Sony',    domain: 'sony.com',       bg: '#000000', text: '#ffffff', font: "'Barlow',Arial,sans-serif",      dark: true },
  { name: 'LG',      domain: 'lg.com',         bg: '#A50034', text: '#ffffff', font: "Arial,sans-serif",               dark: true },
  { name: 'ASUS',    domain: 'asus.com',       bg: '#0066CC', text: '#ffffff', font: "'Exo 2',sans-serif",             dark: true },
  { name: 'HP',      domain: 'hp.com',         bg: '#0096D6', text: '#ffffff', font: "Arial,sans-serif",               dark: true },
  { name: 'Dell',    domain: 'dell.com',       bg: '#007DB8', text: '#ffffff', font: "Arial,sans-serif",               dark: true },
  { name: 'Lenovo',  domain: 'lenovo.com',     bg: '#E2231A', text: '#ffffff', font: "'Barlow',Arial,sans-serif",      dark: true },
  { name: 'Xiaomi',  domain: 'xiaomi.com',     bg: '#FF6900', text: '#ffffff', font: "'Barlow',sans-serif",            dark: true },
  { name: 'Huawei',  domain: 'huawei.com',     bg: '#CF0A2C', text: '#ffffff', font: "Arial,sans-serif",               dark: true },
  { name: 'JBL',     domain: 'jbl.com',        bg: '#F76C00', text: '#000000', font: "'Bebas Neue',sans-serif",        dark: false },
  { name: 'Bose',    domain: 'bose.com',       bg: '#000000', text: '#ffffff', font: "'Montserrat',sans-serif",        dark: true },
  { name: 'Beats',   domain: 'beatsbydre.com', bg: '#DD0000', text: '#ffffff', font: "'Montserrat',sans-serif",        dark: true },
  { name: 'Anker',   domain: 'anker.com',      bg: '#0070F0', text: '#ffffff', font: "'Exo 2',sans-serif",             dark: true },
  { name: 'GoPro',   domain: 'gopro.com',      bg: '#00B4D8', text: '#000000', font: "'Barlow',sans-serif",            dark: false },
  { name: 'Canon',   domain: 'canon.com',      bg: '#CC0000', text: '#ffffff', font: "Arial,sans-serif",               dark: true },
  { name: 'Nikon',   domain: 'nikon.com',      bg: '#FFE400', text: '#000000', font: "'Exo 2',sans-serif",             dark: false },
];

function BrandLogo({ brand }) {
  const [hovered, setHovered] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = `https://logo.clearbit.com/${brand.domain}`;

  const logoFilter = hovered
    ? (brand.dark ? 'brightness(0) invert(1)' : 'brightness(0)')
    : 'grayscale(100%) opacity(45%)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={hovered ? {
        backgroundColor: brand.bg,
        boxShadow: `0 10px 40px ${brand.bg}55`,
        transform: 'translateY(-4px) scale(1.06)',
      } : {}}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-5 w-32 h-24 cursor-default transition-all duration-300"
      title={brand.name}
    >
      {/* Logo */}
      {!logoFailed ? (
        <img
          src={logoUrl}
          alt={brand.name}
          style={{ filter: logoFilter, transition: 'filter 0.3s ease' }}
          className="h-8 w-auto max-w-[76px] object-contain"
          loading="lazy"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span
          style={hovered ? {
            color: brand.text,
            fontFamily: brand.font,
            fontSize: brand.name.length > 5 ? '15px' : '18px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          } : { color: '#94a3b8', fontWeight: 700 }}
          className="text-sm transition-all duration-300"
        >
          {brand.name}
        </span>
      )}

      {/* Brand name on hover */}
      <span
        style={{
          fontFamily: brand.font,
          color: hovered ? brand.text : 'transparent',
          fontSize: brand.font.includes('Bebas') ? '13px' : '9px',
          fontWeight: brand.font.includes('Bebas') ? 400 : 700,
          letterSpacing: brand.font.includes('Bebas') ? '0.12em' : '0.08em',
          transition: 'color 0.3s ease',
          lineHeight: 1,
        }}
        className="absolute bottom-2.5 uppercase"
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
        <div className="flex flex-wrap items-center justify-center gap-4">
          {BRANDS.map(brand => (
            <BrandLogo key={brand.name} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
