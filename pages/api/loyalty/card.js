import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

function generateCardNumber(userId) {
  const prefix = 'KT';
  const year = new Date().getFullYear().toString().slice(-2);
  const padded = String(userId).padStart(6, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${year}-${padded}-${rand}`;
}

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  const userId = Number(token.id);

  if (req.method === 'GET') {
    const card = await prisma.loyaltyCard.findUnique({ where: { userId } });
    return res.json({ card: card || null });
  }

  if (req.method === 'POST') {
    const existing = await prisma.loyaltyCard.findUnique({ where: { userId } });
    if (existing) return res.status(409).json({ error: 'Card already requested', card: existing });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true, role: true },
    });

    const role = user?.role;
    const points = user?.loyaltyPoints || 0;
    const tier = role === 'admin' ? 'Platinum' : role === 'staff' ? 'Gold' : points >= 500 ? 'Silver' : 'Bronze';

    const card = await prisma.loyaltyCard.create({
      data: {
        userId,
        cardNumber: generateCardNumber(userId),
        tier,
        points,
        status: 'pending',
      },
    });

    return res.status(201).json({ card });
  }

  res.status(405).end();
}
