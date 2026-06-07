import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import { createNotification } from '../../../lib/notify';

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (req.method === 'GET') {
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const tickets = await prisma.repairTicket.findMany({
      where: { userId: Number(token.id) },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tickets);
  }

  if (req.method === 'POST') {
    if (!token) return res.status(401).json({ error: 'Sign in to submit a repair request' });
    const { orderId, productName, issue, description, priority, deviceImages } = req.body;
    if (!productName || !issue) return res.status(400).json({ error: 'Product name and issue are required' });

    const ticket = await prisma.repairTicket.create({
      data: {
        userId: Number(token.id),
        orderId: orderId ? Number(orderId) : null,
        productName,
        issue,
        description: description || '',
        priority: priority || 'normal',
        deviceImages: JSON.stringify(Array.isArray(deviceImages) ? deviceImages : []),
      },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'staff'] } } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'new_repair',
        title: `New Repair Request #${ticket.id}`,
        body: `${token.name || token.email} — ${productName}: ${issue}`,
        link: `/admin/repairs`,
      });
    }

    return res.status(201).json(ticket);
  }

  res.status(405).end();
}
