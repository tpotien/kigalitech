import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = Number(token.id);

  if (req.method === 'GET') {
    const tradeIns = await prisma.tradeIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tradeIns);
  }

  return res.status(405).end();
}
