import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const orders = await prisma.order.findMany({
    where: { userId: Number(token.id) },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
    },
  });
  res.json(orders);
}
