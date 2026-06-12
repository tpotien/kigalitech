import prisma from '../../../lib/prisma';
import { sendReviewRequestEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || 'kigalitech-cron'}`) {
    return res.status(401).end();
  }

  // Find orders delivered 2-4 days ago that haven't had a review request sent
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: 'delivered',
      reviewRequestSent: false,
      updatedAt: { gte: fourDaysAgo, lte: twoDaysAgo },
    },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: { product: { select: { images: true } } },
        take: 3,
      },
    },
    take: 50,
  });

  let sent = 0;
  for (const order of orders) {
    const email = order.shippingEmail || order.user?.email;
    if (!email) continue;
    try {
      await sendReviewRequestEmail({
        email,
        name: order.shippingName || order.user?.name || '',
        orderId: order.id,
        items: order.items,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewRequestSent: true },
      });
      sent++;
    } catch {}
  }

  return res.json({ checked: orders.length, sent });
}
