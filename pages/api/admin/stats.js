import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method !== 'GET') return res.status(405).end();

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    totalProducts,
    lowStockProducts,
    recentOrders,
    revenue,
    openRepairs,
    pendingTradeIns,
    pendingListings,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: 'confirmed' } }),
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
    prisma.repairTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    prisma.tradeIn.count({ where: { status: 'pending' } }),
    prisma.marketplaceListing.count({ where: { status: 'pending' } }),
  ]);

  const lowStock = lowStockProducts.filter((p) => p.stock <= p.lowStockThreshold);
  const totalRevenue = revenue._sum.total || 0;

  res.json({
    totalOrders,
    pendingOrders,
    confirmedOrders,
    totalProducts,
    lowStock,
    recentOrders,
    totalRevenue,
    openRepairs,
    pendingTradeIns,
    pendingListings,
  });
}
