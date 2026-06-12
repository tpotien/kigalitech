import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, name: true, image: true, bio: true, createdAt: true, sellerStatus: true },
    });
    if (!user) return res.status(404).json({ error: 'Not found' });

    if (user.sellerStatus !== 'active') {
      return res.json({ user: { id: user.id, name: user.name, image: user.image, bio: user.bio, createdAt: user.createdAt }, listings: [] });
    }

    const listings = await prisma.marketplaceListing.findMany({
      where: {
        sellerId: Number(userId),
        OR: [{ status: 'approved' }, { verified: true }],
      },
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({ user: { id: user.id, name: user.name, image: user.image, bio: user.bio, createdAt: user.createdAt }, listings });
  }

  if (req.method === 'PATCH') {
    const token = await getToken({ req });
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { bio } = req.body;
    if (typeof bio !== 'string') return res.status(400).json({ error: 'bio required' });

    const updated = await prisma.user.update({
      where: { id: Number(token.id) },
      data: { bio: bio.trim().slice(0, 300) },
      select: { bio: true },
    });
    return res.json(updated);
  }

  res.status(405).end();
}
