import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  // Get top ordered product IDs in the last 30 days
  const topItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: { createdAt: { gte: since } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 8,
  });

  if (!topItems.length) {
    // Fallback: featured products
    const fallback = await prisma.product.findMany({
      where: { active: true, featured: true },
      take: 8,
    });
    return res.json(JSON.parse(JSON.stringify(fallback)));
  }

  const productIds = topItems.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  // Maintain sort order from topItems
  const sorted = productIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  return res.json(JSON.parse(JSON.stringify(sorted)));
}
