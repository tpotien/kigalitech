import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'POST') {
    const { orderId, reason, description } = req.body;
    if (!orderId || !reason) return res.status(400).json({ error: 'orderId and reason required' });

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: { id: Number(orderId), userId: Number(token.id) }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check order is delivered
    if (!['delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({ error: 'Can only return delivered orders' });
    }

    // Check no existing return
    const existing = await prisma.return.findUnique({ where: { orderId: Number(orderId) } });
    if (existing) return res.status(400).json({ error: 'Return already requested for this order' });

    const ret = await prisma.return.create({
      data: {
        orderId: Number(orderId),
        userId: Number(token.id),
        reason,
        description: description || '',
      }
    });
    return res.status(201).json(ret);
  }

  if (req.method === 'GET') {
    const returns = await prisma.return.findMany({
      where: { userId: Number(token.id) },
      include: { order: { select: { id: true, createdAt: true, total: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(returns);
  }

  res.status(405).end();
}
