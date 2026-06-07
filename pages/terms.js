import Layout from '../components/Layout';
import Link from 'next/link';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using KigaliTech's website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.`,
  },
  {
    title: '2. Products & Pricing',
    body: `All products listed are subject to availability. Prices are displayed in your selected currency and may change without notice. We reserve the right to cancel orders where pricing errors have occurred, with a full refund issued promptly. All prices include applicable taxes unless stated otherwise.`,
  },
  {
    title: '3. Orders & Payment',
    body: `An order confirmation email does not constitute acceptance of your order — acceptance occurs when your order is dispatched. We accept credit/debit cards, MTN Mobile Money, Airtel Money, and cash on delivery. Payment is due at time of order unless an instalment plan has been agreed in writing.`,
  },
  {
    title: '4. Delivery',
    body: `We aim to deliver within Kigali on the same or next business day. Delivery to other provinces typically takes 1–3 business days. Delivery times are estimates and not guaranteed. Risk of loss passes to you upon delivery.`,
  },
  {
    title: '5. Returns & Refunds',
    body: `You may return an item within 7 days of delivery if it is unused, in original packaging, and accompanied by your receipt. Damaged or defective items can be returned within 30 days. Refunds are processed within 5 business days to your original payment method. Items showing signs of use or damage are not eligible for return.`,
  },
  {
    title: '6. Warranty',
    body: `All new products carry a minimum 1-year manufacturer warranty. KigaliTech provides a separate 6-month service warranty on repairs carried out in our workshop. Warranties do not cover accidental damage, liquid damage, or unauthorised modifications.`,
  },
  {
    title: '7. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised access. We reserve the right to suspend accounts that violate these terms or engage in fraudulent activity.`,
  },
  {
    title: '8. Intellectual Property',
    body: `All content on this website — including product descriptions, images, logos, and software — is owned by or licensed to KigaliTech. You may not reproduce, distribute, or create derivative works without our written consent.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `KigaliTech's liability for any claim arising from these terms shall not exceed the amount you paid for the relevant product. We are not liable for indirect, incidental, or consequential damages. Nothing in these terms limits liability for death, personal injury, or fraud.`,
  },
  {
    title: '10. Governing Law',
    body: `These terms are governed by the laws of the Republic of Rwanda. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kigali, Rwanda.`,
  },
];

export default function TermsPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Legal</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-slate-100">Terms of Service</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Last updated: June 2026</p>
          <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
            Please read these terms carefully before using KigaliTech's website and services. These terms constitute a legally binding agreement between you and KigaliTech Rwanda Ltd.
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

        <div className="mt-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-600 dark:text-slate-400">
          Questions about these terms? <Link href="/contact" className="font-semibold text-sky-600 underline hover:text-sky-700">Contact us</Link> or email legal@kigalitech.com.
        </div>
      </div>
    </Layout>
  );
}
