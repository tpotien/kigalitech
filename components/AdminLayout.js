import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/orders', label: 'Orders', icon: '🛒' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/staff', label: 'Staff', icon: '👥' },
  { href: '/admin/customers', label: 'Customers', icon: '👤' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
  { href: '/admin/repairs', label: 'Repairs', icon: '🔧' },
  { href: '/admin/trade-ins', label: 'Trade-Ins', icon: '♻️' },
  { href: '/admin/marketplace', label: 'Marketplace', icon: '🏪' },
  { href: '/admin/flash-sales', label: 'Flash Sales', icon: '⚡' },
  { href: '/admin/returns', label: 'Returns', icon: '↩️' },
  { href: '/admin/delivery-zones', label: 'Delivery Zones', icon: '🚚' },
  { href: '/admin/site-config', label: 'Settings', icon: '⚙️' },
  { href: '/admin/profile', label: 'My Profile', icon: '🧑' },
];

export default function AdminLayout({ children, title }) {
  const { data: session } = useSession();
  const { pathname } = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <img src="/logo.png" alt="KigaliTech" className="h-11 w-11 rounded-full object-cover border-2 border-orange-400/40 flex-shrink-0" />
          <div>
            <p className="font-bold text-white text-sm">KigaliTech</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium no-underline transition-colors ${
                  active ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 px-4 py-4">
          {session?.user && (
            <div className="flex items-center gap-3 mb-3">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                  {(session.user.name || session.user.email || 'A')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.user.name || 'Admin'}</p>
                <p className="text-xs text-slate-400 truncate">{session.user.role}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Link href="/" className="flex-1 rounded-lg bg-slate-800 py-2 text-center text-xs text-slate-300 hover:bg-slate-700 no-underline">
              ← Store
            </Link>
            <button onClick={() => signOut({ callbackUrl: '/signin' })} className="flex-1 rounded-lg bg-slate-800 py-2 text-xs text-slate-300 hover:bg-slate-700">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{title || 'Admin'}</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-500 hover:text-sky-600 no-underline">View Store →</Link>
            {/* Mobile nav */}
            <div className="lg:hidden flex gap-1">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 no-underline text-base">
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
