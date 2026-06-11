import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';

async function doSignOut() {
  // Clear all client-side state so nothing leaks back
  try {
    localStorage.removeItem('cart');
    localStorage.removeItem('kt_rv');
    localStorage.removeItem('referralCode');
    localStorage.removeItem('currency');
    sessionStorage.clear();
  } catch {}
  await signOut({ redirect: false });
  // replace() removes this page from browser history — back button skips it
  window.location.replace('/');
}
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import dynamic from 'next/dynamic';
import SearchModal from './SearchModal';
import SearchAutocomplete from './SearchAutocomplete';
import NotificationBell from './NotificationBell';
import CurrencySwitcher from './CurrencySwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import BottomNav from './BottomNav';
import AvatarWithBadge from './AvatarWithBadge';
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });
const AIChatWidget = dynamic(() => import('./AIChatWidget'), { ssr: false });

// Module-level cache: survives re-mounts and route changes within the same tab.
// Keys are URL strings, values are { data, expiresAt }.
const _cache = {};
async function cachedFetch(url, ttlMs) {
  const now = Date.now();
  if (_cache[url] && _cache[url].expiresAt > now) return _cache[url].data;
  const data = await fetch(url).then(r => r.json());
  _cache[url] = { data, expiresAt: now + ttlMs };
  return data;
}

const ANNOUNCEMENTS = [
  '🚚 Free delivery on orders over RWF 75,000 — Rwanda-wide',
  '🔒 Official warranties on every product',
  '♻️ Trade-in your old device for credit',
  '📞 Support: +250 786 276 555',
];

