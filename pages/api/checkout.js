import prisma from '../../lib/prisma';
import { sendOrderConfirmation, sendLoyaltyPointsEmail } from '../../lib/email';
import { notifyNewOrder } from '../../lib/notify';
import { sendSms, SMS_TEMPLATES } from '../../lib/sms';
import { awardLoyaltyPoints } from '../../lib/loyalty';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { items, userId, shippingName, shippingEmail, shippingPhone, shippingAddress, paymentMethod, notes, couponCode,
      installmentPlan, installmentMonths, tvInstallation, tvInstallAddress, mpostAddress, currency,
      stripePaymentIntentId, deliverySlot, deliveryDate } = req.body;

    if (!items?.length) return res.status(400).json({ error: 'No items in cart' });
    if (!shippingName) return res.status(400).json({ error: 'Full name is required' });
    if (!shippingPhone) return res.status(400).json({ error: 'Phone number is required' });

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      validCoupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
      if (validCoupon && validCoupon.active) {
        if (validCoupon.maxUses > 0 && validCoupon.usedCount >= validCoupon.maxUses) {
          return res.status(400).json({ error: 'Coupon has reached its usage limit' });
        }
        discountAmount = validCoupon.type === 'percent'
          ? Math.round(subtotal * validCoupon.value / 100)
          : Math.min(validCoupon.value, subtotal);
        await prisma.coupon.update({ where: { id: validCoupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    const tvFee = tvInstallation ? 5000 : 0;
    const shippingFee = subtotal >= 9900 ? 0 : 999;
    const total = Math.max(0, subtotal - discountAmount + tvFee + shippingFee);

    // Validate userId is a real number before connecting
    const validUserId = userId && !isNaN(Number(userId)) ? Number(userId) : null;

    const order = await prisma.order.create({
      data: {
        total,
        discountAmount,
        couponCode: validCoupon?.code || null,
        status: stripePaymentIntentId ? 'confirmed' : 'pending',
        paymentMethod: paymentMethod || 'pending',
        stripePaymentIntentId: stripePaymentIntentId || null,
        shippingName: shippingName || '',
        shippingEmail: shippingEmail || '',
        shippingPhone: shippingPhone || '',
        shippingAddress: shippingAddress || '',
        mpostAddress: mpostAddress || '',
        notes: notes || '',
        installmentPlan: installmentPlan || '',
        installmentMonths: Number(installmentMonths) || 0,
        tvInstallation: Boolean(tvInstallation),
        tvInstallAddress: tvInstallAddress || '',
        currency: currency || 'USD',
        deliverySlot: deliverySlot || '',
        deliveryDate: deliveryDate || '',
        ...(validUserId ? { userId: validUserId } : {}),
        items: {
          create: items.map((item) => ({
            productId: Number(item.productId || item.id),
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            color: item.color || '',
            storage: item.storage || '',
            warranty: item.warranty || '1 Year',
            serial: item.serial || 'TBD',
          })),
        },
      },
      include: { items: true },
    });

    await prisma.order.update({ where: { id: order.id }, data: { receiptUrl: `/orders/${order.id}` } });

    // Auto-decrement stock
    for (const item of items) {
      const productId = Number(item.productId || item.id);
      try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) continue;
        const updates = { stock: Math.max(0, product.stock - item.quantity) };
        if (item.color) {
          try {
            const cs = JSON.parse(product.colorStock || '{}');
            if (cs[item.color] !== undefined) cs[item.color] = Math.max(0, cs[item.color] - item.quantity);
            updates.colorStock = JSON.stringify(cs);
          } catch (e) {
            console.error(`Stock color parse error for product ${productId}:`, e.message);
          }
        }
        if (item.storage) {
          try {
            const ss = JSON.parse(product.storageStock || '{}');
            if (ss[item.storage] !== undefined) ss[item.storage] = Math.max(0, ss[item.storage] - item.quantity);
            updates.storageStock = JSON.stringify(ss);
          } catch (e) {
            console.error(`Stock storage parse error for product ${productId}:`, e.message);
          }
        }
        await prisma.product.update({ where: { id: productId }, data: updates });
      } catch (e) {
        console.error(`Failed to decrement stock for product ${productId} (order ${order.id}):`, e.message);
      }
    }

    if (shippingEmail) sendOrderConfirmation({ order, shippingName, shippingEmail, items }).catch(() => {});
    notifyNewOrder(order).catch(() => {});

    // SMS confirmation
    if (shippingPhone) {
      const fmtTotal = `RWF ${Math.round((total / 100) * 1475).toLocaleString()}`;
      sendSms(shippingPhone, SMS_TEMPLATES.orderConfirmed(shippingName, order.id, fmtTotal)).catch(() => {});
    }

    // Award loyalty points for logged-in users
    if (validUserId) {
      awardLoyaltyPoints(validUserId, order.id, total).then(result => {
        if (result?.pointsAwarded > 0 && shippingEmail) {
          sendLoyaltyPointsEmail({
            email: shippingEmail,
            name: shippingName,
            pointsEarned: result.pointsAwarded,
            newBalance: result.newBalance,
            orderId: order.id,
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    return res.status(201).json({ orderId: order.id });

  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'Order failed. Please try again.' });
  }
}
