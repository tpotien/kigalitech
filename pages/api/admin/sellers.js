import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || token.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    // ?action=reactivate_all — fix all inactive sellers at once
    if (req.query.action === 'reactivate_all') {
      const result = await prisma.user.updateMany({
        where: { sellerStatus: 'inactive' },
        data: { sellerStatus: 'active', sellerSuspendedReason: '' },
      });
      return res.json({ reactivated: result.count });
    }

    const sellers = await prisma.user.findMany({
      where: { marketplaceListings: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        sellerStatus: true,
        sellerSuspendedReason: true,
        sellerSubscriptionExp: true,
        sellerFirstListingAt: true,
        _count: { select: { marketplaceListings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(sellers);
  }

  if (req.method === 'PATCH') {
    const { userId, sellerStatus, sellerSuspendedReason, sellerSubscriptionExp } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const data = {};
    if (sellerStatus !== undefined) data.sellerStatus = sellerStatus;
    if (sellerSuspendedReason !== undefined) data.sellerSuspendedReason = sellerSuspendedReason;
    if (sellerSubscriptionExp !== undefined) {
      data.sellerSubscriptionExp = sellerSubscriptionExp ? new Date(sellerSubscriptionExp) : null;
    }
    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data,
      select: { id: true, sellerStatus: true, sellerSubscriptionExp: true },
    });
    return res.json(user);
  }

  res.status(405).end();
}
