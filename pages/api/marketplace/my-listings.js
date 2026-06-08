import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  if (req.method === 'GET') {
    const listings = await prisma.marketplaceListing.findMany({
      where: { sellerId: Number(token.id) },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(listings);
  }

  res.status(405).end();
}
