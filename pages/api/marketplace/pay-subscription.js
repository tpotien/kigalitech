import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

const SUBSCRIPTION_MONTHS = 1;
const SUBSCRIPTION_AMOUNT = 10000; // RWF

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  // POST — initiate Flutterwave payment link
  if (req.method === 'POST') {
    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      select: { name: true, email: true, phoneNumber: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const flwKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!flwKey) return res.status(500).json({ error: 'Payment not configured' });

    const txRef = `sub_${token.id}_${Date.now()}`;
    const payload = {
      tx_ref: txRef,
      amount: SUBSCRIPTION_AMOUNT,
      currency: 'RWF',
      redirect_url: `${process.env.NEXTAUTH_URL || 'https://kigalitechservices.com'}/marketplace/my-listings?sub=success`,
      customer: { email: user.email, name: user.name || 'Seller', phonenumber: user.phoneNumber || '' },
      customizations: {
        title: 'KigaliTech Seller Subscription',
        description: `Marketplace seller subscription — 1 month`,
        logo: `${process.env.NEXTAUTH_URL || 'https://kigalitechservices.com'}/logo.png`,
      },
      meta: { userId: token.id, type: 'seller_subscription' },
    };

    const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${flwKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await flwRes.json();
    if (data.status !== 'success') return res.status(500).json({ error: data.message || 'Payment init failed' });
    return res.json({ paymentLink: data.data.link });
  }

  // PATCH — verify and activate after Flutterwave redirect
  if (req.method === 'PATCH') {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId required' });

    const flwKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${flwKey}` },
    });
    const data = await verifyRes.json();
    if (data.status !== 'success' || data.data?.status !== 'successful') {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    if (Number(data.data.amount) < SUBSCRIPTION_AMOUNT) {
      return res.status(400).json({ error: 'Insufficient payment amount' });
    }

    // Extend subscription by 1 month from today (or from current expiry if still active)
    const current = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      select: { sellerSubscriptionExp: true },
    });
    const base = current?.sellerSubscriptionExp && new Date(current.sellerSubscriptionExp) > new Date()
      ? new Date(current.sellerSubscriptionExp)
      : new Date();
    base.setMonth(base.getMonth() + SUBSCRIPTION_MONTHS);

    await prisma.user.update({
      where: { id: Number(token.id) },
      data: { sellerSubscriptionExp: base, sellerStatus: 'active' },
    });

    return res.json({ success: true, expiresAt: base });
  }

  res.status(405).end();
}
