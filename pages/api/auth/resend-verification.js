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

  // Rate-limit: check if a token was created in the last 60 seconds
  const recent = await prisma.verificationToken.findFirst({
    where: { identifier: normalizedEmail, expires: { gt: new Date(Date.now() + 9 * 60 * 1000) } },
  });
  if (recent) return res.status(429).json({ error: 'Please wait before requesting another code' });

  await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: code,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  sendVerificationEmail({ email: normalizedEmail, name: user.name, code }).catch(() => {});

  return res.status(200).json({ success: true });
}
