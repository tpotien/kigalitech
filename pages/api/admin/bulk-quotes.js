import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).end();

  if (req.method === 'GET') {
    const quotes = await prisma.bulkQuote.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(quotes);
  }
  if (req.method === 'PATCH') {
    const { id, status, adminNotes, quotedTotal } = req.body;
    const q = await prisma.bulkQuote.update({
      where: { id: Number(id) },
      data: { status, adminNotes, quotedTotal: Number(quotedTotal) || 0, updatedAt: new Date() }
    });
    return res.json(q);
  }
  res.status(405).end();
}
