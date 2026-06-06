import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] } },
      select: { id: true, name: true, email: true, image: true, role: true },
      orderBy: { id: 'asc' },
    });
    return res.json(staff);
  }

  if (req.method === 'POST') {
    const { email, name, role } = req.body;
    if (!email || !['staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const updated = await prisma.user.update({ where: { email }, data: { role } });
      return res.json(updated);
    }
    const user = await prisma.user.create({ data: { email, name: name || email, role } });
    return res.status(201).json(user);
  }

  if (req.method === 'PATCH') {
    const { id, role } = req.body;
    if (!id || !['staff', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const user = await prisma.user.update({ where: { id }, data: { role } });
    return res.json(user);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.user.update({ where: { id }, data: { role: 'user' } });
    return res.json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  res.status(405).end();
}
