import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

const DEFAULTS = {
  siteName: 'KigaliTech',
  tagline: 'Your trusted tech partner in Kigali, Rwanda',
  logoUrl: '',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250700000000',
  currency: 'USD',
  primaryColor: '#0284c7',
  address: 'Kigali, Rwanda',
  email: 'info@kigalitech.com',
  phone: '+250 700 000 000',
  // Flash Deal
  flashDealProductId: '',
  flashDealDiscount: '25',
  flashDealHours: '8',
  flashDealLabel: 'Flash Deal — Ends Soon',
  // Hero / New Arrival
  heroBadgeText: 'New Arrivals Just Dropped',
  heroTitle: 'Tech That\nElevates\nYour Life',
  heroSubtitle: 'Premium electronics — phones, laptops, audio, wearables — with fast delivery, real warranties, and zero compromise.',
  heroImageUrl: '',
  heroProductId: '',
  heroPriceLabel: 'Starting from',
  heroPrice: '$129.99',
};

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (req.method === 'GET') {
    const rows = await prisma.siteConfig.findMany();
    const config = { ...DEFAULTS };
    rows.forEach(r => { config[r.key] = r.value; });
    return res.json(config);
  }

  if (req.method === 'PUT') {
    if (!token || !['admin'].includes(token.role)) return res.status(403).json({ error: 'Admin only' });
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    return res.json({ success: true });
  }

  res.status(405).end();
}
