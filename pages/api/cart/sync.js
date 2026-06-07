import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return res.json({ ok: true }); // Not logged in, skip

  const { items } = req.body;
  const itemsStr = JSON.stringify(items || []);

  if (!items || items.length === 0) {
    // Cart cleared — delete abandoned cart record
    await prisma.abandonedCart.deleteMany({ where: { userId: Number(token.id) } });
    return res.json({ ok: true });
  }

  await prisma.abandonedCart.upsert({
    where: { userId: Number(token.id) },
    update: { items: itemsStr, emailSent: false, updatedAt: new Date() },
    create: { userId: Number(token.id), email: token.email, items: itemsStr },
  });

  return res.json({ ok: true });
}
