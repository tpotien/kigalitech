import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const userId = Number(token.sub);

  if (req.method === 'GET') {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json(addresses);
  }

  if (req.method === 'POST') {
    const { label, name, phone, address, isDefault } = req.body;
    if (!name || !phone || !address) return res.status(400).json({ error: 'name, phone, address required' });
    if (isDefault) {
      await prisma.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const saved = await prisma.savedAddress.create({
      data: { userId, label: label || 'Home', name, phone, address, isDefault: Boolean(isDefault) },
    });
    return res.status(201).json(saved);
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    const addr = await prisma.savedAddress.findUnique({ where: { id: Number(id) } });
    if (!addr || addr.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (updates.isDefault) {
      await prisma.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const updated = await prisma.savedAddress.update({ where: { id: Number(id) }, data: updates });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const addr = await prisma.savedAddress.findUnique({ where: { id: Number(id) } });
    if (!addr || addr.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
    await prisma.savedAddress.delete({ where: { id: Number(id) } });
    return res.json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  return res.status(405).end();
}
