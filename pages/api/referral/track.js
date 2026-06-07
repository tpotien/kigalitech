import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { code, newUserId, newUserEmail } = req.body;
  if (!code) return res.status(400).end();

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer) return res.status(404).json({ error: 'Invalid referral code' });

  // Avoid self-referral
  if (referrer.id === Number(newUserId)) return res.status(400).json({ error: 'Cannot refer yourself' });

  // Check not already tracked
  const existing = await prisma.referral.findFirst({
    where: { referrerId: referrer.id, referredEmail: newUserEmail }
  });
  if (existing) return res.json({ ok: true });

  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredEmail: newUserEmail,
      referredUserId: newUserId ? Number(newUserId) : null,
      code,
      status: 'pending',
    }
  });

  return res.json({ ok: true });
}
