import Link from 'next/link';
import { useLang } from '../context/LanguageContext';

const CATEGORIES = [
  {
    key: 'phones', name: 'Phones', icon: '📱', desc: 'Latest Flagships & Budget',
    href: '/products?category=Phones',
    img: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'laptops', name: 'Laptops', icon: '💻', desc: 'Gaming, Ultra & Pro',
    href: '/products?category=Laptops',
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'tvs', name: 'TVs', icon: '📺', desc: 'Smart, OLED & 4K',
    href: '/products?category=TVs',
    img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'audio', name: 'Audio', icon: '🎧', desc: 'ANC & Studio Sound',
    href: '/products?category=Audio',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'wearables', name: 'Wearables', icon: '⌚', desc: 'Smart Watches & Bands',
    href: '/products?category=Wearables',
    img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'gaming', name: 'Gaming', icon: '🎮', desc: 'Consoles, Controllers & More',
    href: '/products?category=Gaming',
    img: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'tablets', name: 'Tablets', icon: '📱', desc: 'iPad, Galaxy Tab & More',
    href: '/products?category=Tablets',
    img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'cameras', name: 'Cameras', icon: '📷', desc: 'DSLR, Mirrorless & Action',
    href: '/products?category=Cameras',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'accessories', name: 'Accessories', icon: '🔋', desc: 'Cables, Cases & Power',
    href: '/products?category=Accessories',
    img: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
  },
  {
    key: 'smarthome', name: 'Smart Home', icon: '🏠', desc: 'Speakers, Bulbs & Hubs',
    href: '/products?category=Smart Home',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
  },
];

export default function FeaturedCategories() {
  const { t } = useLang();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">{t('categories')}</p>
          <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">Browse by Category</h2>
        </div>
        <Link href="/products" className="text-sm font-medium text-sky-600 hover:text-sky-800 no-underline">
          {t('viewAll')} →
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="group relative overflow-hidden rounded-3xl no-underline aspect-[3/4] sm:aspect-auto sm:h-48 xl:h-52"
          >
            {/* Product photo fills entire card */}
            <img
              src={cat.img}
              alt={cat.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Dark gradient for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5 transition-all duration-300 group-hover:from-black/70" />

            {/* Content */}
            <div className="relative flex h-full flex-col justify-between px-5 py-5">
              <span className="text-3xl drop-shadow-lg">{cat.icon}</span>
              <div>
                <h3 className="text-lg font-bold leading-tight text-white drop-shadow">{t(cat.key)}</h3>
                <p className="mt-0.5 text-xs text-white/75">{cat.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white transition-all group-hover:bg-white/30">
                  {t('shopNow')}
                  <svg className="h-3 w-3 translate-x-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
