import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const groups = await prisma.product.groupBy({
    by: ['category'],
    where: { active: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const categories = groups.map(g => ({ name: g.category, count: g._count.id }));
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return res.json(categories);
}
