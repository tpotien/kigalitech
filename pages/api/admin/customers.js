import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const customers = await prisma.user.findMany({
      where: { role: 'user' },
      select: {
        id: true, name: true, email: true, image: true, phoneNumber: true,
        phoneVerified: true, language: true, createdAt: true,
        _count: { select: { orders: true, reviews: true, repairTickets: true } },
      },
      orderBy: { id: 'desc' },
    });
    return res.json(customers);
  }

  if (req.method === 'PATCH') {
    const { id, name, email, phoneNumber } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { ...(name && { name }), ...(email && { email }), ...(phoneNumber !== undefined && { phoneNumber }) },
    });
    return res.json(user);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'ID required' });
    if (token.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await prisma.user.delete({ where: { id: Number(id) } });
    return res.json({ success: true });
  }

  res.status(405).end();
}
