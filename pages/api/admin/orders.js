import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method !== 'GET') return res.status(405).end();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  res.json(orders);
}
