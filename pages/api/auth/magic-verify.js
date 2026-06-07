import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.redirect('/signin?magic=invalid');
  }

  const normalizedEmail = decodeURIComponent(email).toLowerCase().trim();

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: `magic:${normalizedEmail}`, token } },
  });

  if (!record || record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: `magic:${normalizedEmail}` } });
    return res.redirect('/signin?magic=expired');
  }

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: `magic:${normalizedEmail}`, token } },
  });

  // Mark user as verified and get a one-time code to hand back to credentials provider
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.verificationToken.create({
    data: {
      identifier: `otp:${normalizedEmail}`,
      token: otp,
      expires: new Date(Date.now() + 2 * 60 * 1000), // 2 min — just long enough to redirect
    },
  });

  // Also mark the user email as verified now
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });

  // Redirect to signin page with auto-login params
  return res.redirect(`/signin?magic=ok&email=${encodeURIComponent(normalizedEmail)}&otp=${otp}`);
}
