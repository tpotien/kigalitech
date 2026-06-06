import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  const term = q.trim();
  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: term } },
        { brand: { contains: term } },
        { category: { contains: term } },
        { description: { contains: term } },
        { tags: { contains: term } },
      ],
    },
    select: { id: true, name: true, category: true, price: true, images: true, brand: true },
    take: 8,
  });

  const results = products.map((p) => ({
    ...p,
    images: (() => { try { return JSON.parse(p.images); } catch { return []; } })(),
  }));

  res.json(results);
}
