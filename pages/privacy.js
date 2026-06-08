import Layout from '../components/Layout';
import Link from 'next/link';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `When you create an account or place an order, we collect your name, email address, phone number, and delivery address. We also collect payment method type (we do not store card numbers — those are handled by our payment processors). We automatically collect browsing data such as pages viewed, products searched, and device type to improve your experience.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information to process and deliver orders, send order confirmations and tracking updates, provide customer support, and personalise product recommendations. With your consent, we may send promotional emails about deals and new arrivals. We do not sell your personal data to any third party.`,
  },
  {
    title: '3. Data Sharing',
    body: `We share necessary order information with delivery partners (name, address, phone) to complete delivery. We share payment data with payment processors (Stripe, MTN Mobile Money, Airtel) solely to process transactions. All third parties are bound by data processing agreements.`,
  },
  {
    title: '4. Cookies',
    body: `We use essential cookies for authentication and cart functionality. We use analytics cookies (with your consent) to understand how visitors use our site. You can manage cookie preferences through your browser settings.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain account and order data for 7 years to comply with Rwandan tax and business laws. You may request deletion of your account at any time; order records may be retained for legal compliance.`,
  },
  {
    title: '6. Your Rights',
    body: `You have the right to access your personal data, correct inaccurate information, request deletion of your account, and opt out of marketing emails at any time via the unsubscribe link in any email. To exercise these rights, contact us at privacy@kigalitechservices.com.`,
  },
  {
    title: '7. Security',
    body: `We use industry-standard encryption (TLS/HTTPS) for all data transmission. Passwords are hashed using bcrypt and never stored in plain text. We conduct regular security reviews and promptly address any vulnerabilities.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this policy from time to time. When we do, we will notify registered users by email and update the "Last updated" date below. Continued use of our service after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Legal</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Last updated: June 2026</p>
          <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
            At KigaliTech, we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our website and services.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map(s => (
            <div key={s.title} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">{s.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 p-6 text-sm text-sky-800 dark:text-sky-300">
          Questions about this policy? <Link href="/contact" className="font-semibold underline hover:text-sky-600">Contact our team</Link> — we're happy to help.
        </div>
      </div>
    </Layout>
  );
}
