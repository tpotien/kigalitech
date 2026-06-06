import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { category, status = 'approved', search } = req.query;
    const listings = await prisma.marketplaceListing.findMany({
      where: {
        status,
        ...(category && category !== 'All' && { category }),
        ...(search && { OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ]}),
      },
      include: { seller: { select: { name: true, image: true, phoneNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(listings);
  }

  if (req.method === 'POST') {
    const token = await getToken({ req });
    if (!token) return res.status(401).json({ error: 'Sign in to list an item' });
    const { title, description, price, category, condition, images, phone, location } = req.body;
    if (!title || !price || !category) return res.status(400).json({ error: 'Title, price, and category required' });

    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: Number(token.id),
        title,
        description: description || '',
        price: Number(price),
        category,
        condition: condition || 'good',
        images: JSON.stringify(images || []),
        phone: phone || '',
        location: location || '',
        status: 'pending',
      },
    });
    return res.status(201).json(listing);
  }

  res.status(405).end();
}
