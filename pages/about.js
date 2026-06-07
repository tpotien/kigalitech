import Layout from '../components/Layout';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-white dark:bg-slate-950">
        {/* Hero */}
        <div className="bg-slate-900 px-4 py-20 text-center sm:px-6 lg:px-8">
          <img src="/logo.png" alt="KigaliTech" className="mx-auto mb-5 h-20 w-20 rounded-full object-cover border-2 border-orange-400/40 shadow-xl" />
          <h1 className="text-4xl font-extrabold text-white">About KigaliTech</h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-slate-300">
            Rwanda's premier destination for premium electronics — phones, laptops, audio gear, gaming consoles, and more.
          </p>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
          {/* Mission */}
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Our Mission</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Bringing the world's best tech to Kigali</h2>
              <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                KigaliTech was founded with a simple goal: make premium, genuine electronics accessible to everyone in Rwanda. We stock the latest flagships from Apple, Samsung, Sony, and more — all 100% authentic, with full warranty support.
              </p>
              <p className="mt-3 text-slate-500 dark:text-slate-400 leading-relaxed">
                From the newest iPhone to professional laptops, noise-cancelling headphones, and gaming consoles — if it's technology, we carry it.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Products', value: '200+' },
                { label: 'Brands', value: '15+' },
                { label: 'Customers Served', value: '5,000+' },
                { label: 'Years in Business', value: '5+' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 p-6 text-center">
                  <p className="text-3xl font-extrabold text-sky-600">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600 text-center">Why Choose Us</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white text-center mb-10">Our promise to you</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { icon: '🔒', title: '100% Genuine', desc: 'Every product is sourced directly from authorised distributors. No fakes, no grey market.' },
                { icon: '🛠️', title: 'Repair & Support', desc: 'Our certified technicians handle repairs, software issues, and warranty claims in-house.' },
                { icon: '🚀', title: 'Fast Delivery', desc: 'Same-day delivery in Kigali, next-day to major Rwanda provinces. Track your order live.' },
              ].map(v => (
                <div key={v.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
                  <div className="text-3xl mb-3">{v.icon}</div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{v.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900">
                <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Visit Our Store</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-1">KN 74St, infront of Al madina mosque</p>
                <p className="text-slate-600 dark:text-slate-300">Kigali, Rwanda</p>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">📞 +250 786 276 555</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">🕒 Mon–Sat: 8:00 AM – 8:00 PM</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-3xl bg-slate-900 px-8 py-12 text-center">
            <h2 className="text-2xl font-extrabold text-white">Ready to shop?</h2>
            <p className="mt-2 text-slate-400">Browse our full catalogue of premium electronics.</p>
            <Link href="/products" className="mt-6 inline-block rounded-full bg-sky-600 px-8 py-3 font-semibold text-white no-underline hover:bg-sky-500">
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
