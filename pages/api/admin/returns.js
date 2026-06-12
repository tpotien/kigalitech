import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).end();

  if (req.method === 'GET') {
    const returns = await prisma.return.findMany({
      include: { order: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(returns);
  }

  if (req.method === 'PATCH') {
    const { id, status, adminNotes, refundAmount } = req.body;
    const existing = await prisma.return.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.return.update({
      where: { id: Number(id) },
      data: { status, adminNotes, refundAmount: Number(refundAmount) || 0, updatedAt: new Date() },
    });

    // Issue store credit when newly approved
    if (status === 'approved' && existing.status !== 'approved' && updated.refundAmount > 0 && updated.userId) {
      await prisma.user.update({
        where: { id: updated.userId },
        data: { storeCredit: { increment: updated.refundAmount } },
      });
    }
    return res.json(updated);
  }

  res.status(405).end();
}
