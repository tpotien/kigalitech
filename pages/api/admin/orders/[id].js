import prisma from '../../../../lib/prisma';
import { sendOrderStatusUpdate } from '../../../../lib/email';
import { notifyOrderUpdate } from '../../../../lib/notify';

export default async function handler(req, res) {
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
      include: { user: { select: { name: true, email: true } } },
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

    // Send email + in-app notification when status changes (non-blocking)
    if (status && status !== current.status) {
      const email = current.user?.email || current.shippingEmail;
      const name = current.user?.name || current.shippingName;
      if (email) sendOrderStatusUpdate({ order, status, customerEmail: email, customerName: name }).catch(() => {});
      notifyOrderUpdate({ order: { ...order, userId: current.userId }, status }).catch(() => {});
    }

    return res.json(order);
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end();
}
