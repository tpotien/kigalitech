import prisma from '../../../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  const orderId = Number(req.query.id);
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: Number(token.id) },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.customerConfirmed) return res.status(400).json({ error: 'Already confirmed' });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      customerConfirmed: true,
      customerConfirmedAt: new Date(),
      status: order.status === 'shipped' ? 'delivered' : order.status,
    },
  });

  return res.json({ ok: true, order: updated });
}
