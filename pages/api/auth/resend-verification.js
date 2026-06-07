import prisma from '../../../lib/prisma';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return res.status(400).json({ error: 'Account not found' });
  if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

  // Delete any old tokens and issue a fresh one immediately
  await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: code,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  try {
    await sendVerificationEmail({ email: normalizedEmail, name: user.name, code });
  } catch (e) {
    console.error('[resend-verification] email failed:', e.message);
  }

  return res.status(200).json({ success: true });
}
