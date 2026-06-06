import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const { status } = req.query;
    const listings = await prisma.marketplaceListing.findMany({
      where: status && status !== 'all' ? { status } : {},
      include: { seller: { select: { name: true, email: true, phoneNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(listings);
  }

  if (req.method === 'PATCH') {
    const id = req.query.id;
    const { status, adminNotes, verified } = req.body;
    const listing = await prisma.marketplaceListing.update({
      where: { id: Number(id) },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(verified !== undefined && { verified }),
        updatedAt: new Date(),
      },
    });
    return res.json(listing);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    await prisma.marketplaceListing.delete({ where: { id: Number(id) } });
    return res.json({ success: true });
  }

  res.status(405).end();
}
