import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId } = req.body;
  if (!userId) return res.status(400).end();

  const referral = await prisma.referral.findFirst({
    where: { referredUserId: Number(userId), status: 'pending', rewardGiven: false }
  });
  if (!referral) return res.json({ ok: true, noReferral: true });

  // Give 2000 loyalty points to referrer (worth ~$2 or 2000 RWF)
  await prisma.$transaction([
    prisma.user.update({ where: { id: referral.referrerId }, data: { loyaltyPoints: { increment: 2000 } } }),
    prisma.loyaltyTransaction.create({
      data: { userId: referral.referrerId, points: 2000, action: 'earn', reason: 'referral', orderId: null }
    }),
    prisma.referral.update({ where: { id: referral.id }, data: { status: 'completed', rewardGiven: true } }),
  ]);

  return res.json({ ok: true });
}
