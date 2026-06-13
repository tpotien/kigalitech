import Link from 'next/link';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center bg-white dark:bg-slate-950">
        {/* Breadcrumb */}
        <nav className="mb-12 text-sm text-slate-400 flex gap-2">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300">404 Error</span>
        </nav>

        {/* Big 404 */}
        <h1 className="text-8xl sm:text-9xl font-extrabold text-slate-900 dark:text-white leading-none mb-6">
          404 Not Found
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-base max-w-sm mb-10">
          Your visited page not found. You may go home page.
        </p>

        <Link
          href="/"
          className="rounded bg-primary hover:bg-primary-hover text-white font-semibold px-12 py-4 text-sm transition-colors"
        >
          Back to Home Page
        </Link>
      </div>
    </Layout>
  );
}
