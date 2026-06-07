import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method !== 'GET') return res.status(405).end();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [orders, topProducts, allStats] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, total: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    }),
    prisma.order.aggregate({ _sum: { total: true }, _count: { id: true } }),
  ]);

  // 30-day daily revenue map
  const dailyMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0, orders: 0 };
  }
  orders.forEach((o) => {
    const key = o.createdAt.toISOString().split('T')[0];
    if (dailyMap[key]) { dailyMap[key].revenue += o.total; dailyMap[key].orders += 1; }
  });
  const daily = Object.values(dailyMap);

  // Status breakdown
  const statusMap = {};
  orders.forEach((o) => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Top products with names
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const topProductsData = topProducts.map((p) => ({
    name: productMap[p.productId]?.name?.substring(0, 20) || `Product ${p.productId}`,
    qty: p._sum.quantity || 0,
    sales: (productMap[p.productId]?.price || 0) * (p._sum.quantity || 0),
  }));

  // Weekly revenue for sparkline comparison (current vs prev week)
  const currentWeekRevenue = orders
    .filter(o => new Date(o.createdAt) >= new Date(Date.now() - 7 * 86400000))
    .reduce((s, o) => s + o.total, 0);
  const prevWeekRevenue = orders
    .filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t >= Date.now() - 14 * 86400000 && t < Date.now() - 7 * 86400000;
    })
    .reduce((s, o) => s + o.total, 0);

  return res.json({
    daily,
    statusData,
    topProductsData,
    summary: {
      totalRevenue: allStats._sum.total || 0,
      totalOrders: allStats._count.id,
      periodRevenue: orders.reduce((s, o) => s + o.total, 0),
      periodOrders: orders.length,
      currentWeekRevenue,
      prevWeekRevenue,
    },
  });
}
