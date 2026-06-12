import prisma from '../../../lib/prisma';
import { rateLimit } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'order-lookup', 10, 60_000)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a moment.' });
  }

  const orderId = Number(req.body?.orderId);
  const email = (req.body?.email || '').toLowerCase().trim();

  if (!orderId || isNaN(orderId) || !email) {
    return res.status(400).json({ error: 'Order ID and email are required.' });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const orderEmail = (order.shippingEmail || order.user?.email || '').toLowerCase().trim();
  if (orderEmail !== email) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json(order);
}
