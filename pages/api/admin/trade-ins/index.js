import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

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
