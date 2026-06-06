import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (req.method === 'GET') {
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const tradeIns = await prisma.tradeIn.findMany({
      where: { userId: Number(token.id) },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(tradeIns);
  }

  if (req.method === 'POST') {
    if (!token) return res.status(401).json({ error: 'Sign in to submit a trade-in' });
    const { productName, brand, condition, description, images, askingPrice } = req.body;
    if (!productName || !condition) return res.status(400).json({ error: 'Product name and condition required' });

    const tradeIn = await prisma.tradeIn.create({
      data: {
        userId: Number(token.id),
        productName,
        brand: brand || '',
        condition,
        description: description || '',
        images: JSON.stringify(images || []),
        askingPrice: Number(askingPrice || 0),
      },
    });
    return res.status(201).json(tradeIn);
  }

  res.status(405).end();
}
