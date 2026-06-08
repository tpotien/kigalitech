import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

const DEFAULTS = {
  siteName: 'KigaliTech',
  tagline: 'Your trusted tech partner in Kigali, Rwanda',
  logoUrl: '',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250786276555',
  currency: 'RWF',
  usdToRwf: '1475',
  primaryColor: '#0284c7',
  address: 'Kigali, Rwanda',
  email: 'info@kigalitechservices.com',
  phone: '+250 786 276 555',
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
  heroPrice: 'RWF 190,000',
};

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (req.method === 'GET') {
    const rows = await prisma.siteConfig.findMany();
    const config = { ...DEFAULTS };
    rows.forEach(r => { config[r.key] = r.value; });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
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
    // Immediately revalidate ISR pages so hero image / config changes are instant
    try {
      await res.revalidate('/');
      await res.revalidate('/deals');
    } catch (_) {}
    return res.json({ success: true });
  }

  res.status(405).end();
}
