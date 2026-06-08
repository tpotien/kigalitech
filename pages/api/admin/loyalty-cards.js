import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const cards = await prisma.loyaltyCard.findMany({
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(cards);
  }

  if (req.method === 'PATCH') {
    const { id, status, adminNotes } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const data = { status, adminNotes: adminNotes || '', updatedAt: new Date() };
    if (status === 'approved') {
      data.approvedAt = new Date();
      data.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }

    // Sync current points and tier on approval
    if (status === 'approved') {
      const card = await prisma.loyaltyCard.findUnique({
        where: { id: Number(id) },
        include: { user: { select: { loyaltyPoints: true, role: true } } },
      });
      if (card) {
        const role = card.user.role;
        const pts = card.user.loyaltyPoints || 0;
        data.points = pts;
        data.tier = role === 'admin' ? 'Platinum' : role === 'staff' ? 'Gold' : pts >= 500 ? 'Silver' : 'Bronze';
      }
    }

    const updated = await prisma.loyaltyCard.update({
      where: { id: Number(id) },
      data,
      include: { user: { select: { name: true, email: true } } },
    });
    return res.json(updated);
  }

  res.status(405).end();
}
