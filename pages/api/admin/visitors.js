import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !['admin', 'staff'].includes(session.user?.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalViews, todayViews, weekViews, topPages, daily] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.groupBy({
      by: ['path'],
      _count: { path: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
    // Daily views for last 14 days
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*)::int as views
      FROM "PageView"
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  res.json({
    totalViews,
    todayViews,
    weekViews,
    topPages: topPages.map(p => ({ path: p.path, views: p._count.path })),
    daily: daily.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: d.views,
    })),
  });
}
