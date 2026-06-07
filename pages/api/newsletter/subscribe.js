import prisma from '../../../lib/prisma';
import { sendNewsletterWelcome } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.newsletter.findUnique({ where: { email: normalizedEmail } });
  if (existing) return res.status(400).json({ error: 'Already subscribed!' });

  // Generate a unique 10% off coupon code
  const code = 'WELCOME10-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  // Create coupon in DB
  await prisma.coupon.create({
    data: { code, type: 'percent', value: 10, minOrder: 0, maxUses: 1, active: true }
  });

  // Save subscriber
  await prisma.newsletter.create({
    data: { email: normalizedEmail, name: name || null, couponCode: code }
  });

  // Send email with coupon
  sendNewsletterWelcome({ email: normalizedEmail, name, code }).catch(() => {});

  return res.status(201).json({ success: true, code });
}
