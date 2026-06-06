import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const { productId, category, priceMin, priceMax } = req.query;
  if (!productId || !category) return res.json([]);

  const id = Number(productId);
  const pMin = Number(priceMin) || 0;
  const pMax = Number(priceMax) || 999999999;
  const range = pMax - pMin;

  // Same category, similar price ±60%, exclude current product
  const recs = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: id },
      category,
      price: { gte: Math.max(0, pMin - range * 0.6), lte: pMax + range * 0.6 },
    },
    select: { id: true, name: true, price: true, comparePrice: true, images: true, category: true, brand: true, featured: true, stock: true },
    orderBy: [{ featured: 'desc' }, { id: 'desc' }],
    take: 6,
  });

  // If < 4, fill with other featured products
  if (recs.length < 4) {
    const extra = await prisma.product.findMany({
      where: { active: true, id: { not: id, notIn: recs.map(r => r.id) }, featured: true },
      select: { id: true, name: true, price: true, comparePrice: true, images: true, category: true, brand: true, featured: true, stock: true },
      take: 4 - recs.length,
    });
    recs.push(...extra);
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.json(recs.map(p => ({
    ...p,
    images: (() => { try { return JSON.parse(p.images); } catch { return []; } })(),
  })));
}
