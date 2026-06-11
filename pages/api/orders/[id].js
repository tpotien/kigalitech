import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const id = Number(req.query.id);
  if (req.method !== 'GET') return res.status(405).end();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, images: true, category: true } } } },
      user: { select: { name: true, email: true, image: true } },
      returnRequest: { select: { id: true, status: true, reason: true, createdAt: true } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Not found' });

  // Strip base64 images from order item products to keep response small
  const stripped = {
    ...order,
    items: order.items.map(item => {
      if (!item.product?.images) return item;
      let firstImg = '';
      try { firstImg = JSON.parse(item.product.images)[0] || ''; } catch {}
      if (firstImg.startsWith('data:')) firstImg = '';
      return { ...item, product: { ...item.product, images: JSON.stringify([firstImg]) } };
    }),
  };
  res.json(stripped);
}
