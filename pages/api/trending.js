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

  const productSelect = {
    id: true, name: true, category: true, brand: true, price: true,
    comparePrice: true, images: true, colors: true, storageOptions: true,
    stock: true, lowStockThreshold: true, featured: true, genuine: true,
    flashSalePrice: true, flashSaleEnd: true,
  };

  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');

  function trimToFirst(products) {
    return products.map(p => {
      let first = '';
      try { first = (JSON.parse(p.images || '[]')).find(img => img && img.length > 5 && !img.startsWith('data:')) || ''; } catch {}
      return { ...p, images: JSON.stringify([first]) };
    });
  }

  if (!topItems.length) {
    const fallback = await prisma.product.findMany({
      where: { active: true, featured: true },
      select: productSelect,
      take: 8,
    });
    return res.json(trimToFirst(JSON.parse(JSON.stringify(fallback))));
  }

  const productIds = topItems.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: productSelect,
  });

  const sorted = productIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  return res.json(trimToFirst(JSON.parse(JSON.stringify(sorted))));
}
