import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return res.status(401).end();

  let user = await prisma.user.findUnique({ where: { id: Number(token.id) } });
  if (!user.referralCode) {
    const code = 'REF-' + user.name?.replace(/\s/g,'').slice(0,4).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
    user = await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ code: user.referralCode, referrals });
}
