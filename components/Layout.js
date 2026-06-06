import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import CartDrawer from './CartDrawer';
import SearchModal from './SearchModal';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const { itemCount, toggleDrawer } = useCart();
  const { data: session } = useSession();
  const { t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaActive, setMegaActive] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const NAV_LINKS = [
    { label: t('phones'), href: '/products?category=Phones', mega: ['iPhone Series', 'Android Flagships', 'Budget Phones', 'Refurbished'] },
    { label: t('laptops'), href: '/products?category=Laptops', mega: ['Gaming Laptops', 'MacBooks', 'Ultrabooks', 'Workstations'] },
    { label: t('audio'), href: '/products?category=Headphones', mega: ['Headphones', 'Earbuds', 'Speakers', 'Microphones'] },
    { label: t('tvs'), href: '/products?category=TVs', mega: ['Smart TVs', 'OLED TVs', '4K TVs', 'Mini LED'] },
    { label: t('wearables'), href: '/products?category=Wearables', mega: ['Smart Watches', 'Fitness Bands', 'AR Glasses'] },
    { label: t('others'), href: '/products?category=Others', mega: ['Chargers', 'Power Banks', 'Microphones', 'Accessories'] },
    { label: t('deals'), href: '/deals', mega: null, red: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900 hidden sm:block">KigaliTech</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.mega && setMegaActive(link.label)}
                  onMouseLeave={() => setMegaActive(null)}
                >
                  <Link
                    href={link.href}
                    className={`px-3 py-2 rounded-full text-sm font-medium no-underline transition-colors ${
                      link.red ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {link.label}
                    {link.mega && (
                      <svg className="inline-block ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                  {link.mega && megaActive === link.label && (
                    <div className="absolute left-0 top-full mt-1 w-52 rounded-2xl border border-slate-100 bg-white py-3 shadow-xl z-50">
                      {link.mega.map((sub) => (
                        <Link
                          key={sub}
                          href={`/products?category=${encodeURIComponent(link.href.split('=')[1])}&sub=${encodeURIComponent(sub)}`}
                          className="block px-5 py-2 text-sm text-slate-600 no-underline hover:bg-sky-50 hover:text-sky-700"
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1.5">
              {/* Language */}
              <div className="hidden sm:block">
                <LanguageSwitcher compact />
              </div>

              {/* Currency */}
              <div className="hidden sm:block">
                <CurrencySwitcher compact />
              </div>

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notification Bell (only when signed in) */}
              {session && <NotificationBell />}

              {/* Account / Avatar */}
              {session ? (
                <div className="relative hidden sm:block group">
                  <button className="flex items-center gap-1.5 rounded-full p-1 text-slate-500 hover:bg-slate-100">
                    {session.user.image
                      ? <img src={session.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                      : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">{(session.user.name || 'U')[0].toUpperCase()}</div>
                    }
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-2xl border border-slate-100 bg-white py-2 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-sm font-semibold text-slate-900 truncate">{session.user.name || 'User'}</p>
                      <p className="text-xs text-slate-400 capitalize">{session.user.role}</p>
                    </div>
                    <Link href="/account" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 no-underline">{t('myAccount')}</Link>
                    <Link href="/account#orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 no-underline">{t('myOrders')}</Link>
                    <Link href="/account#repairs" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 no-underline">{t('repairTickets')}</Link>
                    {(session.user.role === 'admin' || session.user.role === 'staff') && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-sky-600 hover:bg-sky-50 no-underline font-medium">{t('adminPanel')}</Link>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50">{t('signOut')}</button>
                  </div>
                </div>
              ) : (
                <Link href="/signin" className="hidden sm:flex rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 no-underline">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={toggleDrawer}
                className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-slate-100 bg-white px-4 pb-4">
            <div className="py-3 border-b border-slate-50">
              <LanguageSwitcher />
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 text-sm font-medium no-underline border-b border-slate-50 ${
                  link.red ? 'text-red-500' : 'text-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-medium text-slate-700 no-underline border-b border-slate-50">{t('myAccount')}</Link>
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }} className="block py-3 text-sm font-medium text-red-500">{t('signOut')}</button>
              </>
            ) : (
              <Link href="/signin" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-medium text-sky-600 no-underline">{t('signIn')}</Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 pb-16 xl:pb-0">{children}</main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
      <BottomNav />
    </div>
  );
}
