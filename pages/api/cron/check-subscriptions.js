import prisma from '../../../lib/prisma';

const GRACE_MONTHS = 5;

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || 'kigalitech-cron'}`) {
    return res.status(401).end();
  }

  const now = new Date();

  // Grace period cutoff: sellers who first listed more than 5 months ago
  const graceExpiredCutoff = new Date(now);
  graceExpiredCutoff.setMonth(graceExpiredCutoff.getMonth() - GRACE_MONTHS);

  // Find active sellers whose grace period has expired AND have no active subscription
  // Never deactivate admin or staff accounts
  const toDeactivate = await prisma.user.findMany({
    where: {
      sellerStatus: 'active',
      role: { notIn: ['admin', 'staff'] },
      sellerFirstListingAt: { not: null, lt: graceExpiredCutoff },
      OR: [
        { sellerSubscriptionExp: null },
        { sellerSubscriptionExp: { lt: now } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  if (toDeactivate.length === 0) {
    return res.json({ deactivated: 0, message: 'No expired subscriptions found' });
  }

  await prisma.user.updateMany({
    where: { id: { in: toDeactivate.map(u => u.id) } },
    data: {
      sellerStatus: 'inactive',
      sellerSuspendedReason: 'non_payment',
    },
  });

  return res.json({
    deactivated: toDeactivate.length,
    sellers: toDeactivate.map(u => ({ id: u.id, email: u.email, name: u.name })),
  });
}
