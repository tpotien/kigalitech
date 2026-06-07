const BASE_URL = 'https://electronics-shop-amber.vercel.app';

export async function getServerSideProps({ res }) {
  const content = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.write(content);
  res.end();

  return { props: {} };
}

export default function RobotsTxtPage() {
  return null;
}
