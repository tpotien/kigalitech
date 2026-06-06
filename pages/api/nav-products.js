import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const categories = ['Phones', 'Laptops', 'Headphones', 'TVs', 'Wearables', 'Gaming', 'Others'];

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true, images: true, category: true, featured: true },
    orderBy: [{ featured: 'desc' }, { id: 'desc' }],
    take: 100,
  });

  const byCategory = {};
  categories.forEach((cat) => { byCategory[cat] = []; });

  products.forEach((p) => {
    const key = categories.find((c) => c.toLowerCase() === p.category.toLowerCase()) || 'Others';
    if (!byCategory[key]) byCategory[key] = [];
    if (byCategory[key].length < 4) {
      let img = '';
      try { img = JSON.parse(p.images)[0] || ''; } catch {}
      byCategory[key].push({ id: p.id, name: p.name, price: p.price, image: img });
    }
  });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.json(byCategory);
}
