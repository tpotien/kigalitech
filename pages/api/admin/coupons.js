import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method === 'GET') {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(coupons);
  }
  if (req.method === 'POST') {
    const { code, type, value, minOrder, maxUses, expiresAt } = req.body;
    const coupon = await prisma.coupon.create({
      data: { code: code.toUpperCase().trim(), type, value: Number(value), minOrder: Number(minOrder || 0), maxUses: Number(maxUses || 0), expiresAt: expiresAt ? new Date(expiresAt) : null }
    });
    return res.status(201).json(coupon);
  }
  if (req.method === 'PATCH') {
    const couponId = req.query.id || req.body.id;
    const { active } = req.body;
    const coupon = await prisma.coupon.update({ where: { id: Number(couponId) }, data: { active } });
    return res.json(coupon);
  }
  if (req.method === 'DELETE') {
    const couponId = req.query.id || req.body.id;
    await prisma.coupon.delete({ where: { id: Number(couponId) } });
    return res.json({ success: true });
  }
  res.status(405).end();
}
