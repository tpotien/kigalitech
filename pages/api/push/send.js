import webpush from 'web-push';
import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

webpush.setVapidDetails(
  'mailto:kigalitechservices@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).end();

  const { title, body, url = '/', userIds } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });

  const where = userIds?.length ? { userId: { in: userIds.map(Number) } } : {};
  const subs = await prisma.pushSubscription.findMany({ where });

  const payload = JSON.stringify({ title, body, url, icon: '/logo.png', badge: '/logo.png' });
  let sent = 0, failed = 0;

  await Promise.allSettled(subs.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      sent++;
    } catch (err) {
      failed++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }));

  res.json({ total: subs.length, sent, failed });
}
