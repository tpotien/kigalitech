import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const [totalOrders, pendingOrders, totalProducts, lowStockProducts, recentOrders, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true, user: { select: { name: true, email: true } } },
    }),
    prisma.order.aggregate({ _sum: { total: true } }),
  ]);

  const lowStock = lowStockProducts.filter((p) => p.stock <= p.lowStockThreshold);
  const totalRevenue = revenue._sum.total || 0;

  res.json({ totalOrders, pendingOrders, totalProducts, lowStock, recentOrders, totalRevenue });
}
