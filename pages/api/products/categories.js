import prisma from '../../../lib/prisma';

const PREFERRED_ORDER = ['Phones','Laptops','TVs','Audio','Wearables','Gaming','Tablets','Cameras','Smart Home','Headphones','Routers','Storage','Accessories','Others'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const groups = await prisma.product.groupBy({
    by: ['category'],
    where: { active: true },
    _count: { id: true },
  });

  const existingNames = groups.map(g => g.category);
  const countMap = Object.fromEntries(groups.map(g => [g.category, g._count.id]));

  const sorted = [
    ...PREFERRED_ORDER.filter(c => existingNames.includes(c)),
    ...existingNames.filter(c => !PREFERRED_ORDER.includes(c)).sort(),
  ];

  const categories = sorted.map(name => ({ name, count: countMap[name] ?? 0 }));
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return res.json(categories);
}
