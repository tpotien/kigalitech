import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).end();

  if (req.method === 'GET') {
    const returns = await prisma.return.findMany({
      include: { order: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(returns);
  }

  if (req.method === 'PATCH') {
    const { id, status, adminNotes, refundAmount } = req.body;
    const updated = await prisma.return.update({
      where: { id: Number(id) },
      data: { status, adminNotes, refundAmount: Number(refundAmount) || 0, updatedAt: new Date() },
    });
    return res.json(updated);
  }

  res.status(405).end();
}
