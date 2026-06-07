import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { productId, email, name, phone } = req.body;
    if (!productId || !email || !name) return res.status(400).json({ error: 'Name and email are required' });

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product || !product.preOrder) return res.status(404).json({ error: 'Pre-order not available for this product' });

    const existing = await prisma.preOrder.findFirst({
      where: { productId: Number(productId), email: email.toLowerCase() }
    });
    if (existing) return res.status(400).json({ error: 'You already have a pre-order for this product!' });

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const preOrder = await prisma.preOrder.create({
      data: {
        productId: Number(productId),
        userId: token?.id ? Number(token.id) : 1,
        email: email.toLowerCase(),
        name,
        phone: phone || '',
        depositPaid: product.preOrderDeposit || 0,
        status: 'pending',
      }
    });
    return res.status(201).json(preOrder);
  }

  if (req.method === 'GET') {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return res.status(401).end();
    const preOrders = await prisma.preOrder.findMany({
      where: { userId: Number(token.id) },
      include: { product: { select: { id: true, name: true, images: true, preOrderDate: true, price: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(preOrders);
  }

  res.status(405).end();
}
