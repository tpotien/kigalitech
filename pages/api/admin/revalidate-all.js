import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token || token.role !== 'admin') return res.status(403).end();

  const staticPaths = ['/', '/deals', '/products', '/sitemap.xml'];

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true },
  });

  const productPaths = products.map(p => `/products/${p.id}`);
  const allPaths = [...staticPaths, ...productPaths];

  const results = await Promise.allSettled(
    allPaths.map(path => res.revalidate(path))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return res.json({ total: allPaths.length, succeeded, failed });
}
