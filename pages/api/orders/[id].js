import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const id = Number(req.query.id);
  if (req.method !== 'GET') return res.status(405).end();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, images: true, category: true } } } },
      user: { select: { name: true, email: true, image: true } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
}
