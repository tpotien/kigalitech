import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return res.status(401).end();
  const user = await prisma.user.findUnique({
    where: { id: Number(token.id) },
    select: { verifiedBuyer: true, role: true }
  });
  return res.json(user || { verifiedBuyer: false, role: 'user' });
}
