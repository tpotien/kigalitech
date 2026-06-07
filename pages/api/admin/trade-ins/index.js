import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const { status } = req.query;
    const tradeIns = await prisma.tradeIn.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    return res.json(tradeIns);
  }

  return res.status(405).end();
}