export default function Layout({ children }) {
  const { itemCount, toggleDrawer } = useCart();
  const { data: session } = useSession();
  const { t } = useLang();
  const { format } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaActive, setMegaActive] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navProducts, setNavProducts] = useState({});
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [logoUrl, setLogoUrl] = useState('/logo.png');

  useEffect(() => {
    cachedFetch('/api/nav-products', 5 * 60_000).then(setNavProducts).catch(() => {});
    cachedFetch('/api/hero', 5 * 60_000).then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl); }).catch(() => {});
  }, []);

  // Rotate announcements
  useEffect(() => {
    const t = setInterval(() => setAnnouncementIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const NAV_LINKS = [
    { label: t('phones'),    href: '/products?category=Phones',     cat: 'Phones' },
    { label: t('laptops'),   href: '/products?category=Laptops',    cat: 'Laptops' },
    { label: t('audio'),     href: '/products?category=Headphones', cat: 'Headphones' },
    { label: t('tvs'),       href: '/products?category=TVs',        cat: 'TVs' },
    { label: t('wearables'), href: '/products?category=Wearables',  cat: 'Wearables' },
    { label: 'Gaming',       href: '/products?category=Gaming',     cat: 'Gaming' },
    { label: t('others'),    href: '/products?category=Others',     cat: 'Others' },
    { label: t('deals'),     href: '/deals', cat: null, red: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* ── Tier 1: Announcement bar ── */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-9 items-center justify-between text-xs font-medium">
            {/* Rotating announcement (mobile: centered; desktop: left) */}
            <p className="flex-1 text-center sm:text-left truncate text-slate-300 transition-all">
              {ANNOUNCEMENTS[announcementIdx]}
            </p>
            {/* Right links */}
            <div className="hidden sm:flex items-center gap-5 flex-shrink-0 ml-4">
              <Link href="/trade-in" className="text-slate-400 hover:text-white no-underline transition-colors">Trade-In</Link>
              <Link href="/repairs" className="text-slate-400 hover:text-white no-underline transition-colors">Repairs</Link>
              <Link href="/bulk-order" className="text-slate-400 hover:text-white no-underline transition-colors">Bulk Order</Link>
              <div className="text-slate-600">|</div>
              <CurrencySwitcher compact />
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky wrapper ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-md">

        {/* ── Tier 2: Logo + Search + Icons ── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center gap-4 lg:gap-6">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
              <img src={logoUrl} alt="KigaliTech" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shadow-sm" />
              <div className="min-w-0">
                <span className="block text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight whitespace-nowrap">KigaliTech</span>
                <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-widest text-sky-500 dark:text-sky-400 mt-0.5 whitespace-nowrap">Premium Electronics</span>
              </div>
            </Link>

            {/* ── Inline search bar (desktop) ── */}
            <SearchAutocomplete
              className="hidden lg:block flex-1 max-w-2xl"
              placeholder="Search phones, laptops, earbuds, TVs…"
            />

            {/* ── Right icons ── */}
            <div className="flex items-center gap-1 ml-auto lg:ml-0 flex-shrink-0">

              {/* Mobile search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="lg:hidden rounded-full p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Search"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="rounded-full p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark'
                  ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                }
              </button>

              {session && <NotificationBell />}

              {/* Account */}
              {session ? (
                <div className="relative hidden sm:block group">
                  <button className="flex items-center gap-2 rounded-full px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors">
                    <AvatarWithBadge image={session.user.image} name={session.user.name} role={session.user.role} emailVerified={session.user.emailVerified} size="sm" />
                    <span className="hidden xl:block text-sm font-semibold max-w-[80px] truncate">{session.user.name?.split(' ')[0] || 'Account'}</span>
                    <svg className="hidden xl:block h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-bold text-slate-900 truncate">{session.user.name || 'User'}</p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{session.user.email}</p>
                    </div>
                    <Link href="/account" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 no-underline">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {t('myAccount')}
                    </Link>
                    <Link href="/account" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 no-underline">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      {t('myOrders')}
                    </Link>
                    {(session.user.role === 'admin' || session.user.role === 'staff') && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-sky-600 hover:bg-sky-50 no-underline font-semibold">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        {t('adminPanel')}
                      </Link>
                    )}
                    <hr className="my-1 border-slate-100 dark:border-slate-700" />
                    <button onClick={doSignOut} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      {t('signOut')}
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/signin" className="hidden sm:flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 no-underline transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={toggleDrawer}
                className="relative flex items-center gap-2 rounded-full px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="hidden xl:block text-sm font-semibold">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute right-1 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden rounded-full p-2.5 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

        {/* ── Tier 3: Category nav row (desktop) ── */}
        <div className="hidden xl:block border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center h-12 gap-0.5">
              {NAV_LINKS.map((link) => {
                const products = link.cat ? (navProducts[link.cat] || []) : [];
                const hasMega = !!link.cat;
                return (
                  <div
                    key={link.label}
                    className="relative h-full flex items-center"
                    onMouseEnter={() => hasMega && setMegaActive(link.label)}
                    onMouseLeave={() => setMegaActive(null)}
                  >
                    <Link
                      href={link.href}
                      className={`px-4 h-full flex items-center gap-1 text-[15px] font-bold no-underline transition-colors border-b-2 ${
                        link.red
                          ? 'text-red-500 hover:text-red-600 border-transparent hover:border-red-400'
                          : 'text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 border-transparent hover:border-sky-600'
                      }`}
                    >
                      {link.label}
                      {hasMega && (
                        <svg className="h-3 w-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </Link>

                    {/* Mega menu */}
                    {hasMega && megaActive === link.label && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 w-[520px]">
                        <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl shadow-slate-200/60 overflow-hidden mt-0.5">
                          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{link.label}</span>
                            <Link href={link.href} className="text-xs font-bold text-sky-600 no-underline hover:text-sky-700">View all →</Link>
                          </div>
                          {products.length > 0 ? (
                            <div className="grid grid-cols-4 gap-0 p-3">
                              {products.map((p) => (
                                <Link key={p.id} href={`/products/${p.id}`}
                                  className="group flex flex-col items-center gap-2 rounded-xl p-2.5 no-underline hover:bg-sky-50 transition-colors">
                                  <div className="h-20 w-20 rounded-xl bg-slate-50 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-600">
                                    <span className="text-2xl">
                                      {link.label === 'Phones' ? '📱' : link.label === 'Laptops' ? '💻' : link.label === 'TVs' ? '📺' : link.label === 'Headphones' ? '🎧' : link.label === 'Wearables' ? '⌚' : link.label === 'Gaming' ? '🎮' : '📦'}
                                    </span>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2 group-hover:text-sky-700 dark:group-hover:text-sky-400">{p.name}</p>
                                    <p className="mt-0.5 text-xs font-bold text-sky-600">{format(p.price)}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="px-5 py-8 text-center text-sm text-slate-400">Loading products…</div>
                          )}
                          <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 bg-slate-50/60 dark:bg-slate-800/60">
                            <Link href={link.href}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2 text-xs font-bold text-white no-underline hover:bg-sky-700 transition-colors">
                              Browse all {link.label}
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Extra links */}
              <div className="ml-auto flex items-center gap-4 h-full text-[13px] font-semibold text-slate-500">
                <Link href="/trade-in" className="hover:text-sky-600 no-underline transition-colors hidden xl:block">Trade-In</Link>
                <Link href="/repairs" className="hover:text-sky-600 no-underline transition-colors hidden xl:block">Repairs</Link>
                <Link href="/bulk-order" className="hover:text-sky-600 no-underline transition-colors hidden xl:block">Bulk Order</Link>
                <Link href="/marketplace" className="hover:text-sky-600 no-underline transition-colors">Marketplace</Link>
              </div>
            </nav>
          </div>
        </div>

        {/* ── Mobile Nav drawer ── */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto max-h-[calc(100svh-5rem)]">
            {/* Mobile search */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <SearchAutocomplete
                placeholder="Search products…"
                onNavigate={() => setMobileOpen(false)}
              />
            </div>

            {/* All nav links */}
            <div className="px-4 py-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-3.5 text-[15px] font-bold no-underline border-b border-slate-100 dark:border-slate-800 ${link.red ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                  {link.label}
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}

              {/* Extra pages */}
              {[
                { href: '/trade-in',    label: 'Trade-In' },
                { href: '/repairs',     label: 'Repairs' },
                { href: '/marketplace', label: 'Marketplace' },
                { href: '/bulk-order',  label: 'Bulk Order' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-3.5 text-[15px] font-bold text-slate-800 dark:text-slate-100 no-underline border-b border-slate-100 dark:border-slate-800">
                  {label}
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* Footer actions — extra bottom padding so BottomNav never covers these */}
            <div className="px-4 pt-3 pb-28 border-t border-slate-100 dark:border-slate-800">
              <LanguageSwitcher />
              {session ? (
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
              ) : (
                <Link href="/signin" onClick={() => setMobileOpen(false)}
                  className="mt-3 block w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white text-center no-underline">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pb-16 xl:pb-0">{children}</main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
      <BottomNav />
      <AIChatWidget />
    </div>
  );
}
