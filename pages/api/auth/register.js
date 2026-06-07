import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../../../lib/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, phone, password } = req.body;
  const email = req.body.email ? req.body.email.toLowerCase().trim() : '';

  if ((!email && !phone) || !password || !name) {
    return res.status(400).json({ error: 'Name, password, and email or phone are required' });
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (score < 2) {
    return res.status(400).json({ error: 'Password is too weak — include uppercase, numbers, or symbols' });
  }

  const identifier = email || `${phone.replace(/\D/g, '')}@phone.kigalitech.com`;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, ...(phone ? [{ phoneNumber: phone }] : [])] },
  });
  if (existing) return res.status(400).json({ error: 'Account already exists with this email or phone' });

  const hashed = await bcrypt.hash(password, 10);
  const isPhoneOnly = !email;

  const user = await prisma.user.create({
    data: {
      name,
      email: identifier.toLowerCase(),
      password: hashed,
      phoneNumber: phone || null,
      role: 'user',
      // Phone-only accounts are auto-verified; email accounts require verification
      emailVerified: isPhoneOnly ? new Date() : null,
    },
  });

  if (!isPhoneOnly) {
    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
    sendVerificationEmail({ email: user.email, name: user.name, code }).catch(() => {});
    return res.status(201).json({ requiresVerification: true, email: user.email });
  }

  return res.status(201).json({ id: user.id, name: user.name, email: user.email });
}
