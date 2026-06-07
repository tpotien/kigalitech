import prisma from '../../../lib/prisma';
import { sendMagicLinkEmail } from '../../../lib/email';
import { rateLimit } from '../../../lib/rate-limit';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'magic-link', 3, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Valid email address required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find or create the user
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const isNew = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: 'user',
        emailVerified: null,
      },
    });
  }

  // Delete any old magic tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: `magic:${normalizedEmail}` },
  });

  // Create a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: {
      identifier: `magic:${normalizedEmail}`,
      token,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  try {
    await sendMagicLinkEmail({ email: normalizedEmail, name: user.name, token, isNew });
  } catch (e) {
    console.error('[magic-link] email failed:', e.message);
    return res.status(500).json({ error: 'Could not send email. Please try again or contact support.' });
  }

  return res.status(200).json({ ok: true, isNew });
}
