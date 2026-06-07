import prisma from '../../lib/prisma';
import { rateLimit } from '../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'stock-alert', 5, 60_000)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const { productId, email, phone, userId } = req.body;

  if (!productId || !email) {
    return res.status(400).json({ error: 'productId and email are required' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existing = await prisma.stockAlert.findFirst({
      where: { productId: Number(productId), email, notified: false },
    });
    if (existing) return res.json({ ok: true, message: 'Already subscribed' });

    await prisma.stockAlert.create({
      data: {
        productId: Number(productId),
        email,
        phone: phone || null,
        userId: userId ? Number(userId) : null,
        notified: false,
      },
    });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
