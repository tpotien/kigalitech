import prisma from '../../../lib/prisma';
import { rateLimit } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'coupon', 10, 60_000)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a moment.' });
  }
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!coupon || !coupon.active) return res.status(404).json({ error: 'Invalid or expired coupon code' });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ error: 'This coupon has expired' });
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Coupon usage limit reached' });
  if (coupon.minOrder > 0 && orderTotal < coupon.minOrder) return res.status(400).json({ error: `Minimum order of RWF ${Number(coupon.minOrder).toLocaleString()} required` });

  const discount = coupon.type === 'percent'
    ? Math.round(orderTotal * coupon.value / 100)
    : Math.min(coupon.value, orderTotal);

  res.json({ valid: true, coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value, discount } });
}
