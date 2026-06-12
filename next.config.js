/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    scrollRestoration: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  compress: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/api/products',
      headers: [{ key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate=300' }],
    },
    {
      source: '/api/delivery-zones',
      headers: [{ key: 'Cache-Control', value: 's-maxage=300, stale-while-revalidate=600' }],
    },
    {
      source: '/api/trending',
      headers: [{ key: 'Cache-Control', value: 's-maxage=120, stale-while-revalidate=300' }],
    },
    {
      source: '/api/flash-sale-active',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=120, stale-while-revalidate=300' }],
    },
    {
      source: '/api/search/autocomplete',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
    },
    {
      source: '/api/search',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
    },
    {
      source: '/api/nav-products',
      headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
    },
  ],
};
module.exports = nextConfig;
