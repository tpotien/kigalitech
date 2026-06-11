import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const id = Number(req.query.id);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { returnRequest: true },
  });
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (String(order.userId) !== token.sub) return res.status(403).json({ error: 'Forbidden' });
  if (order.status !== 'delivered') {
    return res.status(400).json({ error: 'Returns are only available for delivered orders' });
  }
  if (order.returnRequest) {
    return res.status(400).json({ error: 'A return request already exists for this order' });
  }

  const { reason, description } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: 'Reason is required' });

  const ret = await prisma.return.create({
    data: {
      orderId: id,
      userId: order.userId,
      reason: reason.trim(),
      description: (description || '').trim(),
      status: 'pending',
    },
  });

  return res.status(201).json(ret);
}
