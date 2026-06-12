import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method !== 'GET') return res.status(405).end();

  const { status, search, page = '1', limit = '50' } = req.query;
  const take = Math.min(Math.max(1, Number(limit)), 200);
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const where = {};
  if (status && status !== 'all') where.status = status;
  if (search?.trim()) {
    const s = search.trim();
    const conditions = [
      { shippingName: { contains: s, mode: 'insensitive' } },
      { shippingEmail: { contains: s, mode: 'insensitive' } },
      { shippingPhone: { contains: s, mode: 'insensitive' } },
      { user: { name: { contains: s, mode: 'insensitive' } } },
      { user: { email: { contains: s, mode: 'insensitive' } } },
    ];
    const numId = parseInt(s, 10);
    if (!isNaN(numId)) conditions.push({ id: numId });
    where.OR = conditions;
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / take) });
}
