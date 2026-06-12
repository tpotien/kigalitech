import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const token = await getToken({ req });
  if (!token) return res.json({ used: 0, remaining: 5, total: 5, loggedIn: false });

  const count = await prisma.order.count({
    where: { userId: Number(token.id), status: { not: 'cancelled' } },
  });

  const used = Math.min(count, 5);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ used, remaining: Math.max(0, 5 - used), total: 5, loggedIn: true });
}
