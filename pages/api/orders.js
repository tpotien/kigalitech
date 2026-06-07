import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, userId, deliverySlot, deliveryDate } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order items' });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = await prisma.order.create({
    data: {
      total,
      userId: userId || undefined,
      deliverySlot: deliverySlot || '',
      deliveryDate: deliveryDate || '',
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
          storage: item.storage,
          warranty: item.warranty,
          serial: item.serial || 'N/A'
        }))
      }
    },
    include: { items: true }
  });

  const receiptUrl = `/orders/${order.id}/receipt`;
  await prisma.order.update({ where: { id: order.id }, data: { receiptUrl } });
  res.status(201).json({ orderId: order.id, receiptUrl });
}
