import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLang } from '../context/LanguageContext';
import dynamic from 'next/dynamic';
import SearchAutocomplete from './SearchAutocomplete';
import NotificationBell from './NotificationBell';
import BottomNav from './BottomNav';
import AvatarWithBadge from './AvatarWithBadge';

const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });
const AIChatWidget = dynamic(() => import('./AIChatWidget'), { ssr: false });

async function doSignOut() {
  try {
    localStorage.removeItem('cart');
    localStorage.removeItem('kt_rv');
    localStorage.removeItem('referralCode');
    localStorage.removeItem('currency');
    sessionStorage.clear();
  } catch {}
  await signOut({ redirect: false });
  window.location.replace('/');
}

const NAV_LINKS = [
  { label: 'Home',     href: '/' },
  { label: 'Contact',  href: '/contact' },
  { label: 'About',    href: '/about' },
];

const FOOTER_COL1 = [
  { label: 'My Account',      href: '/account' },
  { label: 'Login / Register', href: '/signin' },
  { label: 'Cart',             href: '/cart' },
  { label: 'Wishlist',         href: '/wishlist' },
  { label: 'Shop',             href: '/products' },
];
const FOOTER_COL2 = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use',   href: '/terms' },
  { label: 'FAQ',            href: '/faq' },
  { label: 'Contact',        href: '/contact' },
];
const FOOTER_COL3 = [
  { label: 'Repairs',    href: '/repairs' },
  { label: 'Trade-In',   href: '/trade-in' },
  { label: 'Bulk Order', href: '/bulk-order' },
  { label: 'Deals',      href: '/deals' },
  { label: 'Referral',   href: '/referral' },
];

