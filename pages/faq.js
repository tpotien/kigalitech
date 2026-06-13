import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

const FAQS = [
  {
    category: 'Orders & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Same-day delivery is available in Kigali for orders placed before 2PM. For other areas in Rwanda, delivery takes 1–3 business days. You will receive WhatsApp updates on your order status.',
      },
      {
        q: 'How much does delivery cost?',
        a: 'Delivery is FREE for orders over RWF 75,000 in Kigali. Standard delivery fees apply for orders below that amount and depend on your delivery zone. You can see exact fees at checkout.',
      },
      {
        q: 'Can I pick up my order from your store?',
        a: 'Yes! Free store pickup is available at our Kigali location. Simply choose "Pick up at store" during checkout and we will have your order ready.',
      },
      {
        q: 'How do I track my order?',
        a: 'After placing your order, you can track it from your account page under "My Orders". We also send real-time updates via WhatsApp if you opt in during checkout.',
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'You can cancel or modify your order within 1 hour of placing it by contacting us on WhatsApp (+250 786 276 555). Once an order is shipped, cancellations are no longer possible.',
      },
    ],
  },
  {
    category: 'Products & Authenticity',
    items: [
      {
        q: 'Are all products 100% genuine?',
        a: 'Absolutely. KigaliTECH Services only stocks 100% original products sourced directly from authorized distributors. Every product comes with a genuine manufacturer warranty.',
      },
      {
        q: 'Do products come with a warranty?',
        a: 'Yes. All products include the standard manufacturer warranty (typically 1 year). Some items offer extended warranty options that you can add during checkout.',
      },
      {
        q: 'What if the product I want is out of stock?',
        a: 'You can click "Notify Me" on any out-of-stock product page and we will send you an alert the moment it is restocked. You can also contact us to check estimated restock dates.',
      },
      {
        q: 'Can I see a product before buying?',
        a: 'Yes, you are welcome to visit our Kigali store to see and test products in person before purchasing. Our staff are happy to assist.',
      },
    ],
  },
  {
    category: 'Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Mobile Money (MTN MoMo and Airtel Money), cash on delivery, and installment plans. All payment options are available at checkout.',
      },
      {
        q: 'How does the installment plan work?',
        a: 'Our installment plan allows you to split payments over 3–12 months. Select "Installment Plan" at checkout and our team will contact you via WhatsApp to discuss terms.',
      },
      {
        q: 'Is it safe to pay online?',
        a: 'For Mobile Money payments, you send funds directly to our registered MoMo number and share your payment proof on WhatsApp. We verify and confirm your order manually for maximum security.',
      },
      {
        q: 'Do you offer any discounts or coupon codes?',
        a: 'Yes! Subscribe to our newsletter for exclusive deals. We also run Flash Sales regularly. Check the Deals page or follow us on Instagram @kigalitechservices for the latest offers.',
      },
    ],
  },
  {
    category: 'Returns & Repairs',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return policy for products in original condition with all accessories and packaging. Contact us on WhatsApp or email to initiate a return.',
      },
      {
        q: 'What if my product arrives damaged?',
        a: 'If your product arrives damaged or defective, contact us within 48 hours with photos. We will arrange an immediate replacement or refund at no cost to you.',
      },
      {
        q: 'Do you offer repair services?',
        a: 'Yes! We have a dedicated repair team for phones, laptops, tablets, and other electronics. Submit a repair request from your account page or visit our store. We provide quotes before any work begins.',
      },
      {
        q: 'Can I trade in my old device?',
        a: 'Yes. Our Trade-In program lets you exchange your old device for credit toward a new purchase. Visit the Trade-In page, describe your device, and get an instant estimate.',
      },
    ],
  },
  {
    category: 'Account & Other',
    items: [
      {
        q: 'Do I need an account to shop?',
        a: 'You can browse without an account, but creating one lets you track orders, save your wishlist, manage addresses, and earn loyalty points.',
      },
      {
        q: 'How do I earn loyalty points?',
        a: 'You earn points automatically on every purchase. Points accumulate in your account and can be redeemed for discounts on future orders. Check your balance in the Account page.',
      },
      {
        q: 'How do I contact customer support?',
        a: 'You can reach us via WhatsApp at +250 786 276 555 (24/7), email at kigalitechservices@gmail.com, or by visiting our store in Kigali. We typically respond within minutes on WhatsApp.',
      },
    ],
  },
];

