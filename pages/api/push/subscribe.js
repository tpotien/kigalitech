import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (req.method === 'POST') {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: 'Invalid subscription' });
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: token?.sub ? Number(token.sub) : null },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: token?.sub ? Number(token.sub) : null },
    });
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body || {};
    if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