export default function Layout({ children }) {
  const { itemCount, toggleDrawer } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [router.asPath]);

  const isActive = (href) => router.pathname === href;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* ── Announcement bar ─────────────────────────────────────────────── */}
      <div style={{ background: '#1D2026' }} className="text-white text-xs py-2.5 px-4">
        <div className="max-w-container mx-auto flex items-center justify-center gap-2 text-center">
          <span className="text-gray-300">
            Summer Sale For All Electronics &amp; Free Express Delivery — OFF 10%!
          </span>
          <Link href="/deals" className="font-semibold underline underline-offset-2 text-white hover:text-primary">
            ShopNow
          </Link>
        </div>
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-30 bg-white ${scrolled ? 'shadow-sm' : ''} transition-shadow`}>
        <div className="max-w-container mx-auto px-4 lg:px-6">
          <div className="flex items-center h-[70px] gap-6 lg:gap-10">

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-1.5 text-ex-text"
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <img src="/logo.png" alt="KigaliTECH Services" className="h-10 w-10 object-contain flex-shrink-0" />
              <span className="font-bold tracking-tight leading-none hidden sm:block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span className="text-[#1D2026] text-lg">Kigali</span><span className="text-primary text-lg">TECH</span>
                <span className="block text-[9px] font-semibold text-gray-400 uppercase tracking-[0.2em] -mt-0.5 text-center">Services</span>
              </span>
            </Link>

            {/* Nav links (desktop) */}
            <nav className="hidden lg:flex items-center gap-8 flex-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.href) ? 'text-ex-text border-b-2 border-ex-text pb-0.5' : 'text-gray-500'}`}
                >
                  {link.label}
                </Link>
              ))}
              {!session && (
                <Link href="/signin" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">
                  Sign Up
                </Link>
              )}
            </nav>

            {/* Search bar */}
            <div className="hidden lg:flex flex-1 max-w-[350px]">
              <SearchAutocomplete placeholder="What are you looking for?" />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3 ml-auto lg:ml-0">

              {/* Mobile search icon */}
              <button className="lg:hidden text-ex-text" onClick={() => router.push('/products')}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {session && <NotificationBell />}

              {/* Wishlist */}
              <Link href="/wishlist" className="relative text-ex-text hover:text-primary transition-colors" aria-label="Wishlist">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistIds.size > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistIds.size > 9 ? '9+' : wishlistIds.size}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative text-ex-text hover:text-primary transition-colors" aria-label="Cart">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User */}
              {session ? (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <AvatarWithBadge
                      image={session.user.image}
                      name={session.user.name || session.user.email}
                      role={session.user.role}
                      emailVerified={session.user.emailVerified}
                      size="sm"
                    />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-ex-border rounded shadow-lg py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-ex-border">
                      <AvatarWithBadge
                        image={session.user.image}
                        name={session.user.name || session.user.email}
                        role={session.user.role}
                        emailVerified={session.user.emailVerified}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ex-text truncate">{session.user.name}</p>
                        <p className="text-xs text-ex-muted truncate">{session.user.email}</p>
                      </div>
                    </div>
                    <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-sm text-ex-text hover:bg-ex-gray">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Account
                    </Link>
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-ex-text hover:bg-ex-gray">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      My Orders
                    </Link>
                    <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2 text-sm text-ex-text hover:bg-ex-gray">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      Wishlist
                    </Link>
                    {(session.user.role === 'admin' || session.user.role === 'staff') && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-primary font-semibold hover:bg-ex-gray">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-ex-border" />
                    <button onClick={doSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-ex-gray">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/signin" className="text-ex-text hover:text-primary transition-colors" aria-label="Sign In">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-ex-border bg-white px-4 py-4 space-y-3">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="block text-sm font-medium text-ex-text py-1.5">{link.label}</Link>
            ))}
            {!session && <Link href="/signin" className="block text-sm font-medium text-ex-text py-1.5">Sign Up</Link>}
            <Link href="/products" className="block text-sm font-medium text-ex-text py-1.5">All Products</Link>
            <Link href="/deals" className="block text-sm font-medium text-primary py-1.5">Deals</Link>
            <div className="pt-2">
              <SearchAutocomplete placeholder="Search products…" />
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#1D2026' }} className="text-gray-400">
        <div className="max-w-container mx-auto px-4 lg:px-6 pt-16 pb-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 mb-12">

            {/* Col 1 — Brand + newsletter */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-5">
                <img src="/logo.png" alt="KigaliTECH Services" className="h-10 w-10 object-contain flex-shrink-0" />
                <span className="font-bold tracking-tight leading-none">
                  <span className="text-white text-base">Kigali</span><span className="text-primary text-base">TECH</span>
                  <span className="block text-[8px] font-semibold text-gray-500 uppercase tracking-[0.2em] -mt-0.5 text-center">Services</span>
                </span>
              </Link>
              <p className="text-sm mb-4">Subscribe for exclusive deals &amp; early access.</p>
              <form
                onSubmit={e => { e.preventDefault(); const em = e.target.querySelector('input').value; if (em) window.alert('Thank you for subscribing!'); }}
                className="flex gap-0"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent border border-gray-600 rounded-l px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-primary"
                />
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-r text-xs font-medium transition-colors">
                  →
                </button>
              </form>
            </div>

            {/* Col 2 — Support */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
              <address className="not-italic text-xs space-y-2 leading-relaxed">
                <p>KN 74 St, Kigali, Rwanda</p>
                <p>kigalitechservices@gmail.com</p>
                <p>+250 786 276 555</p>
              </address>
            </div>

            {/* Col 3 — Account */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Account</h4>
              <ul className="space-y-2.5 text-xs">
                {FOOTER_COL1.map(l => (
                  <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Quick Link */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Quick Link</h4>
              <ul className="space-y-2.5 text-xs">
                {FOOTER_COL2.map(l => (
                  <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Col 5 — Services */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Services</h4>
              <ul className="space-y-2.5 text-xs">
                {FOOTER_COL3.map(l => (
                  <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
              {/* Socials */}
              <div className="flex gap-3 mt-6">
                {[
                  { href: 'https://www.facebook.com/kigalitechservices/', label: 'FB', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                  { href: 'https://twitter.com', label: 'TW', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                  { href: 'https://www.instagram.com/kigalitechservices/', label: 'IG', path: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a2 2 0 002-2v-11a2 2 0 00-2-2h-11a2 2 0 00-2 2v11a2 2 0 002 2z' },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-white hover:text-white transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={s.path} /></svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} KigaliTECH Services. All rights reserved.
          </div>
        </div>
      </footer>

      <BottomNav />
      <CartDrawer />
      <AIChatWidget />
    </div>
  );
}
