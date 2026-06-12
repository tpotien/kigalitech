import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

const GRACE_MONTHS = 5;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  const user = await prisma.user.findUnique({
    where: { id: Number(token.id) },
    select: {
      sellerStatus: true,
      sellerSuspendedReason: true,
      sellerSubscriptionExp: true,
      sellerFirstListingAt: true,
    },
  });

  if (!user) return res.status(404).json({ error: 'Not found' });

  const now = new Date();
  let graceExpired = false;
  let graceDaysLeft = null;

  if (user.sellerFirstListingAt) {
    const graceEnd = new Date(user.sellerFirstListingAt);
    graceEnd.setMonth(graceEnd.getMonth() + GRACE_MONTHS);
    graceExpired = now > graceEnd;
    if (!graceExpired) {
      graceDaysLeft = Math.ceil((graceEnd - now) / (1000 * 60 * 60 * 24));
    }
  }

  const subscriptionActive = !!(user.sellerSubscriptionExp && new Date(user.sellerSubscriptionExp) > now);
  const canList = user.sellerStatus === 'active' && (!graceExpired || subscriptionActive);

  return res.json({ ...user, graceExpired, graceDaysLeft, subscriptionActive, canList });
}
