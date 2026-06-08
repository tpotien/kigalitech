import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

const LINKS = {
  Account: [
    { label: 'My Orders', href: '/account' },
    { label: 'Track Order', href: '/account' },
    { label: 'Repair Center', href: '/repairs' },
    { label: 'Trade-In', href: '/trade-in' },
    { label: 'Bulk Orders', href: '/bulk-order' },
    { label: 'Gift Cards', href: '/gift-cards' },
    { label: 'Sign In', href: '/signin' },
  ],
  Company: [
    { label: 'About KigaliTech', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const SOCIALS = [
  {
    id: 'twitter',
    label: 'X (Twitter)',
    href: 'https://twitter.com',
    // Solid black circle with white X logo
    bg: 'bg-black hover:bg-gray-800',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/kigalitechservices/',
    // Official Instagram gradient
    bg: '',
    style: { background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45)' },
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/kigalitechservices/',
    // Official Facebook blue
    bg: 'hover:brightness-110',
    style: { background: '#1877F2' },
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand — full width on mobile */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">KigaliTech</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{t('footerTagline')}</p>
            <div className="mt-4 space-y-1.5">
              <p className="text-sm text-slate-300">📞 +250 786 276 555</p>
              <p className="text-sm text-slate-300">📍 KN 74St, infront of Al madina mosque, Kigali Rwanda</p>
            </div>
            {/* Social — brand colors */}
            <div className="mt-6 flex gap-3">
              {SOCIALS.map(({ id, label, href, bg, style, icon }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 ${bg || ''}`}
                  style={style}
                  aria-label={label}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-200">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm no-underline hover:text-sky-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-xs">© {new Date().getFullYear()} KigaliTech. All rights reserved.</p>
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            {['MTN MoMo', 'Airtel Money', 'Visa', 'Cash'].map((m) => (
              <span key={m} className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
