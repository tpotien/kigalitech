import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = String(code).trim();

  const token = await prisma.verificationToken.findFirst({
    where: { identifier: normalizedEmail, token: normalizedCode },
  });

  if (!token) return res.status(400).json({ error: 'Invalid verification code' });
  if (token.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
    return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

  return res.status(200).json({ success: true });
}
