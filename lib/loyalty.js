import prisma from './prisma';

const POINTS_PER_DOLLAR = 0.05; // 1 pt per $20 spent (rare by design)
const MAX_POINTS_PER_ORDER = 15; // hard cap per single order

export async function awardLoyaltyPoints(userId, orderId, orderTotalRwf) {
  const raw = Math.floor((orderTotalRwf / 1475) * POINTS_PER_DOLLAR);
  const pointsAwarded = Math.min(raw, MAX_POINTS_PER_ORDER);
  if (pointsAwarded <= 0) return { pointsAwarded: 0, newBalance: 0 };

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: Number(userId) },
      data: { loyaltyPoints: { increment: pointsAwarded } },
      select: { loyaltyPoints: true },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId: Number(userId),
        points: pointsAwarded,
        action: 'earn',
        reason: `Earned ${pointsAwarded} pts from order #${orderId}`,
        orderId: Number(orderId),
      },
    }),
  ]);

  return { pointsAwarded, newBalance: updatedUser.loyaltyPoints };
}
