import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { productId } = req.query;
    const reviews = await prisma.review.findMany({
      where: { productId: Number(productId), approved: true },
      include: { user: { select: { name: true, image: true, role: true, verifiedBuyer: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.json({ reviews, avg, count: reviews.length });
  }

  if (req.method === 'POST') {
    const token = await getToken({ req });
    if (!token) return res.status(401).json({ error: 'Sign in to leave a review' });

    const { productId, rating, title, body, images } = req.body;
    if (!productId || !rating || !title || !body) return res.status(400).json({ error: 'All fields required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    // Validate images: must be array of strings (URLs), max 3
    let imageUrls = [];
    if (images) {
      if (!Array.isArray(images)) return res.status(400).json({ error: 'images must be an array' });
      imageUrls = images.slice(0, 3).filter(u => typeof u === 'string' && u.trim() !== '');
    }

    // Check if user purchased this product
    const purchased = await prisma.orderItem.findFirst({
      where: { productId: Number(productId), order: { userId: Number(token.id) } },
    });

    const existing = await prisma.review.findFirst({ where: { userId: Number(token.id), productId: Number(productId) } });
    if (existing) return res.status(400).json({ error: 'You already reviewed this product' });

    const review = await prisma.review.create({
      data: {
        userId: Number(token.id),
        productId: Number(productId),
        rating: Number(rating),
        title,
        body,
        images: JSON.stringify(imageUrls),
        verified: !!purchased,
      },
      include: { user: { select: { name: true, image: true, role: true, verifiedBuyer: true } } },
    });
    return res.status(201).json(review);
  }

  res.status(405).end();
}
