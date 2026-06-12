import prisma from '../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ error: 'productId required' });
  const pid = Number(productId);

  if (req.method === 'GET') {
    if (!token) return res.json({ subscribed: false });
    const alert = await prisma.priceAlert.findFirst({ where: { productId: pid, userId: Number(token.id), notified: false } });
    return res.json({ subscribed: !!alert });
  }

  if (req.method === 'POST') {
    const { email } = req.body || {};
    const userId = token ? Number(token.id) : null;
    const alertEmail = email || token?.email || null;
    if (!userId && !alertEmail) return res.status(400).json({ error: 'email required' });
    const exists = await prisma.priceAlert.findFirst({ where: { productId: pid, ...(userId ? { userId } : { email: alertEmail }), notified: false } });
    if (exists) return res.json({ ok: true, already: true });
    await prisma.priceAlert.create({ data: { productId: pid, userId, email: alertEmail } });
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (!token) return res.status(401).json({ error: 'Sign in required' });
    await prisma.priceAlert.deleteMany({ where: { productId: pid, userId: Number(token.id) } });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
