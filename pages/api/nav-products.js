import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const categories = ['Phones', 'Laptops', 'Headphones', 'TVs', 'Wearables', 'Gaming', 'Others'];

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true, comparePrice: true, category: true, featured: true, brand: true, images: true, stock: true },
    orderBy: [{ featured: 'desc' }, { id: 'desc' }],
    take: 200,
  });

  const byCategory = {};
  categories.forEach((cat) => { byCategory[cat] = []; });

  products.forEach((p) => {
    const key = categories.find((c) => c.toLowerCase() === p.category.toLowerCase()) || 'Others';
    if (!byCategory[key]) byCategory[key] = [];
    if (byCategory[key].length < 6) {
      let firstImg = '';
      try { firstImg = (JSON.parse(p.images || '[]')).find(img => img && img.length > 5 && !img.startsWith('data:')) || ''; } catch {}
      byCategory[key].push({ id: p.id, name: p.name, price: p.price, comparePrice: p.comparePrice, featured: p.featured, brand: p.brand, image: firstImg, stock: p.stock });
    }
  });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.json(byCategory);
}
