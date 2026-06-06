import Layout from '../components/Layout';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <Layout>
      <div className="bg-white">
        {/* Hero */}
        <div className="bg-slate-900 px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
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
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Bringing the world's best tech to Kigali</h2>
              <p className="mt-4 text-slate-500 leading-relaxed">
                KigaliTech was founded with a simple goal: make premium, genuine electronics accessible to everyone in Rwanda. We stock the latest flagships from Apple, Samsung, Sony, and more — all 100% authentic, with full warranty support.
              </p>
              <p className="mt-3 text-slate-500 leading-relaxed">
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
                <div key={stat.label} className="rounded-2xl bg-sky-50 border border-sky-100 p-6 text-center">
                  <p className="text-3xl font-extrabold text-sky-600">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600 text-center">Why Choose Us</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 text-center mb-10">Our promise to you</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { icon: '🔒', title: '100% Genuine', desc: 'Every product is sourced directly from authorised distributors. No fakes, no grey market.' },
                { icon: '🛠️', title: 'Repair & Support', desc: 'Our certified technicians handle repairs, software issues, and warranty claims in-house.' },
                { icon: '🚀', title: 'Fast Delivery', desc: 'Same-day delivery in Kigali, next-day to major Rwanda provinces. Track your order live.' },
              ].map(v => (
                <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="text-3xl mb-3">{v.icon}</div>
                  <h3 className="font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
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
