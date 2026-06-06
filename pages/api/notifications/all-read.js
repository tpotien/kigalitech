import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  await prisma.notification.updateMany({ where: { userId: Number(token.id), read: false }, data: { read: true } });
  return res.json({ success: true });
}
