import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (req.method === 'GET') {
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const tickets = await prisma.repairTicket.findMany({
      where: { userId: Number(token.id) },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tickets);
  }

  if (req.method === 'POST') {
    if (!token) return res.status(401).json({ error: 'Sign in to submit a repair request' });
    const { orderId, productName, issue, description, priority } = req.body;
    if (!productName || !issue) return res.status(400).json({ error: 'Product name and issue are required' });

    const ticket = await prisma.repairTicket.create({
      data: {
        userId: Number(token.id),
        orderId: orderId ? Number(orderId) : null,
        productName,
        issue,
        description: description || '',
        priority: priority || 'normal',
      },
    });
    return res.status(201).json(ticket);
  }

  res.status(405).end();
}
