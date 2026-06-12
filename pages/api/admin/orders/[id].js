import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { sendOrderStatusUpdate, sendLoyaltyPointsEmail } from '../../../../lib/email';
import { notifyOrderUpdate } from '../../../../lib/notify';
import { sendSms } from '../../../../lib/sms';
import { awardLoyaltyPoints } from '../../../../lib/loyalty';
import webpush from 'web-push';
import { whatsappOrderStatus } from '../../../../lib/whatsapp';

const SITE_URL = process.env.NEXTAUTH_URL || 'https://kigalitechservices.com';

async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
  try {
    webpush.setVapidDetails('mailto:kigalitechservices@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const data = JSON.stringify(payload);
    await Promise.allSettled(subs.map(s =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, data)
        .catch(async (e) => {
          if (e.statusCode === 410 || e.statusCode === 404)
            await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        })
    ));
  } catch {}
}


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

  // Map order status → deliveryTracking step key
  const STATUS_TO_STEP = {
    pending:   'order_placed',
    confirmed: 'confirmed',
    processing:'packed',
    shipped:   'out_for_delivery',
    delivered: 'delivered',
  };

  if (req.method === 'PATCH') {
    const { status, adminConfirmed, paymentConfirmed, deliveryTracking } = req.body;
    const current = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true, verifiedBuyer: true } } },
    });
    if (!current) return res.status(404).json({ error: 'Not found' });

    const update = {};
    if (status !== undefined) update.status = status;
    if (adminConfirmed !== undefined) update.adminConfirmed = adminConfirmed;
    if (paymentConfirmed !== undefined) update.paymentConfirmed = paymentConfirmed;
    if (req.body.adminNote !== undefined) update.adminNote = req.body.adminNote;

    // Merge deliveryTracking update
    if (deliveryTracking !== undefined) {
      let existing = {};
      try { existing = JSON.parse(current.deliveryTracking || '{}'); } catch {}
      update.deliveryTracking = JSON.stringify({ ...existing, ...deliveryTracking });
    }

    // Auto-stamp step timestamp + auto-generate tracking number when status changes
    if (status && status !== current.status) {
      let existing = {};
      try { existing = JSON.parse(update.deliveryTracking || current.deliveryTracking || '{}'); } catch {}

      // Generate tracking number on first confirmation if not already set
      if (status === 'confirmed' && !existing.trackingNumber) {
        const d = new Date();
        const datePart = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
        existing.trackingNumber = `KT-${datePart}-${String(id).padStart(5,'0')}`;
      }

      if (STATUS_TO_STEP[status]) {
        const stepKey = STATUS_TO_STEP[status];
        if (!existing[stepKey]?.time) {
          existing[stepKey] = { ...existing[stepKey], time: new Date().toISOString() };
        }
      }

      update.deliveryTracking = JSON.stringify(existing);
    }

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

    // Grant verified buyer badge + award loyalty points on first delivery
    if (status && ['delivered', 'completed'].includes(status) && current.userId) {
      if (current.user && !current.user.verifiedBuyer) {
        await prisma.user.update({ where: { id: current.userId }, data: { verifiedBuyer: true } });
      }
      // Award loyalty points now (not at checkout) so cancelled orders don't earn points
      const already = await prisma.loyaltyTransaction.findFirst({
        where: { userId: current.userId, orderId: current.id, action: 'earn' },
      });
      if (!already) {
        const customerEmail = current.user?.email || current.shippingEmail;
        const customerName = current.user?.name || current.shippingName;
        awardLoyaltyPoints(current.userId, current.id, current.total).then(result => {
          if (result?.pointsAwarded > 0 && customerEmail) {
            sendLoyaltyPointsEmail({
              email: customerEmail, name: customerName,
              pointsEarned: result.pointsAwarded,
              newBalance: result.newBalance,
              orderId: current.id,
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }

    // Send email + in-app notification when status changes (non-blocking)
    if (status && status !== current.status) {
      const email = current.user?.email || current.shippingEmail;
      const name = current.user?.name || current.shippingName;
      if (email) sendOrderStatusUpdate({ order, status, customerEmail: email, customerName: name }).catch(() => {});
      notifyOrderUpdate({ order: { ...order, userId: current.userId }, status }).catch(() => {});

      // SMS + WhatsApp notification
      const shippingPhone = current.shippingPhone;
      if (shippingPhone) {
        const customerName = current.user?.name || current.shippingName;
        const smsMessages = {
          confirmed: `KigaliTech: Your order #${order.id} is confirmed! We're preparing it now.`,
          processing: `KigaliTech: Order #${order.id} is being packed and will ship soon.`,
          shipped: `KigaliTech: Order #${order.id} has been shipped! Track at: ${SITE_URL}/orders/${order.id}`,
          delivered: `KigaliTech: Order #${order.id} has been delivered! Thank you for shopping with us.`,
          cancelled: `KigaliTech: Your order #${order.id} has been cancelled. Contact us: +250 786 276 555`,
        };
        const smsText = smsMessages[status];
        if (smsText) sendSms(shippingPhone, smsText).catch(() => {});
        whatsappOrderStatus(shippingPhone, customerName, order.id, status).catch(() => {});
      }

      // Push notification to customer's devices
      if (current.userId) {
        const pushMessages = {
          confirmed:  { title: '✅ Order Confirmed', body: `Order #${order.id} confirmed — we're preparing it!` },
          processing: { title: '⚙️ Order Processing', body: `Order #${order.id} is being prepared for shipment.` },
          shipped:    { title: '🚚 Order Shipped!',   body: `Order #${order.id} is on its way to you.` },
          delivered:  { title: '🎉 Order Delivered!', body: `Order #${order.id} has arrived. Enjoy!` },
          cancelled:  { title: '❌ Order Cancelled',  body: `Order #${order.id} was cancelled. Contact us for help.` },
        };
        const push = pushMessages[status];
        if (push) sendPushToUser(current.userId, { ...push, url: `/orders/${order.id}`, icon: '/logo.png' }).catch(() => {});
      }
    }

    return res.json(order);
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end();
}
