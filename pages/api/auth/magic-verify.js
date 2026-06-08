import prisma from '../../../lib/prisma';

const SITE = process.env.NEXTAUTH_URL || 'https://kigalitechservices.com';

export default async function handler(req, res) {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.redirect(302, `${SITE}/signin?magic=invalid`);
  }

  let normalizedEmail;
  try {
    normalizedEmail = decodeURIComponent(email).toLowerCase().trim();
  } catch {
    return res.redirect(302, `${SITE}/signin?magic=invalid`);
  }

  try {
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: `magic:${normalizedEmail}`,
        token,
      },
    });

    if (!record) {
      console.log('[magic-verify] token not found for', normalizedEmail);
      return res.redirect(302, `${SITE}/signin?magic=expired`);
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: `magic:${normalizedEmail}` } });
      console.log('[magic-verify] token expired for', normalizedEmail);
      return res.redirect(302, `${SITE}/signin?magic=expired`);
    }

    // Consume the magic token
    await prisma.verificationToken.deleteMany({ where: { identifier: `magic:${normalizedEmail}` } });

    // Auto-verify email and ensure user exists
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: normalizedEmail, name: normalizedEmail.split('@')[0], role: 'user', emailVerified: new Date() },
      });
    } else {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: user.emailVerified || new Date() },
      });
    }

    // Issue a short-lived OTP for the credentials provider to consume
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up any old OTPs first
    await prisma.verificationToken.deleteMany({ where: { identifier: `otp:${normalizedEmail}` } });

    await prisma.verificationToken.create({
      data: {
        identifier: `otp:${normalizedEmail}`,
        token: otp,
        expires: new Date(Date.now() + 3 * 60 * 1000),
      },
    });

    console.log('[magic-verify] success for', normalizedEmail);
    return res.redirect(302, `${SITE}/signin?magic=ok&email=${encodeURIComponent(normalizedEmail)}&otp=${otp}`);
  } catch (err) {
    console.error('[magic-verify] error:', err.message);
    return res.redirect(302, `${SITE}/signin?magic=invalid`);
  }
}
