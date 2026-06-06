import prisma from '../../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  await prisma.wishlist.deleteMany({
    where: { userId: Number(token.id), productId: Number(req.query.productId) },
  });
  return res.json({ ok: true });
}
