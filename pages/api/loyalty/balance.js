import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: Number(token.id) },
    select: { loyaltyPoints: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { userId: Number(token.id) },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return res.json({ points: user.loyaltyPoints, transactions });
}
