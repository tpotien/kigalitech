import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  const term = q.trim();

  const products = await prisma.product.findMany({
    where: {
      active: true,
      stock: { gt: 0 },
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, brand: true, category: true, price: true },
    orderBy: { id: 'desc' },
    take: 8,
  });

  return res.json(products);
}
