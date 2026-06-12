import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
  const now = new Date();
  const product = await prisma.product.findFirst({
    where: {
      active: true,
      flashSalePrice: { not: null },
      flashSaleEnd: { gt: now },
    },
    select: {
      id: true,
      name: true,
      price: true,
      flashSalePrice: true,
      flashSaleEnd: true,
    },
    orderBy: { flashSaleEnd: 'asc' },
  });

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

  if (!product) {
    return res.json({ active: false, product: null });
  }

  return res.json({ active: true, product });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
