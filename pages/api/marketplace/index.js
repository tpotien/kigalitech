import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

const GRACE_MONTHS = 5;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { category, status = 'approved', search, skip = '0', take = '20' } = req.query;
    const where = {
      status,
      seller: { sellerStatus: 'active' },
      ...(category && category !== 'All' && { category }),
      ...(search && { OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]}),
    };
    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: { seller: { select: { name: true, image: true, phoneNumber: true } } },
        orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
        skip: Number(skip),
        take: Number(take),
      }),
      prisma.marketplaceListing.count({ where }),
    ]);
    if (!search) res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.json({ listings, total });
  }

  if (req.method === 'POST') {
    const token = await getToken({ req });
    if (!token) return res.status(401).json({ error: 'Sign in to list an item' });

    const seller = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      select: { sellerStatus: true, sellerSubscriptionExp: true, sellerFirstListingAt: true },
    });

    if (!seller) return res.status(404).json({ error: 'User not found' });

    if (seller.sellerStatus === 'suspended') {
      return res.status(403).json({ error: 'Your seller account is suspended. Contact support.' });
    }
    if (seller.sellerStatus === 'inactive') {
      return res.status(403).json({ error: 'Your seller account is inactive. Pay the monthly subscription (RWF 10,000) to continue.' });
    }

    // Check grace period
    const now = new Date();
    if (seller.sellerFirstListingAt) {
      const graceEnd = new Date(seller.sellerFirstListingAt);
      graceEnd.setMonth(graceEnd.getMonth() + GRACE_MONTHS);
      const graceExpired = now > graceEnd;
      const subActive = seller.sellerSubscriptionExp && new Date(seller.sellerSubscriptionExp) > now;
      if (graceExpired && !subActive) {
        return res.status(403).json({ error: 'Your 5-month grace period has ended. Pay the monthly subscription (RWF 10,000) to list items.' });
      }
    }

    const { title, description, price, category, condition, images, phone, location, negotiable } = req.body;
    if (!title || !price || !category) return res.status(400).json({ error: 'Title, price, and category required' });
    if (!phone?.trim()) return res.status(400).json({ error: 'A contact phone number is required so buyers can reach you' });

    const updateData = {};
    if (!seller.sellerFirstListingAt) updateData.sellerFirstListingAt = now;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id: Number(token.id) }, data: updateData });
    }

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
        negotiable: Boolean(negotiable),
        status: 'pending',
      },
    });
    return res.status(201).json(listing);
  }

  res.status(405).end();
}
