import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import { sendBackInStockEmail } from '../../../lib/email';
import { whatsappStockAlert } from '../../../lib/whatsapp';

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
    include: { product: { select: { name: true, id: true } } },
  });

  if (alerts.length === 0) {
    return res.json({ count: 0, message: 'No pending alerts' });
  }

  // Mark all as notified first (so a partial email failure doesn't resend)
  await prisma.stockAlert.updateMany({
    where: { productId: Number(productId), notified: false },
    data: { notified: true },
  });

  const product = alerts[0].product;
  let sent = 0;
  let failed = 0;

  for (const alert of alerts) {
    let email = alert.email;
    let userName = 'Customer';
    let userPhone = null;

    if (alert.userId) {
      const user = await prisma.user.findUnique({
        where: { id: alert.userId },
        select: { email: true, name: true, phoneNumber: true },
      });
      email = email || user?.email;
      userName = user?.name || 'Customer';
      userPhone = user?.phoneNumber;
    }

    if (email) {
      try {
        await sendBackInStockEmail({ email, productName: product.name, productId: product.id });
        sent++;
      } catch (err) {
        console.error(`[notify-stock] Failed to email ${email}:`, err.message);
        failed++;
      }
    }

    if (userPhone) {
      whatsappStockAlert(userPhone, userName, product.name).catch(e =>
        console.error(`[notify-stock] WhatsApp failed for user ${alert.userId}:`, e.message)
      );
    }
  }

  return res.json({ count: alerts.length, sent, failed });
}
