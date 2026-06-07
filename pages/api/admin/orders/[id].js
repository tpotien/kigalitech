import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { sendOrderStatusUpdate } from '../../../../lib/email';
import { notifyOrderUpdate } from '../../../../lib/notify';
import { sendSms } from '../../../../lib/sms';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.query.id);

  if (req.method === 'GET') {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { name: true, images: true, warrantyOptions: true } } } },
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Not found' });
    return res.json(order);
  }

  if (req.method === 'PATCH') {
    const { status, adminConfirmed, paymentConfirmed } = req.body;
    const current = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true, verifiedBuyer: true } } },
    });
    if (!current) return res.status(404).json({ error: 'Not found' });

    const update = {};
    if (status !== undefined) update.status = status;
    if (adminConfirmed !== undefined) update.adminConfirmed = adminConfirmed;
    if (paymentConfirmed !== undefined) update.paymentConfirmed = paymentConfirmed;

    const newAdminConfirmed = adminConfirmed !== undefined ? adminConfirmed : current.adminConfirmed;
    const newPaymentConfirmed = paymentConfirmed !== undefined ? paymentConfirmed : current.paymentConfirmed;
    update.billPrintable = newAdminConfirmed && newPaymentConfirmed;

    const order = await prisma.order.update({
      where: { id },
      data: update,
      include: {
        items: { include: { product: { select: { name: true, images: true, warrantyOptions: true } } } },
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Grant verified buyer badge on first delivery
    if (status && ['delivered', 'completed'].includes(status) && current.userId && current.user && !current.user.verifiedBuyer) {
      await prisma.user.update({ where: { id: current.userId }, data: { verifiedBuyer: true } });
    }

    // Send email + in-app notification when status changes (non-blocking)
    if (status && status !== current.status) {
      const email = current.user?.email || current.shippingEmail;
      const name = current.user?.name || current.shippingName;
      if (email) sendOrderStatusUpdate({ order, status, customerEmail: email, customerName: name }).catch(() => {});
      notifyOrderUpdate({ order: { ...order, userId: current.userId }, status }).catch(() => {});

      // Send SMS notification if customer has a phone number
      const shippingPhone = current.shippingPhone;
      if (shippingPhone) {
        const siteUrl = process.env.NEXTAUTH_URL || 'https://electronics-shop-amber.vercel.app';
        const smsMessages = {
          confirmed: `KigaliTech: Your order #${order.id} is confirmed! We're preparing it now.`,
          shipped: `KigaliTech: Order #${order.id} has been shipped! Track at: ${siteUrl}/orders/${order.id}`,
          delivered: `KigaliTech: Order #${order.id} has been delivered! Thank you for shopping with us.`,
          cancelled: `KigaliTech: Your order #${order.id} has been cancelled. Contact us: +250 786 276 555`,
        };
        const smsText = smsMessages[status];
        if (smsText) {
          sendSms(shippingPhone, smsText).catch(() => {});
        }
      }
    }

    return res.json(order);
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end();
}
