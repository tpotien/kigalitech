import Link from 'next/link';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="max-w-container mx-auto px-4 lg:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-ex-muted flex items-center gap-2 mb-20">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ex-text font-medium">404 Error</span>
        </nav>

        <div className="flex flex-col items-center text-center pb-28">
          <h1 className="text-[110px] sm:text-[160px] font-semibold text-ex-text leading-none mb-6 tracking-tight">
            404
          </h1>
          <p className="text-ex-text text-base mb-10 max-w-sm">
            Your visited page not found. You may go home page.
          </p>
          <Link href="/" className="btn-primary inline-block px-12 py-4">
            Back to Home Page
          </Link>
        </div>
      </div>
    </Layout>
  );
}
