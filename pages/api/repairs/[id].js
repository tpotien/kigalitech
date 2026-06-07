import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import { createNotification } from '../../../lib/notify';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const id = Number(req.query.id);
  const { action } = req.body;

  const ticket = await prisma.repairTicket.findUnique({ where: { id } });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (ticket.userId !== Number(token.id)) return res.status(403).json({ error: 'Forbidden' });

  if (action === 'accept') {
    if (ticket.quoteStatus !== 'quoted') return res.status(400).json({ error: 'No quote to accept' });
    const updated = await prisma.repairTicket.update({
      where: { id },
      data: { quoteStatus: 'accepted', updatedAt: new Date() },
    });
    // Notify admins that user accepted
    const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'staff'] } } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'repair_update',
        title: `Repair #${id} — Quote Accepted`,
        body: `Customer accepted the RWF ${Math.round((ticket.quotedCost / 100) * 1475).toLocaleString()} quote for ${ticket.productName}`,
        link: `/admin/repairs`,
      });
    }
    return res.json(updated);
  }

  if (action === 'reject') {
    if (ticket.quoteStatus !== 'quoted') return res.status(400).json({ error: 'No quote to reject' });
    const updated = await prisma.repairTicket.update({
      where: { id },
      data: { quoteStatus: 'rejected', status: 'cancelled', updatedAt: new Date() },
    });
    const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'staff'] } } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'repair_update',
        title: `Repair #${id} — Quote Rejected`,
        body: `Customer declined the quote for ${ticket.productName}`,
        link: `/admin/repairs`,
      });
    }
    return res.json(updated);
  }

  return res.status(400).json({ error: 'Invalid action' });
}
