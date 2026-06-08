import prisma from './prisma';

const POINTS_PER_DOLLAR = 1.5; // 1.5 pts per RWF 1,475 (= per $1)

/**
 * Award loyalty points to a user after a purchase.
 * Rate: 1.5 points per RWF 1,475 spent (= 1.5 pts per $1 at 1 USD = 1475 RWF).
 *
 * @param {number} userId
 * @param {number} orderId
 * @param {number} orderTotalCents  - order total in USD cents
 * @returns {Promise<{ pointsAwarded: number, newBalance: number }>}
 */
export async function awardLoyaltyPoints(userId, orderId, orderTotalCents) {
  const pointsAwarded = Math.floor((orderTotalCents / 100) * POINTS_PER_DOLLAR);
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
