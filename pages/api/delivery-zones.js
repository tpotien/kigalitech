import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
  const zones = await prisma.deliveryZone.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return res.json(zones);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
