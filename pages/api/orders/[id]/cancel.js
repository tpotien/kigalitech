import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const id = Number(req.query.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (String(order.userId) !== token.sub) return res.status(403).json({ error: 'Forbidden' });
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Customer requested cancellation' },
  });

  return res.json({ ok: true, status: updated.status });
}
