import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { sendTradeInUpdate } from '../../../../lib/email';

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });

  const id = parseInt(req.query.id);

  if (req.method === 'GET') {
    const t = await prisma.tradeIn.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    if (!t) return res.status(404).json({ error: 'Not found' });
    return res.json(t);
  }

  if (req.method === 'PATCH') {
    const { action, offeredPrice, adminNotes } = req.body;
    const tradeIn = await prisma.tradeIn.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!tradeIn) return res.status(404).json({ error: 'Not found' });

    // Make or update offer
    if (action === 'offer') {
      const amt = parseInt(offeredPrice);
      if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid offer amount' });
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: {
          status: 'offer_made',
          offeredPrice: amt,
          adminNotes: adminNotes || '',
          updatedAt: new Date(),
        },
      });
      await prisma.notification.create({
        data: {
          userId: tradeIn.userId,
          type: 'trade_in',
          title: `We have an offer for your ${tradeIn.productName}`,
          body: `We're offering $${(amt / 100).toFixed(2)} for your ${tradeIn.productName}. Open your account to accept, counter, or decline.`,
          link: '/account?tab=trade-ins',
        },
      });
      sendTradeInUpdate({ email: tradeIn.user?.email, name: tradeIn.user?.name, productName: tradeIn.productName, action: 'offer', offeredPrice: amt }).catch(() => {});
      return res.json(updated);
    }

    // Accept user's counter-offer
    if (action === 'accept_counter') {
      if (tradeIn.status !== 'negotiating') return res.status(400).json({ error: 'No counter to accept' });
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: {
          status: 'accepted',
          finalPrice: tradeIn.counterPrice,
          adminNotes: adminNotes || tradeIn.adminNotes,
          updatedAt: new Date(),
        },
      });
      await prisma.notification.create({
        data: {
          userId: tradeIn.userId,
          type: 'trade_in',
          title: 'Counter-offer accepted!',
          body: `We accepted your counter-offer of $${(tradeIn.counterPrice / 100).toFixed(2)} for your ${tradeIn.productName}. Awaiting final confirmation.`,
          link: '/account?tab=trade-ins',
        },
      });
      return res.json(updated);
    }

    // Send a new offer back after counter (replaces counter)
    if (action === 'counter_offer') {
      const amt = parseInt(offeredPrice);
      if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid offer amount' });
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: {
          status: 'offer_made',
          offeredPrice: amt,
          counterPrice: 0,
          adminNotes: adminNotes || '',
          updatedAt: new Date(),
        },
      });
      await prisma.notification.create({
        data: {
          userId: tradeIn.userId,
          type: 'trade_in',
          title: 'Updated offer for your trade-in',
          body: `We've revised our offer to $${(amt / 100).toFixed(2)} for your ${tradeIn.productName}. Open your account to respond.`,
          link: '/account?tab=trade-ins',
        },
      });
      sendTradeInUpdate({ email: tradeIn.user?.email, name: tradeIn.user?.name, productName: tradeIn.productName, action: 'offer', offeredPrice: amt }).catch(() => {});
      return res.json(updated);
    }

    // Confirm the deal and generate coupon
    if (action === 'confirm') {
      if (!['accepted'].includes(tradeIn.status)) return res.status(400).json({ error: 'Trade-in must be accepted first' });
      const agreed = tradeIn.finalPrice || tradeIn.offeredPrice;
      const code = `TRADEIN-${randomCode()}`;
      // Create coupon in DB
      await prisma.coupon.create({
        data: {
          code,
          type: 'fixed',
          value: agreed,
          minOrder: 0,
          maxUses: 1,
          active: true,
        },
      });
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: {
          status: 'confirmed',
          couponCode: code,
          finalPrice: agreed,
          updatedAt: new Date(),
        },
      });
      await prisma.notification.create({
        data: {
          userId: tradeIn.userId,
          type: 'trade_in',
          title: '🎉 Trade-in confirmed — here\'s your coupon!',
          body: `Your trade-in for ${tradeIn.productName} is confirmed. Use code ${code} to get RWF ${(agreed / 100).toLocaleString()} off your next purchase!`,
          link: '/account?tab=trade-ins',
        },
      });
      sendTradeInUpdate({ email: tradeIn.user?.email, name: tradeIn.user?.name, productName: tradeIn.productName, action: 'confirmed', couponCode: code, finalPrice: agreed }).catch(() => {});
      return res.json(updated);
    }

    // Reject trade-in
    if (action === 'reject') {
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: {
          status: 'rejected',
          adminNotes: adminNotes || tradeIn.adminNotes,
          updatedAt: new Date(),
        },
      });
      await prisma.notification.create({
        data: {
          userId: tradeIn.userId,
          type: 'trade_in',
          title: 'Trade-in update',
          body: `Unfortunately we are unable to proceed with your trade-in for ${tradeIn.productName}${adminNotes ? ': ' + adminNotes : '.'}`,
          link: '/account?tab=trade-ins',
        },
      });
      sendTradeInUpdate({ email: tradeIn.user?.email, name: tradeIn.user?.name, productName: tradeIn.productName, action: 'rejected', rejectReason: adminNotes }).catch(() => {});
      return res.json(updated);
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).end();
}
