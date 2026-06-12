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

  if (req.method === 'PATCH') {
    const { id, action } = req.body;
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: Number(id) } });
    if (!listing || listing.sellerId !== Number(token.id)) return res.status(404).json({ error: 'Not found' });

    if (action === 'mark_sold') {
      const updated = await prisma.marketplaceListing.update({
        where: { id: Number(id) },
        data: { status: 'sold' },
      });
      return res.json(updated);
    }
    return res.status(400).json({ error: 'Unknown action' });
  }

  res.status(405).end();
}
