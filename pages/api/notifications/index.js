import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const notifications = await prisma.notification.findMany({
      where: { userId: Number(token.id) },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return res.json(notifications);
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    await prisma.notification.update({ where: { id: Number(id) }, data: { read: true } });
    return res.json({ success: true });
  }

  res.status(405).end();
}
