import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Find users who ordered last month AND this month (streak = consecutive months)
  const lastMonthBuyers = await prisma.order.findMany({
    where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, userId: { not: null } },
    select: { userId: true },
    distinct: ['userId'],
  });
  const lastMonthIds = new Set(lastMonthBuyers.map(o => o.userId));
  if (lastMonthIds.size === 0) return res.json({ awarded: 0 });

  const thisMonthBuyers = await prisma.order.findMany({
    where: { createdAt: { gte: thisMonthStart }, userId: { in: [...lastMonthIds] } },
    select: { userId: true },
    distinct: ['userId'],
  });

  const streakers = thisMonthBuyers.map(o => o.userId);
  if (streakers.length === 0) return res.json({ awarded: 0 });

  await prisma.$transaction(
    streakers.flatMap(uid => [
      prisma.user.update({ where: { id: uid }, data: { loyaltyPoints: { increment: 10 } } }),
      prisma.loyaltyTransaction.create({ data: { userId: uid, points: 10, action: 'earn', reason: 'Monthly streak bonus' } }),
    ])
  );

  return res.json({ awarded: streakers.length });
}
