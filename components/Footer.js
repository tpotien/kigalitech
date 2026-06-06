import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

const LINKS = {
  Shop: [
    { label: 'Laptops', href: '/products?category=Laptops' },
    { label: 'Phones', href: '/products?category=Phones' },
    { label: 'Headphones', href: '/products?category=Headphones' },
    { label: 'Wearables', href: '/products?category=Wearables' },
    { label: 'Deals', href: '/deals' },
  ],
  Support: [
    { label: 'Track Order', href: '/orders' },
    { label: 'Returns', href: '/returns' },
    { label: 'Repair Center', href: '/repairs' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">KigaliTech</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{t('footerTagline')}</p>
            {/* Social */}
            <div className="mt-6 flex gap-3">
              {['twitter', 'instagram', 'facebook', 'youtube'].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-sky-600 hover:text-white transition-colors"
                  aria-label={social}
                >
                  <span className="text-xs font-bold uppercase">{social[0]}</span>
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
          <div className="flex items-center gap-2">
            {['visa', 'mc', 'amex', 'stripe'].map((card) => (
              <span
                key={card}
                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 uppercase"
              >
                {card}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
