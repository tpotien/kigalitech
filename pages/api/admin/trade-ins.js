import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import { createNotification } from '../../../lib/notify';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const tradeIns = await prisma.tradeIn.findMany({
      include: { user: { select: { name: true, email: true, phoneNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tradeIns);
  }

  if (req.method === 'PATCH') {
    const id = req.query.id || req.body.id;
    const { status, offeredPrice, finalPrice, adminNotes } = req.body;
    const tradeIn = await prisma.tradeIn.update({
      where: { id: Number(id) },
      data: {
        ...(status && { status }),
        ...(offeredPrice !== undefined && { offeredPrice: Number(offeredPrice) }),
        ...(finalPrice !== undefined && { finalPrice: Number(finalPrice) }),
        ...(adminNotes !== undefined && { adminNotes }),
        updatedAt: new Date(),
      },
    });
    // Notify customer
    if (status && status !== 'pending') {
      const original = await prisma.tradeIn.findUnique({ where: { id: Number(id) } });
      if (original?.userId) {
        const msgs = {
          under_review: `Your trade-in for "${tradeIn.productName}" is under review`,
          verified: `Your trade-in is verified! Offered amount: $${(tradeIn.offeredPrice / 100).toFixed(2)}`,
          rejected: `Your trade-in for "${tradeIn.productName}" was not accepted`,
          completed: `Trade-in completed! Final deduction: $${(tradeIn.finalPrice / 100).toFixed(2)}`,
        };
        await createNotification({
          userId: original.userId,
          type: 'order_update',
          title: `Trade-In Update — ${status.replace('_', ' ')}`,
          body: msgs[status] || `Status: ${status}`,
          link: '/account#tradein',
        });
      }
    }
    return res.json(tradeIn);
  }

  res.status(405).end();
}
