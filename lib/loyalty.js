import prisma from './prisma';

/**
 * Award loyalty points to a user after a purchase.
 * Rate: 1 point per $1 spent (orderTotalCents / 100, rounded down).
 *
 * @param {number} userId
 * @param {number} orderId
 * @param {number} orderTotalCents  - order total in cents
 * @returns {Promise<{ pointsAwarded: number, newBalance: number }>}
 */
export async function awardLoyaltyPoints(userId, orderId, orderTotalCents) {
  const pointsAwarded = Math.floor(orderTotalCents / 100);
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
