import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  const term = q.trim();

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { tags: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true, name: true, brand: true, category: true,
      price: true, comparePrice: true, stock: true,
    },
    orderBy: [{ featured: 'desc' }, { id: 'desc' }],
    take: 10,
  });

  const results = products.map((p) => {
    const discount = p.comparePrice && p.comparePrice > p.price
      ? Math.round((1 - p.price / p.comparePrice) * 100)
      : null;
    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      discount,
      image: null,
      inStock: p.stock > 0,
    };
  });

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res.json(results);
}
