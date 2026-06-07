import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).end();

  if (req.method === 'GET') {
    const preOrders = await prisma.preOrder.findMany({
      include: { product: { select: { id: true, name: true, price: true, preOrderDate: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(preOrders);
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    const updated = await prisma.preOrder.update({ where: { id: Number(id) }, data: { status } });
    return res.json(updated);
  }

  res.status(405).end();
}
