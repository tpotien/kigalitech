import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).end();
  const count = await prisma.pushSubscription.count();
  res.json({ count });
}
