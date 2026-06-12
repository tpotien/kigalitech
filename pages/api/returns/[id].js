import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: 'Invalid ID' });

  if (req.method === 'GET') {
    const isAdmin = ['admin', 'staff'].includes(token.role);
    const ret = await prisma.return.findUnique({
      where: { id },
      include: { order: { select: { id: true, total: true, createdAt: true } }, user: { select: { name: true, email: true } } },
    });
    if (!ret) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && ret.userId !== Number(token.id)) return res.status(403).json({ error: 'Forbidden' });
    return res.json(ret);
  }

  if (req.method === 'PATCH') {
    const isAdmin = ['admin', 'staff'].includes(token.role);
    const ret = await prisma.return.findUnique({ where: { id } });
    if (!ret) return res.status(404).json({ error: 'Not found' });

    if (isAdmin) {
      const { status, refundAmount, adminNotes } = req.body;
      const data = {};
      if (status) data.status = status;
      if (typeof refundAmount === 'number') data.refundAmount = refundAmount;
      if (adminNotes !== undefined) data.adminNotes = adminNotes;
      data.updatedAt = new Date();

      const updated = await prisma.return.update({ where: { id }, data });

      // Issue store credit refund when approved
      if (status === 'approved' && ret.status !== 'approved' && updated.refundAmount > 0 && updated.userId) {
        await prisma.user.update({
          where: { id: updated.userId },
          data: { storeCredit: { increment: updated.refundAmount } },
        });
      }
      return res.json(updated);
    }

    // Customer can only cancel their own pending return
    if (ret.userId !== Number(token.id)) return res.status(403).json({ error: 'Forbidden' });
    if (!['pending'].includes(ret.status)) return res.status(400).json({ error: 'Cannot update a return that is already being processed' });
    const { status } = req.body;
    if (status !== 'cancelled') return res.status(400).json({ error: 'You can only cancel a pending return' });
    const updated = await prisma.return.update({ where: { id }, data: { status: 'cancelled', updatedAt: new Date() } });
    return res.json(updated);
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end();
}
