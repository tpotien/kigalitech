import prisma from '../../lib/prisma';
import { sendOrderConfirmation, sendLoyaltyPointsEmail } from '../../lib/email';
import { notifyNewOrder } from '../../lib/notify';
import { sendSms, SMS_TEMPLATES } from '../../lib/sms';
import { awardLoyaltyPoints } from '../../lib/loyalty';
import { rateLimit } from '../../lib/rate-limit';
import { whatsappOrderPlaced } from '../../lib/whatsapp';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'checkout', 5, 60_000)) {
    return res.status(429).json({ error: 'Too many checkout attempts. Please wait a moment and try again.' });
  }

  try {
    const { items, userId, shippingName, shippingEmail, shippingPhone, shippingAddress, paymentMethod, notes, couponCode,
      installmentPlan, installmentMonths, tvInstallation, tvInstallAddress, mpostAddress, currency,
      stripePaymentIntentId, deliverySlot, deliveryDate } = req.body;

    if (!items?.length) return res.status(400).json({ error: 'No items in cart' });
    if (!shippingName) return res.status(400).json({ error: 'Full name is required' });
    if (!shippingPhone) return res.status(400).json({ error: 'Phone number is required' });
    // Validate quantities
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!qty || qty < 1 || qty > 100) return res.status(400).json({ error: `Invalid quantity for item ${item.name || item.id}` });
    }

    // Verify prices against DB — never trust client-submitted prices
    const now = new Date();
    const productIds = [...new Set(items.map(i => Number(i.productId || i.id)).filter(Boolean))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, price: true, storagePrice: true, flashSalePrice: true, flashSaleEnd: true, preOrder: true, preOrderDeposit: true },
    });
    const productMap = Object.fromEntries(dbProducts.map(p => [p.id, p]));

    const verifiedItems = items.map(item => {
      const pid = Number(item.productId || item.id);
      const dbProduct = productMap[pid];
      if (!dbProduct) return { ...item, price: Number(item.price) };
      // Pre-order items use deposit as price
      if (dbProduct.preOrder && dbProduct.preOrderDeposit > 0) {
        return { ...item, price: dbProduct.preOrderDeposit, isPreOrder: true };
      }
      const flashActive = dbProduct.flashSalePrice && dbProduct.flashSaleEnd && new Date(dbProduct.flashSaleEnd) > now;
      let dbPrice = flashActive ? dbProduct.flashSalePrice : dbProduct.price;
      if (item.storage) {
        try {
          const sp = JSON.parse(dbProduct.storagePrice || '{}');
          if (sp[item.storage] != null) dbPrice += sp[item.storage];
        } catch {}
      }
      return { ...item, price: dbPrice };
    });

    const { useStoreCredit } = req.body;
    const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    let validCoupon = null;
    let creditUsed = 0;

    if (couponCode) {
      validCoupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
      if (validCoupon && validCoupon.active) {
        if (validCoupon.maxUses > 0 && validCoupon.usedCount >= validCoupon.maxUses) {
          return res.status(400).json({ error: 'Coupon has reached its usage limit' });
        }
        discountAmount = validCoupon.type === 'percent'
          ? Math.round(subtotal * validCoupon.value / 100)
          : validCoupon.value;
        await prisma.coupon.update({ where: { id: validCoupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    const tvFee = tvInstallation ? 73750 : 0;

    // Apply store credit before finalizing total
    const validUserId = userId && !isNaN(Number(userId)) ? Number(userId) : null;

    // First 5 orders per customer are free delivery
    let prevOrderCount = 0;
    if (validUserId) {
      prevOrderCount = await prisma.order.count({
        where: { userId: validUserId, status: { not: 'cancelled' } },
      });
    }
    const shippingFee = prevOrderCount < 5 ? 0 : (subtotal >= 146000 ? 0 : 14730);

    const orderGross = subtotal + tvFee + shippingFee;
    if (useStoreCredit && validUserId) {
      const user = await prisma.user.findUnique({ where: { id: validUserId }, select: { storeCredit: true } });
      if (user?.storeCredit > 0) {
        const afterDiscount = Math.max(0, orderGross - discountAmount);
        creditUsed = Math.min(user.storeCredit, afterDiscount);
      }
    }

    // Cap coupon so total never goes negative; store the excess as account credit
    const afterCoupon = Math.max(0, orderGross - discountAmount - creditUsed);
    const couponRemainder = Math.max(0, discountAmount - (orderGross - creditUsed));
    const total = afterCoupon;

    // validUserId already computed above

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
          create: verifiedItems.map((item) => ({
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

    // Credit accounting: deduct used credit and/or add coupon remainder
    if (validUserId && (creditUsed > 0 || couponRemainder > 0)) {
      await prisma.$executeRaw`
        UPDATE "User"
        SET "storeCredit" = GREATEST(0, "storeCredit" - ${creditUsed} + ${couponRemainder})
        WHERE id = ${validUserId}
      `;
    }

    // Auto-decrement stock atomically per product
    for (const item of verifiedItems) {
      const productId = Number(item.productId || item.id);
      try {
        await prisma.$transaction(async (tx) => {
          const product = await tx.product.findUnique({ where: { id: productId } });
          if (!product) return;
          const updates = { stock: Math.max(0, product.stock - item.quantity) };
          if (item.color) {
            try {
              const cs = JSON.parse(product.colorStock || '{}');
              if (cs[item.color] !== undefined) cs[item.color] = Math.max(0, cs[item.color] - item.quantity);
              updates.colorStock = JSON.stringify(cs);
            } catch {}
          }
          if (item.storage) {
            try {
              const ss = JSON.parse(product.storageStock || '{}');
              if (ss[item.storage] !== undefined) ss[item.storage] = Math.max(0, ss[item.storage] - item.quantity);
              updates.storageStock = JSON.stringify(ss);
            } catch {}
          }
          await tx.product.update({ where: { id: productId }, data: updates });
        });
      } catch (e) {
        console.error(`Failed to decrement stock for product ${productId} (order ${order.id}):`, e.message);
      }
    }

    // Remove purchased items from user's wishlist
    if (validUserId) {
      prisma.wishlist.deleteMany({
        where: { userId: validUserId, productId: { in: productIds } },
      }).catch(() => {});
    }

    if (shippingEmail) sendOrderConfirmation({ order, shippingName, shippingEmail, items }).catch(() => {});
    notifyNewOrder(order).catch(() => {});

    // SMS + WhatsApp confirmation
    if (shippingPhone) {
      const fmtTotal = `RWF ${total.toLocaleString()}`;
      sendSms(shippingPhone, SMS_TEMPLATES.orderConfirmed(shippingName, order.id, fmtTotal)).catch(() => {});
      whatsappOrderPlaced(shippingPhone, shippingName, order.id, total).catch(() => {});
    }

    // Loyalty points are awarded when order is marked delivered (not at checkout)
    // to avoid awarding points for cancelled/unpaid orders.

    return res.status(201).json({ orderId: order.id });

  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'Order failed. Please try again.' });
  }
}
