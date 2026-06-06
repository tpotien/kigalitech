import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { useSession } from 'next-auth/react';

export default function BottomNav() {
  const { pathname } = useRouter();
  const { itemCount, toggleDrawer } = useCart();
  const { t } = useLang();
  const { data: session } = useSession();

  const active = (p) => pathname === p || pathname.startsWith(p + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md xl:hidden safe-bottom">
      <div className="grid grid-cols-5 h-16">
        <Link href="/" className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium no-underline transition-colors ${active('/') && pathname === '/' ? 'text-sky-600' : 'text-slate-500'}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active('/') && pathname === '/' ? 2.5 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>{t('home')}</span>
        </Link>

        <Link href="/products" className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium no-underline transition-colors ${active('/products') ? 'text-sky-600' : 'text-slate-500'}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active('/products') ? 2.5 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Shop</span>
        </Link>

        <button
          onClick={toggleDrawer}
          className="relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-500"
        >
          <div className="relative">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[8px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
          <span>{t('cart')}</span>
        </button>

        <Link href="/marketplace" className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium no-underline transition-colors ${active('/marketplace') ? 'text-sky-600' : 'text-slate-500'}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active('/marketplace') ? 2.5 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Market</span>
        </Link>

        <Link href={session ? '/account' : '/signin'} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium no-underline transition-colors ${active('/account') || active('/signin') ? 'text-sky-600' : 'text-slate-500'}`}>
          {session?.user?.image
            ? <img src={session.user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
            : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
          }
          <span>{session ? t('myAccount').split(' ')[0] : t('signIn').split(' ')[0]}</span>
        </Link>
      </div>
    </nav>
  );
}
