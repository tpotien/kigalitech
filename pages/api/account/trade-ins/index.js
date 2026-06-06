import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const userId = session.user.id;

  if (req.method === 'GET') {
    const tradeIns = await prisma.tradeIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tradeIns);
  }

  return res.status(405).end();
}
