import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, email, phone, userId } = req.body;

  if (!productId || !email) {
    return res.status(400).json({ error: 'productId and email are required' });
  }

  // Validate product exists
  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Avoid duplicate alerts for same email+product
  const existing = await prisma.stockAlert.findFirst({
    where: { productId: Number(productId), email, notified: false },
  });
  if (existing) {
    return res.json({ ok: true, message: 'Already subscribed' });
  }

  await prisma.stockAlert.create({
    data: {
      productId: Number(productId),
      email,
      phone: phone || null,
      userId: userId ? Number(userId) : null,
      notified: false,
    },
  });

  return res.json({ ok: true });
}
