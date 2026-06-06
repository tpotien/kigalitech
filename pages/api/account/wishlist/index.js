import prisma from '../../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  const userId = Number(token.id);

  if (req.method === 'GET') {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: { product: { select: { id: true, name: true, price: true, images: true, category: true, stock: true, comparePrice: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(wishlist);
  }

  if (req.method === 'POST') {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    try {
      const item = await prisma.wishlist.create({ data: { userId, productId: Number(productId) } });
      return res.status(201).json(item);
    } catch {
      return res.status(409).json({ error: 'Already in wishlist' });
    }
  }

  res.status(405).end();
}
