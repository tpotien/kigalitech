import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const alerts = await prisma.stockAlert.findMany({
    where: { productId: Number(productId), notified: false },
    include: { product: { select: { name: true } } },
  });

  if (alerts.length === 0) {
    return res.json({ count: 0, message: 'No pending alerts' });
  }

  // Mark all as notified
  await prisma.stockAlert.updateMany({
    where: {
      productId: Number(productId),
      notified: false,
    },
    data: { notified: true },
  });

  // TODO: send actual email/SMS notifications here using your email/SMS provider
  // e.g. await sendEmail({ to: alert.email, subject: `${product.name} is back in stock!`, ... })

  return res.json({ count: alerts.length });
}
