import prisma from '../lib/prisma';

const BASE_URL = 'https://kigalitechservices.com';

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/products', priority: '0.9', changefreq: 'daily' },
  { path: '/deals', priority: '0.8', changefreq: 'daily' },
  { path: '/repairs', priority: '0.7', changefreq: 'weekly' },
  { path: '/marketplace', priority: '0.7', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/signin', priority: '0.3', changefreq: 'monthly' },
];

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function buildSitemap(staticPages, products) {
  const staticEntries = staticPages
    .map(
      ({ path, priority, changefreq }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('');

  const productEntries = products
    .map(
      (p) => `
  <url>
    <loc>${BASE_URL}/products/${p.id}</loc>
    <lastmod>${formatDate(p.updatedAt || p.createdAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${productEntries}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  let products = [];

  try {
    products = await prisma.product.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  } catch (err) {
    console.error('[sitemap.xml] Prisma error:', err.message);
  }

  const xml = buildSitemap(STATIC_PAGES, products);

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SitemapPage() {
  return null;
}
