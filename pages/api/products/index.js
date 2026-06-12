import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { category, search, featured, limit } = req.query;

  const where = {
    active: true,
    ...(category && category !== 'All' && { category }),
    ...(featured === '1' && { featured: true }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
        { category: { contains: search } },
        { subcategory: { contains: search } },
      ],
    }),
  };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true, name: true, category: true, brand: true, price: true,
      comparePrice: true, images: true, colors: true, storageOptions: true,
      stock: true, lowStockThreshold: true, featured: true, genuine: true,
      flashSalePrice: true, flashSaleEnd: true,
    },
    orderBy: [{ featured: 'desc' }, { id: 'desc' }],
    take: limit ? Number(limit) : 48,
  });

  // Strip to first valid CDN image; skip empty slots and base64 data URIs
  const trimmed = products.map((p) => {
    let firstImg = '';
    try {
      const imgs = JSON.parse(p.images || '[]');
      firstImg = imgs.find(img => img && img.length > 5 && !img.startsWith('data:')) || '';
    } catch {}
    return { ...p, images: JSON.stringify([firstImg]) };
  });

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
  return res.json(trimmed);
}
