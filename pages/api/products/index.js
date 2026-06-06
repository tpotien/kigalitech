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
    orderBy: [{ featured: 'desc' }, { id: 'desc' }],
    ...(limit ? { take: Number(limit) } : {}),
  });

  return res.json(products);
}
