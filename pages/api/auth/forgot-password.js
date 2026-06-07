import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { sendTempPasswordEmail } from '../../../lib/email';
import { rateLimit } from '../../../lib/rate-limit';

function randomPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'forgot-password', 3, 300_000)) return res.status(429).json({ error: 'Too many requests. Please try again in 5 minutes.' });

  const { email } = req.body;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' });

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always respond success — don't leak whether email exists
  if (!user) return res.json({ ok: true });

  // Phone-only accounts don't have email
  if (user.email?.endsWith('@phone.kigalitech.com')) {
    return res.json({ ok: true });
  }

  const tempPassword = randomPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, mustChangePassword: true },
  });

  await sendTempPasswordEmail({ email: normalized, name: user.name, tempPassword }).catch(() => {});

  return res.json({ ok: true });
}
