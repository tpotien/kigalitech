import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list all zones (including inactive)
  if (req.method === 'GET') {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return res.json(zones);
  }

  // POST - create zone
  if (req.method === 'POST') {
    const { name, fee, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { estimatedDays } = req.body;
    const zone = await prisma.deliveryZone.create({
      data: {
        name: name.trim(),
        fee: fee ? Math.round(Number(fee)) : 0,
        active: true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        estimatedDays: estimatedDays ? Number(estimatedDays) : 1,
      },
    });
    return res.status(201).json(zone);
  }

  // PATCH - update zone (toggle active, change name/fee)
  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const data = {};
    if (updates.name !== undefined) data.name = updates.name.trim();
    if (updates.fee !== undefined) data.fee = Math.round(Number(updates.fee));
    if (updates.active !== undefined) data.active = Boolean(updates.active);
    if (updates.sortOrder !== undefined) data.sortOrder = Number(updates.sortOrder);
    if (updates.estimatedDays !== undefined) data.estimatedDays = Number(updates.estimatedDays);

    const zone = await prisma.deliveryZone.update({ where: { id: Number(id) }, data });
    return res.json(zone);
  }

  // DELETE - remove zone
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    await prisma.deliveryZone.delete({ where: { id: Number(id) } });
    return res.json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
