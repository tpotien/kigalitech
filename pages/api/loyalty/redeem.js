import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { points, orderId } = req.body;
  if (!points || points <= 0) {
    return res.status(400).json({ error: 'points must be a positive number' });
  }

  const userId = Number(token.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.loyaltyPoints < points) {
    return res.status(400).json({ error: `Insufficient points. You have ${user.loyaltyPoints} points.` });
  }

  // 100 points = $1 = 100 cents
  const discountCents = Math.floor(points / 100) * 100;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: -points,
        action: 'redeem',
        reason: `Redeemed ${points} points for $${(discountCents / 100).toFixed(2)} discount`,
        orderId: orderId ? Number(orderId) : null,
      },
    }),
  ]);

  return res.json({ discountCents });
}
