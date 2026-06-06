import { useState } from 'react';
import Link from 'next/link';
import prisma from '../lib/prisma';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import CountdownTimer from '../components/CountdownTimer';
import QuickViewModal from '../components/QuickViewModal';
import Footer from '../components/Footer';
import { useLang } from '../context/LanguageContext';

export async function getStaticProps() {
  const products = await prisma.product.findMany({ where: { active: true } });
  return { props: { products: JSON.parse(JSON.stringify(products)) }, revalidate: 60 };
}

export default function DealsPage({ products }) {
  const { t } = useLang();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const saleProducts = products.filter(p => p.comparePrice && p.comparePrice > p.price);
  const flashDeal = products.find(p => p.name && p.name.includes('XM6')) || saleProducts[0] || null;

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-sm font-bold text-red-400 mb-4">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live Deals
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Today's Best Deals</h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">
              Limited time offers on premium electronics. New deals drop every day — don't miss out.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {['Up to 30% Off', 'Free Shipping', 'Real Warranties'].map(tag => (
                <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Flash Deal Timer */}
        {flashDeal && <CountdownTimer product={flashDeal} />}

        {/* All Deals */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-600">Limited Offers</p>
              <h2 className="mt-1 text-3xl font-extrabold text-slate-900">All Deals</h2>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              {saleProducts.length} deals available
            </span>
          </div>

          {saleProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {saleProducts.map(product => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
              <div className="mx-auto mb-4 text-6xl">🏷️</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">New deals coming soon!</h3>
              <p className="text-slate-500 mb-6">Check back daily for flash sales and exclusive offers.</p>
              <Link
                href="/products"
                className="inline-flex rounded-full bg-sky-600 px-7 py-3 font-semibold text-white hover:bg-sky-700 no-underline"
              >
                Browse All Products
              </Link>
            </div>
          )}
        </section>

        <Footer />
      </div>

      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </Layout>
  );
}
