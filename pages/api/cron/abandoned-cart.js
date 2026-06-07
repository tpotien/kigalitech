import prisma from '../../../lib/prisma';
import { sendAbandonedCartEmail } from '../../../lib/email';

export default async function handler(req, res) {
  // Secure with a cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || 'kigalitech-cron'}`) {
    return res.status(401).end();
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const abandoned = await prisma.abandonedCart.findMany({
    where: { emailSent: false, updatedAt: { lt: oneHourAgo }, email: { not: null } },
    take: 50,
  });

  let sent = 0;
  for (const cart of abandoned) {
    try {
      const items = JSON.parse(cart.items || '[]');
      if (!items.length) continue;
      await sendAbandonedCartEmail({ email: cart.email, items });
      await prisma.abandonedCart.update({ where: { id: cart.id }, data: { emailSent: true } });
      sent++;
    } catch {}
  }

  return res.json({ checked: abandoned.length, sent });
}