function Item({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-ex-border last:border-0 transition-colors ${open ? 'bg-red-50/40' : ''}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <span className={`text-sm font-medium leading-snug ${open ? 'text-primary' : 'text-ex-text'}`}>{q}</span>
        <span className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-primary text-white' : 'bg-ex-gray text-ex-muted'}`}>
          <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-sm text-ex-muted leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(null);
  const displayed = activeCategory ? FAQS.filter(g => g.category === activeCategory) : FAQS;

  return (
    <Layout>
      <div className="max-w-container mx-auto px-4 lg:px-6 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-ex-muted flex items-center gap-2 mb-10">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ex-text font-medium">FAQ</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-50 text-primary text-xs font-semibold px-4 py-1.5 rounded mb-4">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Help Center
          </div>
          <h1 className="text-4xl font-semibold text-ex-text mb-3">Frequently Asked Questions</h1>
          <p className="text-ex-muted text-sm max-w-lg mx-auto">
            Everything you need to know about shopping at KigaliTECH Services.
            Can&apos;t find your answer?{' '}
            <Link href="/contact" className="text-primary hover:underline">Contact us</Link>.
          </p>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2 rounded text-sm font-medium transition-colors ${
              !activeCategory ? 'bg-primary text-white' : 'border border-ex-border text-ex-muted hover:border-primary hover:text-primary'
            }`}
          >
            All
          </button>
          {FAQS.map(g => (
            <button
              key={g.category}
              onClick={() => setActiveCategory(g.category === activeCategory ? null : g.category)}
              className={`px-5 py-2 rounded text-sm font-medium transition-colors ${
                activeCategory === g.category ? 'bg-primary text-white' : 'border border-ex-border text-ex-muted hover:border-primary hover:text-primary'
              }`}
            >
              {g.category}
            </button>
          ))}
        </div>

        {/* FAQ groups */}
        <div className="max-w-3xl mx-auto space-y-8">
          {displayed.map(group => (
            <div key={group.category}>
              <h2 className="text-base font-semibold text-ex-text mb-3 flex items-center gap-2">
                <span className="h-1 w-5 bg-primary rounded-full inline-block" />
                {group.category}
              </h2>
              <div className="border border-ex-border rounded overflow-hidden bg-white">
                {group.items.map(item => <Item key={item.q} q={item.q} a={item.a} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions CTA */}
        <div className="mt-16 text-center bg-ex-gray rounded p-10">
          <h3 className="text-xl font-semibold text-ex-text mb-2">Still have questions?</h3>
          <p className="text-sm text-ex-muted mb-6">Our support team is available 24/7 via WhatsApp.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/250786276555"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bf5b] text-white font-medium px-6 py-3 rounded text-sm transition-colors"
            >
              <svg viewBox="0 0 32 32" className="h-4 w-4 fill-white flex-shrink-0"><path d="M16.004 2C8.276 2 2 8.268 2 15.986c0 2.458.64 4.866 1.856 6.98L2 30l7.236-1.822A14.022 14.022 0 0016.004 30C23.724 30 30 23.732 30 16.014 30 8.268 23.724 2 16.004 2z"/></svg>
              Chat on WhatsApp
            </a>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-ex-border text-ex-text hover:border-primary hover:text-primary font-medium px-6 py-3 rounded text-sm transition-colors">
              Send a Message
            </Link>
          </div>
        </div>

      </div>
    </Layout>
  );
}
